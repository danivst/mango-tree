import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user";
import { sendEmail } from "../utils/email";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../config/env";
import RoleTypeValue from "../enums/role-type";
import { getDualTranslation } from "../utils/translation";
import { AuthRequest } from "../utils/auth";

// Helper to get translation based on user language
const getLocalizedText = (
  userLang: string,
  translations: { bg: string; en: string },
): string => {
  return userLang === "bg" ? translations.bg : translations.en;
};

/* ---------- ENABLE 2FA ---------- */
export const enable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is already enabled." });
    }

    // Generate a 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Set code expiry (10 minutes from now)
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save code to user
    user.twoFactorCode = code;
    user.twoFactorCodeExpiry = codeExpiry;
    await user.save();

    // Send email with the code
    const userLang = user.language || "en";

    const [titleTrans, introTrans, codeLabelTrans, securityNoteTrans, signatureTrans] =
      await Promise.all([
        getDualTranslation("MangoTree Two-Factor Authentication"),
        getDualTranslation(
          "To enable two-factor authentication on your account, please use the following 6-digit verification code:",
        ),
        getDualTranslation("Your verification code:"),
        getDualTranslation(
          "This code will expire in 10 minutes. If you did not request this, please ignore this email.",
        ),
        getDualTranslation("Sincerely, the MangoTree team"),
      ]);

    const title = getLocalizedText(userLang, titleTrans);
    const intro = getLocalizedText(userLang, introTrans);
    const codeLabel = getLocalizedText(userLang, codeLabelTrans);
    const securityNote = getLocalizedText(userLang, securityNoteTrans);
    const signature = getLocalizedText(userLang, signatureTrans);

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">${intro}</p>
        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; background: #f5f5f5; padding: 20px 40px; border-radius: 8px; border: 2px dashed #E77728;">
            <h1 style="color: #E77728; margin: 0; font-size: 48px; letter-spacing: 12px; font-weight: bold;">${code}</h1>
          </div>
        </div>
        <p style="font-size: 14px; color: #666; margin: 20px 0;">${securityNote}</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${signature}</p>
      </div>
    `;

    try {
      await sendEmail(user.email, title, emailHtml);
    } catch (error: any) {
      console.error("Failed to send 2FA enable email:", error);
      // Clear the code if email fails
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    return res.json({
      message: "Verification code sent to your email. Please enter it to enable 2FA.",
      email: user.email,
    });
  } catch (error: any) {
    console.error("Enable 2FA error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* ---------- VERIFY 2FA CODE (for login) ---------- */
export const verify2FA = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId, code } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return res.status(400).json({ message: "Invalid verification code. Must be 6 digits." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if there's a stored code
    if (!user.twoFactorCode || !user.twoFactorCodeExpiry) {
      return res.status(400).json({ message: "No verification code found. Please log in again." });
    }

    // Check if code has expired
    if (new Date() > new Date(user.twoFactorCodeExpiry)) {
      // Clear expired code
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res.status(400).json({ message: "Verification code has expired. Please log in again." });
    }

    // Check if code matches
    if (user.twoFactorCode !== code) {
      return res.status(400).json({ message: "Incorrect verification code." });
    }

    // Enable 2FA (if not already enabled) and clear the code
    user.twoFactorEnabled = true;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    // Issue JWT tokens (same as normal login)
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Successfully logged in!",
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        bio: user.bio,
        translations: user.translations,
      },
      redirectTo:
        user.role === RoleTypeValue.ADMIN ? "/admin/dashboard" : "/home",
    });
  } catch (error: any) {
    console.error("Verify 2FA error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* ---------- DISABLE 2FA ---------- */
export const disable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled." });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    return res.json({
      message: "Two-factor authentication has been disabled successfully.",
      twoFactorEnabled: false,
    });
  } catch (error: any) {
    console.error("Disable 2FA error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* ---------- GET 2FA STATUS ---------- */
export const get2FAStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      twoFactorEnabled: user.twoFactorEnabled || false,
    });
  } catch (error: any) {
    console.error("Get 2FA status error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

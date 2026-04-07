import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user";
import { sendEmail } from "../utils/email";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../config/env";
import RoleTypeValue from "../enums/role-type";
import { getDualTranslation } from "../utils/translation";
import { AuthRequest } from "../interfaces/auth";
import { get2FAEmailTemplate } from "../utils/email-templates";
import { getLocalizedText } from "../utils/get-translation";
import { logActivity } from "../utils/activity-logger";

/**
 * @file 2fa-controller.ts
 * @description Handles Two-Factor Authentication (2FA) endpoints.
 * Supports enabling, verifying, disabling, and checking 2FA status.
 */

/**
 * Initiates the 2FA enablement process for a logged-in user.
 * Generates a temporary 6-digit code, stores it with a 10-minute expiry,
 * and sends it via email in the user's preferred language.
 *
 * @param req - AuthRequest containing authenticated user's ID
 * @param res - Response with message and email, or error status
 * @returns 200 with verification email sent confirmation, 400 if 2FA already enabled,
 *          401 if unauthorized, 404 if user not found, 500 if email fails
 */
export const enable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // 1. extract user id from the authenticated request
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "unauthorized." });
    }

    // 2. fetch user and check if 2fa is already active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found." });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2fa is already enabled." });
    }

    // 3. generate a secure 6-digit numeric string
    const code = crypto.randomInt(100000, 999999).toString();

    // 4. set expiration window (currently 10 minutes)
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // 5. persist the temporary code and expiry to the user document
    user.twoFactorCode = code;
    user.twoFactorCodeExpiry = codeExpiry;
    await user.save();

    // 6. localize email content based on user's preferred language
    const userLang = user.language || "en";

    const [titleTrans, introTrans, securityNoteTrans, signatureTrans] =
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
    const securityNote = getLocalizedText(userLang, securityNoteTrans);
    const signature = getLocalizedText(userLang, signatureTrans);

    // 7. construct email html using the specialized 2fa template
    const emailHtml = get2FAEmailTemplate({
      title,
      intro,
      code,
      securityNote,
      signature,
    });

    // 8. attempt to send the email; if it fails, clear the code to prevent stale data
    try {
      await sendEmail(user.email, title, emailHtml);
    } catch (error: any) {
      console.error("failed to send 2fa enable email:", error);
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res.status(500).json({ message: "failed to send verification email. please try again." });
    }

    return res.json({
      message: "verification code sent to your email. please enter it to enable 2fa.",
      email: user.email,
    });
  } catch (error: any) {
    console.error("enable 2fa error:", error);
    return res.status(500).json({ message: "internal server error." });
  }
};

/**
 * Verifies a 6-digit 2FA code.
 * If successful, enables 2FA for the user and issues a full login session with JWT tokens.
 *
 * @param req - Request with body { userId, code }
 * @param res - Response with tokens and user data, or error status
 * @returns 200 with tokens on success, 400 for invalid code or no code requested,
 *          404 if user not found, 500 on server error
 */
export const verify2FA = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId, code } = req.body;

    // 1. validate incoming payload
    if (!userId) {
      return res.status(400).json({ message: "user id is required." });
    }

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return res.status(400).json({ message: "invalid verification code. must be 6 digits." });
    }

    // 2. find user and verify a code was actually requested/stored
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found." });
    }

    if (!user.twoFactorCode || !user.twoFactorCodeExpiry) {
      return res.status(400).json({ message: "no verification code found. please log in again." });
    }

    // 3. check if the code is still within its validity window
    if (new Date() > new Date(user.twoFactorCodeExpiry)) {
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res.status(400).json({ message: "verification code has expired. please log in again." });
    }

    // 4. compare provided code against stored code
    if (user.twoFactorCode !== code) {
      return res.status(400).json({ message: "incorrect verification code." });
    }

    // 5. activation: enable 2fa on the account and clear the used code
    user.twoFactorEnabled = true;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    // Log 2FA enable
    await logActivity(req, '2FA_ENABLE', {
      targetId: userId,
      targetType: 'user',
      description: 'Enabled two-factor authentication',
    });

    // 6. issue authentication tokens (JWT & Refresh) for the new session
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "successfully logged in!",
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        bio: user.bio,
        translations: user.translations,
      },
      redirectTo: user.role === RoleTypeValue.ADMIN ? "/admin/dashboard" : "/home",
    });
  } catch (error: any) {
    console.error("verify 2fa error:", error);
    return res.status(500).json({ message: "internal server error." });
  }
};

/**
 * Deactivates 2FA for the authenticated user.
 * Clears 2FA settings and any pending verification codes.
 *
 * @param req - AuthRequest
 * @param res - Response with success message and twoFactorEnabled: false
 * @returns 200 on success, 401 if unauthorized, 400 if 2FA not enabled,
 *          404 if user not found, 500 on server error
 */
export const disable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "unauthorized." });
    }

    // 1. fetch user and verify 2fa is currently enabled
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "2fa is not enabled or user not found." });
    }

    // 2. toggle 2fa off and clear any remaining code data
    user.twoFactorEnabled = false;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    // Log 2FA disable
    await logActivity(req, '2FA_DISABLE', {
      targetId: userId,
      targetType: 'user',
      description: 'Disabled two-factor authentication',
    });

    return res.json({
      message: "two-factor authentication has been disabled successfully.",
      twoFactorEnabled: false,
    });
  } catch (error: any) {
    console.error("disable 2fa error:", error);
    return res.status(500).json({ message: "internal server error." });
  }
};

/**
 * Retrieves the current 2FA status for the authenticated user.
 *
 * @param req - AuthRequest
 * @param res - Response with { twoFactorEnabled: boolean }
 * @returns 200 with status, 401 if unauthorized, 404 if user not found,
 *          500 on server error
 */
export const get2FAStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "unauthorized." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found." });

    return res.json({
      twoFactorEnabled: user.twoFactorEnabled || false,
    });
  } catch (error: any) {
    console.error("get 2fa status error:", error);
    return res.status(500).json({ message: "internal server error." });
  }
};
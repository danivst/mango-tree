/**
 * @file 2fa-controller.ts
 * @description Handles Two-Factor Authentication (2FA) endpoints.
 * Supports enabling, verifying, disabling and checking 2FA status.
 */

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user-model";
import { sendEmail } from "../utils/email";
import { JWT_SECRET } from "../config/env";
import RoleTypeValue from "../enums/role-type";
import { getDualTranslation } from "../utils/translation";
import { AuthRequest } from "../interfaces/auth";
import { get2FAEmailTemplate } from "../utils/email-templates";
import { getLocalizedText } from "../utils/get-translation";
import { logActivity } from "../utils/activity-logger";
import logger from "../utils/logger";
import { setAuthCookies } from "../utils/auth-cookies";

/**
 * Initiates the 2FA enablement process.
 * Generates a temporary 6-digit code, stores it with a 10-minute expiry
 * and sends it via email in the user's preferred language.
 *
 * @param req - AuthRequest containing authenticated user's ID
 * @param res - Express response object
 * @returns Response with verification email sent confirmation
 * @throws {Error} If database save or email delivery fails
 *
 * @example
 * ```json
 * Request: (Authenticated)
 * POST /api/2fa/enable
 * ```
 * @response
 * ```json
 * {
 * "message": "Verification code sent to your email. Please enter it to enable 2FA.",
 * "email": "user@example.com"
 * }
 * ```
 */
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

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is already enabled." });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.twoFactorCode = code;
    user.twoFactorCodeExpiry = codeExpiry;
    await user.save();


    const userLang = user.language || "en";

    const [titleTrans, introTrans, securityNoteTrans, signatureTrans] =
      await Promise.all([
        getDualTranslation("MangoTree Two-Factor Authentication"),
        getDualTranslation(
          "To enable two-factor authentication on your account, please use the following 6-digit verification code:",
        ),
        getDualTranslation(
          "This code will expire in 10 minutes. If you did not request this, please ignore this email.",
        ),
        getDualTranslation("Sincerely, the MangoTree team"),
      ]);

    const title = getLocalizedText(userLang, titleTrans);
    const intro = getLocalizedText(userLang, introTrans);
    const securityNote = getLocalizedText(userLang, securityNoteTrans);
    const signature = getLocalizedText(userLang, signatureTrans);

    const emailHtml = get2FAEmailTemplate({
      title,
      intro,
      code,
      securityNote,
      signature,
    });

    try {
      await sendEmail(user.email, title, emailHtml);
    } catch (error: any) {
      logger.error(error, "Failed to send 2FA enable email");
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
      });
    }

    return res.json({
      message:
        "Verification code sent to your email. Please enter it to enable 2FA.",
      email: user.email,
    });
  } catch (error: any) {
    logger.error(error, "enable 2FA error");
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Verifies a 2FA code and enables the feature.
 * If successful, enables 2FA for the user, logs the activity and issues a full JWT session.
 *
 * @param req - Request with body { userId, code }
 * @param res - Express response object
 * @returns Response with user data; auth tokens are set in HttpOnly cookies
 * @throws {Error} Database or JWT signing errors
 *
 * @example
 * ```json
 * Request body:
 * { "userId": "...", "code": "123456" }
 * ```
 * @response
 * ```json
 * {
 * "message": "Successfully logged in!",
 * "user": { "id": "...", "username": "..." },
 * "redirectTo": "/home"
 * }
 * ```
 */
export const verify2FA = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId, code, rememberMe } = req.body as {
      userId?: string;
      code?: string;
      rememberMe?: boolean;
    };

    if (!userId) {
      return res.status(400).json({ message: "User id is required." });
    }

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return res
        .status(400)
        .json({ message: "Invalid verification code. Must be 6 digits." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.twoFactorCode || !user.twoFactorCodeExpiry) {
      return res
        .status(400)
        .json({ message: "No verification code found. Please log in again." });
    }

    if (new Date() > new Date(user.twoFactorCodeExpiry)) {
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res.status(400).json({
        message: "Verification code has expired. Please log in again.",
      });
    }

    if (user.twoFactorCode !== code) {
      return res.status(400).json({ message: "Incorrect verification code." });
    }

    user.twoFactorEnabled = true;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    await logActivity(req, "2FA_ENABLE", {
      targetId: userId,
      targetType: "user",
      description: "Enabled two-factor authentication",
    });

    const tokenExpiresIn = rememberMe ? "7d" : "24h";
    const cookieMaxAgeMs = (rememberMe ? 7 : 1) * 24 * 60 * 60 * 1000;

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: tokenExpiresIn },
    );
    setAuthCookies(res, token, cookieMaxAgeMs);

    return res.json({
      message: "Successfully logged in!",
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
    logger.error(error, "verify 2FA error");
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Deactivates 2FA for the user.
 * Toggles the status off and logs the security change activity.
 *
 * @param req - AuthRequest with user credentials
 * @param res - Express response object
 * @returns Response with deactivation confirmation
 * @throws {Error} Database update failure
 *
 * @example
 * ```json
 * Request: (Authenticated)
 * POST /api/2fa/disable
 * ```
 * @response
 * ```json
 * {
 * "message": "2FA has been disabled successfully.",
 * "twoFactorEnabled": false
 * }
 * ```
 */
export const disable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    const { code } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled." });
    }

    if (!code) {
      const newCode = crypto.randomInt(100000, 999999).toString();
      user.twoFactorCode = newCode;
      user.twoFactorCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const userLang = user.language || "en";
      const [titleTrans, introTrans, securityNoteTrans, signatureTrans] = await Promise.all([
        getDualTranslation("MangoTree Disable Two-Factor Authentication"),
        getDualTranslation("To disable two-factor authentication, please use the following verification code:"),
        getDualTranslation("Warning: This will reduce your account security."),
        getDualTranslation("Sincerely, the MangoTree team"),
      ]);

      const title = getLocalizedText(userLang, titleTrans);
      const emailHtml = get2FAEmailTemplate({
        title,
        intro: getLocalizedText(userLang, introTrans),
        code: newCode,
        securityNote: getLocalizedText(userLang, securityNoteTrans),
        signature: getLocalizedText(userLang, signatureTrans),
      });

      await sendEmail(user.email, title, emailHtml);
      return res.json({ message: "Verification code sent to your email to confirm deactivation." });
    }

    if (user.twoFactorCode !== code || !user.twoFactorCodeExpiry || new Date() > new Date(user.twoFactorCodeExpiry)) {
      return res.status(400).json({ message: "Invalid or expired code." });
    }

    user.twoFactorEnabled = false;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    await logActivity(req, "2FA_DISABLE", { targetId: userId, targetType: "user", description: "Disabled 2FA via code verification" });

    return res.json({ message: "2FA has been disabled successfully.", twoFactorEnabled: false });
  } catch (error: any) {
    logger.error(error, "disable 2FA error");
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Checks the current 2FA enablement status.
 * Used by the frontend to determine whether to show 2FA settings or login challenges.
 *
 * @param req - AuthRequest with user credentials
 * @param res - Express response object
 * @returns Response with twoFactorEnabled boolean
 * @throws {Error} Database fetch failure
 *
 * @example
 * ```json
 * Request: (Authenticated)
 * GET /api/2fa/status
 * ```
 * @response
 * ```json
 * { "twoFactorEnabled": true }
 * ```
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
    logger.error(error, "get 2FA status error");
    return res.status(500).json({ message: "Internal server error." });
  }
};

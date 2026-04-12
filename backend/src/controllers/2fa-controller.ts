/**
 * @file 2fa-controller.ts
 * @description Handles Two-Factor Authentication (2FA) endpoints.
 * Supports enabling, verifying, disabling, and checking 2FA status.
 */

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user-model";
import { sendEmail } from "../utils/email";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../config/env";
import RoleTypeValue from "../enums/role-type";
import { getDualTranslation } from "../utils/translation";
import { AuthRequest } from "../interfaces/auth";
import { get2FAEmailTemplate } from "../utils/email-templates";
import { getLocalizedText } from "../utils/get-translation";
import { logActivity } from "../utils/activity-logger";
import logger from "../utils/logger";

/**
 * Initiates the 2FA enablement process.
 * Generates a temporary 6-digit code, stores it with a 10-minute expiry,
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
 * "message": "verification code sent to your email. please enter it to enable 2fa.",
 * "email": "user@example.com"
 * }
 * ```
 */
export const enable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Extract user id from the authenticated request
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "unauthorized." });
    }

    // Fetch user and check if 2fa is already active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found." });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2fa is already enabled." });
    }

    // Generate a secure 6-digit numeric string
    const code = crypto.randomInt(100000, 999999).toString();

    // Set expiration window (10 minutes)
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Persist the temporary code and expiry to the user document
    user.twoFactorCode = code;
    user.twoFactorCodeExpiry = codeExpiry;
    await user.save();

    // Localize email content based on user's preferred language
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

    // Construct email html using the specialized 2fa template
    const emailHtml = get2FAEmailTemplate({
      title,
      intro,
      code,
      securityNote,
      signature,
    });

    // Attempt to send the email; if it fails, clear the code to prevent stale data
    try {
      await sendEmail(user.email, title, emailHtml);
    } catch (error: any) {
      logger.error(error, "failed to send 2fa enable email");
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res
        .status(500)
        .json({
          message: "failed to send verification email. please try again.",
        });
    }

    return res.json({
      message:
        "verification code sent to your email. please enter it to enable 2fa.",
      email: user.email,
    });
  } catch (error: any) {
    logger.error(error, "enable 2fa error");
    return res.status(500).json({ message: "internal server error." });
  }
};

/**
 * Verifies a 2FA code and enables the feature.
 * If successful, enables 2FA for the user, logs the activity, and issues a full JWT session.
 *
 * @param req - Request with body { userId, code }
 * @param res - Express response object
 * @returns Response with JWT tokens and user data
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
 * "message": "successfully logged in!",
 * "token": "...",
 * "refreshToken": "...",
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
    const { userId, code } = req.body;

    // Validate incoming payload
    if (!userId) {
      return res.status(400).json({ message: "user id is required." });
    }

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return res
        .status(400)
        .json({ message: "invalid verification code. must be 6 digits." });
    }

    // Find user and verify a code was actually requested/stored
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found." });
    }

    if (!user.twoFactorCode || !user.twoFactorCodeExpiry) {
      return res
        .status(400)
        .json({ message: "no verification code found. please log in again." });
    }

    // Check if the code is still within its validity window
    if (new Date() > new Date(user.twoFactorCodeExpiry)) {
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res
        .status(400)
        .json({
          message: "verification code has expired. please log in again.",
        });
    }

    // Compare provided code against stored code
    if (user.twoFactorCode !== code) {
      return res.status(400).json({ message: "incorrect verification code." });
    }

    // Activation: enable 2fa on the account and clear the used code
    user.twoFactorEnabled = true;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    // Log 2FA enable
    await logActivity(req, "2FA_ENABLE", {
      targetId: userId,
      targetType: "user",
      description: "Enabled two-factor authentication",
    });

    // Issue authentication tokens (JWT & Refresh) for the new session
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
      redirectTo:
        user.role === RoleTypeValue.ADMIN ? "/admin/dashboard" : "/home",
    });
  } catch (error: any) {
    logger.error(error, "verify 2fa error");
    return res.status(500).json({ message: "internal server error." });
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
 * "message": "two-factor authentication has been disabled successfully.",
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

    if (!userId) {
      return res.status(401).json({ message: "unauthorized." });
    }

    // Fetch user and verify 2fa is currently enabled
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled) {
      return res
        .status(400)
        .json({ message: "2fa is not enabled or user not found." });
    }

    // Toggle 2fa off and clear any remaining code data
    user.twoFactorEnabled = false;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    // Log 2FA disable
    await logActivity(req, "2FA_DISABLE", {
      targetId: userId,
      targetType: "user",
      description: "Disabled two-factor authentication",
    });

    return res.json({
      message: "two-factor authentication has been disabled successfully.",
      twoFactorEnabled: false,
    });
  } catch (error: any) {
    logger.error(error, "disable 2fa error");
    return res.status(500).json({ message: "internal server error." });
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
    logger.error(error, "get 2fa status error");
    return res.status(500).json({ message: "internal server error." });
  }
};
/**
 * @file password-controller.ts
 * @description Manages password lifecycle operations, including secure resets via tokens, 
 * initial password setup for new accounts, and authenticated password changes with notifications.
 */

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../../models/user-model";
import Notification from "../../models/notification-model";
import NotificationType from "../../enums/notification-type";
import { sendEmail } from "../../utils/email";
import { CLIENT_URL } from "../../config/env";
import { getDualTranslation } from "../../utils/translation";
import { getLocalizedText } from "../../utils/get-translation";
import { AuthRequest } from "../../interfaces/auth";
import {
  getPasswordResetEmailTemplate,
} from "../../utils/email-templates";
import { logActivity } from "../../utils/activity-logger";
import logger from "../../utils/logger";

/**
 * Sets a new password using a valid reset token.
 * Validates token expiration and password strength before updating the user.
 *
 * @param req - Request with body { token, password }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database error
 * @throws {BadRequestError} If token is expired or invalid
 *
 * @example
 * ```json
 * Request body:
 * { "token": "...", "password": "NewStrongPassword123!" }
 * ```
 * @response
 * ```json
 * { "message": "Password set successfully. You can now login." }
 * ```
 */
export const setupPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { token, password } = req.body;

  if (!token) return res.status(400).json({ message: "Token is required." });

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (
    !password ||
    password.length < 8 ||
    !hasUpperCase ||
    !hasLowerCase ||
    !hasNumber ||
    !hasSpecialChar
  ) {
    return res
      .status(400)
      .json({ message: "Invalid password strength.", field: "password" });
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token." });

  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return res.json({ message: "Password set successfully. You can now login." });
};

/**
 * Initiates the password reset process.
 * Generates a reset token and sends a localized email with a secure reset link.
 *
 * @param req - Request with body { email }
 * @param res - Express response object
 * @returns Response confirming email sent
 * @throws {Error} Email service failure
 * @throws {BadRequestError} If email is not found
 *
 * @example
 * ```json
 * Request body:
 * { "email": "user@example.com" }
 * ```
 * @response
 * ```json
 * { "message": "Email sent!" }
 * ```
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res
      .status(400)
      .json({ message: "Email does not exist.", field: "email" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 15 * 60000);

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;

  // Determine user's language preference (default to English)
  const userLang = user.language || "en";

  // Get translations for all email content
  const [
    titleTrans,
    introTrans,
    buttonTrans,
    ignoreTrans,
    automatedTrans,
    signatureTrans,
  ] = await Promise.all([
    getDualTranslation("MangoTree Password Reset"),
    getDualTranslation(
      "You have requested a password change, please click on the link below and follow the instructions. This link will expire in 15 minutes, after that you will have to submit a new request.",
    ),
    getDualTranslation("Reset Password"),
    getDualTranslation(
      "If you have not submitted this request, you can ignore this message.",
    ),
    getDualTranslation(
      "This message is automated therefore any response to it will be in vain. If you have any questions, email mangotree@support.com.",
    ),
    getDualTranslation("Sincerely, the MangoTree team"),
  ]);

  const title = getLocalizedText(userLang, titleTrans);
  const intro = getLocalizedText(userLang, introTrans);
  const buttonText = getLocalizedText(userLang, buttonTrans);
  const ignoreMsg = getLocalizedText(userLang, ignoreTrans);
  const automatedMsg = getLocalizedText(userLang, automatedTrans);
  const signature = getLocalizedText(userLang, signatureTrans);

  const emailHtml = getPasswordResetEmailTemplate({
    resetLink,
    title,
    intro,
    buttonText,
    ignoreMsg,
    automatedMsg,
    signature,
  });

  try {
    await sendEmail(email, title, emailHtml);
    return res.json({ message: "Email sent!" });
  } catch (error: any) {
    logger.error(error, "Failed to send reset email");
    return res.status(500).json({ message: "Failed to send email." });
  }
};

/**
 * Resets a password via token.
 * Consumes the reset token upon successful password update.
 *
 * @param req - Request with body { token, password, email? }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database error
 *
 * @example
 * ```json
 * Request body:
 * { "token": "...", "password": "...", "email": "user@example.com" }
 * ```
 * @response
 * ```json
 * { "message": "Password reset successfully." }
 * ```
 */
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { token, password, email } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user || (email && user.email !== email)) {
    return res
      .status(400)
      .json({ message: "Invalid token or email mismatch." });
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return res.json({ message: "Password reset successfully." });
};

/**
 * Retrieves info associated with a reset token.
 * Returns the user's email to help pre-fill UI forms.
 *
 * @param req - Request with params { token }
 * @param res - Express response object
 * @returns Response with user email
 * @throws {BadRequestError} If token is invalid or expired
 *
 * @example
 * ```json
 * GET /api/auth/reset-token-info/token123
 * ```
 * @response
 * ```json
 * { "email": "user@example.com" }
 * ```
 */
export const getResetTokenInfo = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { token } = req.params;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token." });
  return res.json({ email: user.email });
};

/**
 * Changes password for an authenticated user.
 * Requires verification of the current password before allowing the change.
 *
 * @param req - AuthRequest with body { currentPassword, newPassword }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database update failure
 * @throws {UnauthorizedError} If current password is incorrect
 *
 * @example
 * ```json
 * Request body:
 * { "currentPassword": "OldPassword1!", "newPassword": "NewStrongerPassword2@" }
 * ```
 * @response
 * ```json
 * { "message": "Password changed successfully." }
 * ```
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    // Password complexity validation for new password
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (
      !newPassword ||
      newPassword.length < 8 ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumber ||
      !hasSpecialChar
    ) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify current password
    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordMatches) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Create notification for password change
    const userLang = user.language || "en";
    const messageEn = "Your password has been changed successfully.";
    const messageBg = "Вашата парола беше променена успешно.";

    let titleTrans, bodyTrans;
    try {
      [titleTrans, bodyTrans] = await Promise.all([
        getDualTranslation("Password Changed"),
        getDualTranslation(messageEn),
      ]);
    } catch (translationError) {
      logger.error(translationError, "Translation failed for password change notification");
      titleTrans = { en: "Password Changed", bg: "Паролата променена" };
      bodyTrans = { en: messageEn, bg: messageBg };
    }

    try {
      await Notification.create({
        userId: userId,
        type: NotificationType.SYSTEM,
        message: getLocalizedText(userLang, bodyTrans), // Use body as message
        translations: {
          message: {
            en: bodyTrans.en,
            bg: bodyTrans.bg,
          },
        },
        link: "/settings",
      });
    } catch (notifErr) {
      logger.error(notifErr, "Failed to create password change notification");      // Do not fail the request because of notification error
    }

    // Log the password change for audit
    await logActivity(req, "PASSWORD_CHANGE", {
      description: "Changed password",
    });

    return res.json({ message: "Password changed successfully." });
  } catch (error: any) {
    logger.error(error, "Change password error");
    return res.status(500).json({ message: "Internal server error." });
  }
};

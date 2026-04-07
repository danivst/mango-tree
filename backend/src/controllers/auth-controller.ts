import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user";
import BannedUser from "../models/banned-user";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import { sendEmail } from "../utils/email";
import { JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL } from "../config/env";
import RoleTypeValue from "../enums/role-type";
import { getDualTranslation } from "../utils/translation";
import { getLocalizedText } from "../utils/get-translation";
import { getLocationFromIP } from "../utils/geolocation";
import { AuthRequest } from "../interfaces/auth";
import {
  getWelcomeEmailTemplate,
  getAdminCreatedEmailTemplate,
  getPasswordResetEmailTemplate,
  get2FAEmailTemplate
} from "../utils/email-templates";
import { logActivity } from "../utils/activity-logger";

/**
 * @file auth-controller.ts
 * @description Handles authentication, authorization, and account management endpoints.
 * Includes registration, login, password reset, and 2FA functionality.
 */

/**
 * Registers a new user account.
 * Validates input, checks against banned emails/usernames, creates user,
 * and sends a welcome email in the user's preferred language.
 *
 * @param req - Request with body { username, email, password }
 * @param res - Response with 201 status on success, includes JWT tokens
 * @returns User object (without password), tokens, success message
 */

/* ---------- REGISTER ---------- */
export const registerUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { username, email, password } = req.body;

  // Basic length validation
  if (!username || username.length < 3) {
    return res.status(400).json({
      message: "Username must be at least 3 characters long.",
      field: "username",
    });
  }

  if (!email || !email.includes("@")) {
    return res
      .status(400)
      .json({ message: "Email must contain @ symbol.", field: "email" });
  }

  // Password complexity validation
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
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.",
      field: "password",
    });
  }

  // Check if email or username is banned
  const bannedByEmail = await BannedUser.findOne({ email });
  if (bannedByEmail) {
    return res.status(400).json({
      message: "This email/username is associated with a banned account.",
      field: "email",
    });
  }

  const bannedByUsername = await BannedUser.findOne({ username });
  if (bannedByUsername) {
    return res.status(400).json({
      message: "This email/username is associated with a banned account.",
      field: "username",
    });
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res
      .status(400)
      .json({ message: "Email already in use.", field: "email" });
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res
      .status(400)
      .json({ message: "Username already in use.", field: "username" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    passwordHash,
    role: RoleTypeValue.USER,
    translations: {
      bio: { bg: "", en: "" },
    },
  });

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

  // Send welcome/account creation email based on user's language preference
  const userLang = user.language || "en";

  const [titleTrans, greetingTrans, bodyTrans, signatureTrans] =
    await Promise.all([
      getDualTranslation("Welcome to MangoTree!"),
      getDualTranslation(`Hello ${username}!`),
      getDualTranslation(
        "Your account has been successfully created. You can now log in and start sharing your content with the community. Welcome aboard!",
      ),
      getDualTranslation("Sincerely, the MangoTree team"),
    ]);

  const title = getLocalizedText(userLang, titleTrans);
  const greeting = getLocalizedText(userLang, greetingTrans);
  const body = getLocalizedText(userLang, bodyTrans);
  const signature = getLocalizedText(userLang, signatureTrans);

  const emailHtml = getWelcomeEmailTemplate({
    username,
    title,
    greeting,
    body,
    signature,
  });

  try {
    await sendEmail(email, title, emailHtml);
  } catch (error: any) {
    console.error("Failed to send welcome email:", error);
    // Don't fail registration if email fails
  }

  return res.status(201).json({
    message: "Registration successful.",
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      bio: user.bio,
      translations: user.translations,
    },
  });
};

/**
 * Authenticates a user with username and password.
 * Checks ban status, supports 2FA if enabled, and issues JWT tokens.
 * If 2FA is enabled, sends verification code and requires 2FA completion.
 *
 * @param req - Request with body { username, password }
 * @param res - Response with tokens and user data, or 2FA required flag
 * @returns 200 with tokens if successful, 403 if banned, 500 if 2FA email fails
 */
export const loginUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { username, password } = req.body;

  if (!username || username.length < 2) {
    return res
      .status(400)
      .json({ message: "Username does not exist", field: "username" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res
      .status(400)
      .json({ message: "Username does not exist", field: "username" });
  }

  // Check if user is banned
  const bannedUser = await BannedUser.findOne({ original_user_id: user._id });
  if (bannedUser) {
    return res.status(403).json({
      message: "accountBanned",
      reason: bannedUser.ban_reason,
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res
      .status(400)
      .json({ message: "Incorrect password", field: "password" });
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // Generate a 6-digit 2FA code
    const twoFactorCode = crypto.randomInt(100000, 999999).toString();
    const twoFactorCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save the code to the user
    user.twoFactorCode = twoFactorCode;
    user.twoFactorCodeExpiry = twoFactorCodeExpiry;
    await user.save();

    // Send 2FA code via email
    const userLang = user.language || "en";

    const [
      titleTrans,
      introTrans,
      codeLabelTrans,
      securityNoteTrans,
      signatureTrans,
    ] = await Promise.all([
      getDualTranslation("MangoTree Two-Factor Authentication"),
      getDualTranslation(
        "To log in to your MangoTree account, please use the following 6-digit verification code:",
      ),
      getDualTranslation("Your verification code:"),
      getDualTranslation(
        "This code will expire in 10 minutes. If you did not attempt to log in, please ignore this email or contact support if you believe this is unauthorized.",
      ),
      getDualTranslation("Sincerely, the MangoTree team"),
    ]);

    const title = getLocalizedText(userLang, titleTrans);
    const intro = getLocalizedText(userLang, introTrans);
    const securityNote = getLocalizedText(userLang, securityNoteTrans);
    const signature = getLocalizedText(userLang, signatureTrans);

    const emailHtml = get2FAEmailTemplate({
      title,
      intro: `${user.username}, ${intro}`,
      code: twoFactorCode,
      securityNote,
      signature,
    });

    try {
      await sendEmail(user.email, title, emailHtml);
    } catch (error: any) {
      console.error("Failed to send 2FA email:", error);
      // Clear the code if email fails
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
      });
    }

    // Return response indicating 2FA is required (no tokens issued yet)
    return res.json({
      twoFactorRequired: true,
      userId: user._id,
      username: user.username,
      role: user.role,
      bio: user.bio,
      translations: user.translations,
      message: "Two-factor authentication code has been sent to your email.",
    });
  }

  // No 2FA enabled - issue tokens normally
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

  // Log successful login (explicit userId since auth middleware not used)
  await logActivity(req, 'LOGIN', { userId: user._id.toString() });

  // Create a security notification for the user about this login
  try {
    const userLang = user.language || "en";

    // Get IP address
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

    // Get location (city, country) from IP using geolocation service
    const location = await getLocationFromIP(ipAddress);

    // Get current time in user's locale
    const loginTime = new Date().toLocaleString(userLang === 'bg' ? 'bg-BG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Directly create English and Bulgarian messages
    const messageEn = `New login detected at ${loginTime} from ${location}. If this wasn't you, please secure your account immediately.`;
    const messageBg = `Открито ново влизане на ${loginTime} от ${location}. Ако това не сте вие, моля незабавно защитете акаунта си.`;

    await Notification.create({
      userId: user._id,
      type: NotificationType.NEW_LOGIN,
      message: getLocalizedText(userLang, {
        en: messageEn,
        bg: messageBg,
      }),
      translations: {
        message: {
          en: messageEn,
          bg: messageBg,
        },
      },
      link: '/settings',
    });
  } catch (notifErr) {
    console.error("Failed to create login notification:", notifErr);
    // Don't fail the login if notification fails
  }

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
};

/**
 * Creates a new admin account.
 * Extracts username from email (before @) and generates a default password.
 * Sends credentials via email in user's language.
 * Note: Should be restricted to super-admin only in production.
 *
 * @param req - Request with body { email }
 * @param res - Response with created admin user (id, username, email, role)
 * @returns 201 on success, 400 on validation/duplicate, 500 if email fails
 */
export const registerAdmin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res
      .status(400)
      .json({ message: "Email must contain @ symbol.", field: "email" });
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res
      .status(400)
      .json({ message: "Email already in use.", field: "email" });
  }

  // Extract username from email (part before @)
  const username = email.split("@")[0];

  // Check if username already exists
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(400).json({
      message: "Username already exists. Please use a different email.",
      field: "email",
    });
  }

  // Generate default password: username + "123!@#"
  const defaultPassword = `${username}123!@#`;
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // Create admin user with default password
  const user = await User.create({
    username,
    email,
    passwordHash,
    role: RoleTypeValue.ADMIN,
    translations: {
      bio: { bg: "", en: "" },
    },
  });

  // Determine user's language (default to English)
  const userLang = user.language || "en";

  // Get translations for email
  const [
    titleTrans,
    greetingTrans,
    credentialsTrans,
    usernameLabelTrans,
    passwordLabelTrans,
    instructionTrans,
    footerTrans,
    signatureTrans,
  ] = await Promise.all([
    getDualTranslation("MangoTree Admin Account Created"),
    getDualTranslation(
      "An admin account has been created for you on MangoTree.",
    ),
    getDualTranslation("Your login credentials are:"),
    getDualTranslation("Username:"),
    getDualTranslation("Temporary Password:"),
    getDualTranslation(
      "Please log in immediately and change your password for security reasons.",
    ),
    getDualTranslation(
      "If you did not request this account, please contact support immediately.",
    ),
    getDualTranslation("Sincerely, the MangoTree team"),
  ]);

  const title = getLocalizedText(userLang, titleTrans);
  const greeting = getLocalizedText(userLang, greetingTrans);
  const credentialsLabel = getLocalizedText(userLang, credentialsTrans);
  const usernameLabel = getLocalizedText(userLang, usernameLabelTrans);
  const passwordLabel = getLocalizedText(userLang, passwordLabelTrans);
  const instruction = getLocalizedText(userLang, instructionTrans);
  const footer = getLocalizedText(userLang, footerTrans);
  const signature = getLocalizedText(userLang, signatureTrans);

  const emailHtml = getAdminCreatedEmailTemplate({
    username,
    defaultPassword,
    title,
    greeting,
    credentialsLabel,
    usernameLabel,
    passwordLabel,
    instruction,
    footer,
    signature,
  });

  try {
    await sendEmail(email, title, emailHtml);
  } catch (error: any) {
    await User.findByIdAndDelete(user._id);
    return res.status(500).json({
      message: "Failed to send admin creation email. Please try again.",
      field: "email",
    });
  }

  return res.status(201).json({
    message:
      "Admin account created successfully. Login credentials sent to email.",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

/**
 * Sets a new password using a valid reset token.
 * Typically used after password reset request or initial account setup.
 *
 * @param req - Request with body { token, password }
 * @param res - Response with success message or 400 for invalid token/weak password
 * @returns 200 on success, 400 on validation failure
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
 * Generates a secure token, stores it on the user with 15-minute expiry,
 * and sends a password reset email with the reset link.
 *
 * @param req - Request with body { email }
 * @param res - Response with confirmation message or 400 if email not found
 * @returns 200 with "Email sent!" or 500 if email fails
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
    return res.status(500).json({ message: "Failed to send email." });
  }
};

/**
 * Completes the password reset by validating token and setting new password.
 * Token is consumed and cleared after use.
 *
 * @param req - Request with body { token, password, email? }
 *              Email is optional but if provided must match user's email
 * @param res - Response with success message
 * @returns 200 on success, 400 for invalid/expired token or email mismatch
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
 * Validates a password reset token and returns the associated email.
 * Used by the frontend to pre-fill the email field on the reset form.
 *
 * @param req - Request with params { token }
 * @param res - Response with { email: string } or 400 if invalid/expired
 * @returns User's email or error
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
 * Changes the authenticated user's password.
 * Requires current password for verification and validates new password strength.
 *
 * @param req - AuthRequest with body { currentPassword, newPassword }
 * @param res - Response with success message or 400/404/500 errors
 * @returns 200 on success, 400 for validation failures, 404 if user not found
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
    const userLang = user.language || 'en';
    const messageEn = "Your password has been changed successfully.";
    const messageBg = "Вашата парола беше променена успешно.";

    let titleTrans, bodyTrans;
    try {
      [titleTrans, bodyTrans] = await Promise.all([
        getDualTranslation("Password Changed"),
        getDualTranslation(messageEn),
      ]);
    } catch (translationError) {
      console.error("Translation failed, using fallback:", translationError);
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
        link: '/settings',
      });
    } catch (notifErr) {
      console.error("Failed to create password change notification:", notifErr);
      // Do not fail the request because of notification error
    }

    // Log the password change for audit
    await logActivity(req, 'PASSWORD_CHANGE', { description: 'Changed password' });

    return res.json({ message: "Password changed successfully." });
  } catch (error: any) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* ---------- LOGOUT ---------- */
/**
 * Logs out an authenticated user by recording the activity.
 * Does not invalidate tokens on server (client will clear them).
 * Future: could add token blacklist for refresh tokens.
 *
 * @param req - AuthRequest with authenticated user
 * @param res - Response with success message
 * @returns 200 on success
 */
export const logoutUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Log the logout event for audit
    await logActivity(req, 'LOGOUT');
    return res.json({ message: "Logged out successfully." });
  } catch (error: any) {
    console.error("Logout error:", error);
    // Still return success to client; logout should not fail due to logging issues
    return res.json({ message: "Logged out." });
  }
};

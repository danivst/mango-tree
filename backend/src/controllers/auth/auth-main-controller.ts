/**
 * @file auth-main-controller.ts
 * @description Core authentication controller managing user lifecycle events:
 * registration, secure login with 2FA support and session termination.
 * Integrates geolocation tracking for security notifications and automated bilingual emails.
 */

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../../models/user-model";
import BannedUser from "../../models/banned-user-model";
import Notification from "../../models/notification-model";
import NotificationType from "../../enums/notification-type";
import { sendEmail } from "../../utils/email";
import { JWT_SECRET, CLIENT_URL } from "../../config/env";
import RoleTypeValue from "../../enums/role-type";
import { getDualTranslation } from "../../utils/translation";
import { getLocalizedText } from "../../utils/get-translation";
import { getLocationFromIP } from "../../utils/geolocation";
import { AuthRequest } from "../../interfaces/auth";
import {
  getWelcomeEmailTemplate,
  get2FAEmailTemplate,
} from "../../utils/email-templates";
import { logActivity } from "../../utils/activity-logger";
import logger from "../../utils/logger";
import { isDisposableEmail } from "../../utils/disposable-email";
import { clearAuthCookies, setAuthCookies } from "../../utils/auth-cookies";

/**
 * Regular expression for basic email validation.
 * Ensures the string contains characters before and after the '@' symbol
 * and includes a domain extension (e.g., .com, .org).
 * @constant {RegExp}
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterValidationError = { message: string; field: string };

const validateRegisterBody = (body: unknown): RegisterValidationError | null => {
  if (!body || typeof body !== "object") {
    return { message: "Invalid request body.", field: "body" };
  }

  const b = body as Record<string, unknown>;
  const username = b.username;
  const email = b.email;
  const password = b.password;

  if (typeof username !== "string" || username.trim().length < 3) {
    return { message: "Username must be at least 3 characters long.", field: "username" };
  }

  if (typeof email !== "string" || !emailRegex.test(email) || !email.includes("@")) {
    return { message: "Invalid email format.", field: "email" };
  }

  if (typeof password !== "string" || password.length < 8) {
    return { message: "Password must be at least 8 characters long.", field: "password" };
  }
  if (!/[A-Z]/.test(password)) {
    return { message: "Password must contain at least one capital letter.", field: "password" };
  }
  if (!/[a-z]/.test(password)) {
    return { message: "Password must contain at least one lower case letter.", field: "password" };
  }
  if (!/[0-9]/.test(password)) {
    return { message: "Password must contain at least one number.", field: "password" };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { message: "Password must contain at least one special character.", field: "password" };
  }

  return null;
};

/**
 * Registers a new user account.
 * Validates input strength, checks ban status, creates the user and sends a welcome email.
 *
 * @param req - AuthRequest with body { username, email, password }
 * @param res - Express response object
 * @returns Response with 201 status on success; auth tokens are set in HttpOnly cookies
 * @throws {Error} Database error if save fails
 * @throws {BadRequestError} If credentials fail validation or are already in use
 *
 * @example
 * ```json
 * Request body:
 * { "username": "JohnDoe", "email": "john@example.com", "password": "Password123!" }
 * ```
 * @response
 * ```json
 * {
 * "message": "Registration successful.",
 * "user": { "id": "...", "username": "JohnDoe" }
 * }
 * ```
 */
export const registerUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const validationError = validateRegisterBody(req.body);
  if (validationError) {
    return res.status(400).json(validationError);
  }

  const { username, email, password } = req.body;

  if (isDisposableEmail(email)) {
    return res.status(400).json({
      message: "Disposable email addresses are not allowed.",
      field: "email",
    });
  }

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

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res
      .status(400)
      .json({ message: "Email already in use.", field: "email" });
  }

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
    { expiresIn: "24h" },
  );

  await logActivity(req, "ACCOUNT_CREATE", { 
    userId: user._id.toString(),
    targetId: user._id.toString(),
    targetType: "user",
    description: `Created account with username: ${user.username} and email: ${user.email}`,
  });
  
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
    logger.error(error, "Failed to send welcome email");
  }

  setAuthCookies(res, token);

  return res.status(201).json({
    message: "Registration successful.",

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
 * Authenticates a user and starts a session.
 * Checks passwords, ban status and triggers 2FA if enabled. Issues session tokens on success.
 *
 * @param req - AuthRequest with body { username, password }
 * @param res - Express response object
 * @returns Response with user/session metadata; tokens are set in HttpOnly cookies when login completes
 * @throws {Error} Database error
 * @throws {ForbiddenError} If account is banned
 *
 * @example
 * ```json
 * Request body:
 * { "username": "JohnDoe", "password": "Password123!" }
 * ```
 * @response
 * ```json
 * { "message": "Successfully logged in!", "user": { "id": "...", "username": "JohnDoe" } }
 * ```
 */
export const loginUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { username, password, rememberMe } = req.body as {
    username?: string;
    password?: string;
    rememberMe?: boolean;
  };

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

  const bannedUser = await BannedUser.findOne({ original_user_id: user._id });
  if (bannedUser) {
    return res.status(403).json({
      message: "accountBanned",
      reason: bannedUser.banReason,
    });
  }

  if (typeof password !== "string") {
    return res
      .status(400)
      .json({ message: "Incorrect password", field: "password" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res
      .status(400)
      .json({ message: "Incorrect password", field: "password" });
  }

  if (user.twoFactorEnabled) {
    const twoFactorCode = crypto.randomInt(100000, 999999).toString();
    const twoFactorCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.twoFactorCode = twoFactorCode;
    user.twoFactorCodeExpiry = twoFactorCodeExpiry;
    await user.save();

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
      logger.error(error, "Failed to send 2FA email");
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
      });
    }

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

  const tokenExpiresIn = rememberMe ? "7d" : "24h";
  const cookieMaxAgeMs = (rememberMe ? 7 : 1) * 24 * 60 * 60 * 1000;

  const token = jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    {
      expiresIn: tokenExpiresIn,
    },
  );

  await logActivity(req, "LOGIN", { userId: user._id.toString() });

  try {
    const userLang = user.language || "en";

    const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
    const location = await getLocationFromIP(ipAddress, userLang);
    const loginTime = new Date().toLocaleString(
      userLang === "bg" ? "bg-BG" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
    );

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
      link: "/settings",
    });
  } catch (notifErr) {
    logger.error(notifErr, "Failed to create login notification");
  }

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
};

/**
 * Logs out an authenticated user.
 * Records the activity for audit trails. Token invalidation is handled by the client.
 *
 * @param req - AuthRequest with authenticated user
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Logging failure
 *
 * @example
 * ```json
 * POST /api/auth/logout
 * ```
 * @response
 * ```json
 * { "message": "Logged out successfully." }
 * ```
 */
export const logoutUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    await logActivity(req, "LOGOUT");

    clearAuthCookies(res);

    return res.json({ message: "Logged out successfully." });
  } catch (error: any) {
    logger.error(error, "Logout error");

    clearAuthCookies(res);

    return res.json({ message: "Logged out." });
  }
};

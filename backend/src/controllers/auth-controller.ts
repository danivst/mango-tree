import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/user";
import BannedUser from "../models/banned_user"; // Import BannedUser model
import { sendEmail } from "../utils/email";
import { JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL } from "../config/env";
import RoleTypeValue from "../enums/role-type";
import { getDualTranslation } from "../utils/translation";
import { AuthRequest } from "../utils/auth";

// Helper to get translation based on user language
const getLocalizedText = (userLang: string, translations: { bg: string; en: string }): string => {
  return userLang === 'bg' ? translations.bg : translations.en;
};

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

  const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: "24h",
  });

  const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  // Send welcome/account creation email based on user's language preference
  const userLang = user.language || 'en';

  const [titleTrans, greetingTrans, bodyTrans, signatureTrans] = await Promise.all([
    getDualTranslation("Welcome to MangoTree!"),
    getDualTranslation(`Hello ${username}!`),
    getDualTranslation("Your account has been successfully created. You can now log in and start sharing your content with the community. Welcome aboard!"),
    getDualTranslation("Sincerely, the MangoTree team"),
  ]);

  const title = getLocalizedText(userLang, titleTrans);
  const greeting = getLocalizedText(userLang, greetingTrans);
  const body = getLocalizedText(userLang, bodyTrans);
  const signature = getLocalizedText(userLang, signatureTrans);

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
      <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${title}</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">${greeting}</p>
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${body}</p>
      <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${signature}</p>
    </div>
  `;

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

/* ---------- LOGIN ---------- */
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

  const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: "24h",
  });

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
    redirectTo: user.role === RoleTypeValue.ADMIN ? "/admin/dashboard" : "/home",
  });
};

/* ---------- REGISTER ADMIN (ADMIN ONLY) ---------- */
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
  const userLang = user.language || 'en';

  // Get translations for email
  const [titleTrans, greetingTrans, credentialsTrans, usernameLabelTrans, passwordLabelTrans, instructionTrans, footerTrans, signatureTrans] = await Promise.all([
    getDualTranslation("MangoTree Admin Account Created"),
    getDualTranslation("An admin account has been created for you on MangoTree."),
    getDualTranslation("Your login credentials are:"),
    getDualTranslation("Username:"),
    getDualTranslation("Temporary Password:"),
    getDualTranslation("Please log in immediately and change your password for security reasons."),
    getDualTranslation("If you did not request this account, please contact support immediately."),
    getDualTranslation("Sincerely, the MangoTree team"),
  ]);

  const title = getLocalizedText(userLang, titleTrans);
  const greeting = getLocalizedText(userLang, greetingTrans);
  const credentials = getLocalizedText(userLang, credentialsTrans);
  const usernameLabel = getLocalizedText(userLang, usernameLabelTrans);
  const passwordLabel = getLocalizedText(userLang, passwordLabelTrans);
  const instruction = getLocalizedText(userLang, instructionTrans);
  const footer = getLocalizedText(userLang, footerTrans);
  const signature = getLocalizedText(userLang, signatureTrans);

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
      <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${title}</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">${greeting}</p>
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;"><strong>${credentials}</strong></p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 0 0 20px 0;">
        <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0 0 10px 0;">
          ${usernameLabel} <strong>${username}</strong><br>
          ${passwordLabel} <strong style="color: #d32f2f;">${defaultPassword}</strong>
        </p>
      </div>
      <p style="font-size: 16px; font-weight: bold; color: #d32f2f; margin: 20px 0;">
        ${instruction}
      </p>
      <p style="font-size: 14px; color: #666; margin: 20px 0;">${footer}</p>
      <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${signature}</p>
    </div>
  `;

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
    message: "Admin account created successfully. Login credentials sent to email.",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

/* ---------- SETUP PASSWORD ---------- */
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

/* ---------- REQUEST PASSWORD RESET ---------- */
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
  const userLang = user.language || 'en';

  // Get translations for all email content
  const [titleTrans, introTrans, buttonTrans, ignoreTrans, automatedTrans, signatureTrans] = await Promise.all([
    getDualTranslation("MangoTree Password Reset"),
    getDualTranslation("You have requested a password change, please click on the link below and follow the instructions. This link will expire in 15 minutes, after that you will have to submit a new request."),
    getDualTranslation("Reset Password"),
    getDualTranslation("If you have not submitted this request, you can ignore this message."),
    getDualTranslation("This message is automated therefore any response to it will be in vain. If you have any questions, email mangotree@support.com."),
    getDualTranslation("Sincerely, the MangoTree team"),
  ]);

  const title = getLocalizedText(userLang, titleTrans);
  const intro = getLocalizedText(userLang, introTrans);
  const buttonText = getLocalizedText(userLang, buttonTrans);
  const ignoreMsg = getLocalizedText(userLang, ignoreTrans);
  const automatedMsg = getLocalizedText(userLang, automatedTrans);
  const signature = getLocalizedText(userLang, signatureTrans);

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
      <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${title}</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">${intro}</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #E77728; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">${buttonText}</a>
      </p>
      <p style="font-size: 14px; color: #666; margin: 20px 0;">${ignoreMsg}</p>
      <p style="font-size: 14px; color: #666; margin: 20px 0;">${automatedMsg}</p>
      <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${signature}</p>
    </div>
  `;

  try {
    await sendEmail(email, title, emailHtml);
    return res.json({ message: "Email sent!" });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to send email." });
  }
};

/* ---------- RESET PASSWORD ---------- */
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

/* ---------- GET RESET TOKEN INFO ---------- */
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

/* ---------- CHANGE PASSWORD (LOGGED IN) ---------- */
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
    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password changed successfully." });
  } catch (error: any) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

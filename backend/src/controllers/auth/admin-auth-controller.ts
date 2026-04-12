/**
 * @file admin-auth-controller.ts
 * @description Handles administrative authentication tasks, specifically the registration 
 * and setup of new admin accounts with automated credential delivery via email.
 */

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../../models/user-model";
import { sendEmail } from "../../utils/email";
import RoleTypeValue from "../../enums/role-type";
import { getDualTranslation } from "../../utils/translation";
import { getLocalizedText } from "../../utils/get-translation";
import {
  getAdminCreatedEmailTemplate,
} from "../../utils/email-templates";
import logger from "../../utils/logger";

/**
 * Creates a new admin account.
 * Extracts username from email (before @) and generates a default password.
 * Sends credentials via email in user's language.
 *
 * @param req - AuthRequest with body { email }
 * @param res - Express response object
 * @returns Response with created admin user (id, username, email, role)
 * @throws {Error} Database error if creation fails
 * @throws {BadRequestError} If email is invalid or already in use
 *
 * @example
 * ```json
 * Request body:
 * { "email": "admin@mangotree.com" }
 * ```
 * @response
 * ```json
 * {
 * "message": "Admin account created successfully. Login credentials sent to email.",
 * "user": { "id": "...", "username": "admin", "email": "admin@mangotree.com", "role": "admin" }
 * }
 * ```
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
    logger.error(error, "Failed to send admin creation email")
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
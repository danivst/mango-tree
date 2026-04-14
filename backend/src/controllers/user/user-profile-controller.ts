/**
 * @file user-profile-controller.ts
 * @description Manages user profile operations, including retrieval of public/private 
 * profiles and content updates. Handles localization of bio and metadata.
 */

import { Response } from "express";
import User from "../../models/user-model";
import RoleTypeValue from "../../enums/role-type";
import Notification from "../../models/notification-model";
import NotificationType from "../../enums/notification-type";
import ThemeTypeValue from "../../enums/theme-type";
import { AuthRequest } from "../../interfaces/auth";
import { getDualTranslation } from "../../utils/translation";
import { getLocalizedText } from "../../utils/get-translation";
import { logActivity } from "../../utils/activity-logger";
import logger from "../../utils/logger";
import LanguageTypeValue from "../../enums/language-type";

/**
 * Checks username availability.
 * Validates if a username exists in the database.
 *
 * @param req - AuthRequest with query parameter { username }
 * @param res - Express response object
 * @returns Response with exists boolean
 * @throws {Error} Database error
 *
 * @example
 * ```typescript
 * GET /api/users/check-username?username=ChefJohn
 * ```
 */
export const checkUsername = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Username is required" });
    }

    const exists = await User.exists({ username });
    return res.json({ exists: !!exists });
  } catch (err: any) {
    logger.error(err, "Error checking username availability");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves a user profile.
 * Fetches public details, sanitizing sensitive information like password hashes.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with user profile data
 * @throws {Error} 404 if user not found or banned
 */
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user is banned: only self, admin, or non-banned users can view
    const isSelf = req.user!.userId === id;
    const isAdmin = req.user!.role === RoleTypeValue.ADMIN;
    if (!isSelf && !isAdmin && user.isBanned) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (err: any) {
    logger.error(err, "Error retrieving user profile");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates user profile data.
 * Handles changes to bio, theme, language, and usernames. Includes 
 * localization processing for updated bios.
 *
 * @param req - AuthRequest with optional id in params and update data in body
 * @param res - Express response object
 * @returns Response with updated user object
 * @throws {Error} 403 if unauthorized or validation failure
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Support both /users/:id and /users/me
    const paramId = req.params.id;
    const userId = paramId || req.user!.userId; // If no ID param, use logged-in user

    const { bio, username, profileImage, theme, language } = req.body;

    // Authorization: user can update their own profile, or admin can update any
    if (req.user!.userId !== userId && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Fetch the existing user to track past usernames and apply updates
    const existingUser = await User.findById(userId);
    if (!existingUser)
      return res.status(404).json({ message: "User not found" });

    // Capture the old username before any updates
    const oldUsername = existingUser.username;

    // Check Username uniqueness if being changed
    if (username && username !== oldUsername) {
      const exists = await User.findOne({ username, _id: { $ne: userId } });
      if (exists) {
        return res.status(400).json({ message: "Username already taken." });
      }
    }

    // Apply updates to the user document
    if (username && username !== oldUsername) {
      // Push the old username to pastUsernames before updating
      existingUser.pastUsernames.push({
        username: oldUsername,
        changedAt: new Date(),
      });
      existingUser.username = username;
    }
    if (profileImage) existingUser.profileImage = profileImage;
    if (bio) {
      const bioTranslations = await getDualTranslation(bio);
      existingUser.bio = bio;
      existingUser.translations = { bio: bioTranslations };
    }
    if (theme) {
      if (!Object.values(ThemeTypeValue).includes(theme)) {
        return res.status(400).json({ message: "Invalid theme" });
      }
      existingUser.theme = theme;
    }
    if (language) {
      if (!Object.values(LanguageTypeValue).includes(language)) {
        return res.status(400).json({ message: "Invalid language" });
      }
      existingUser.language = language;
    }

    // Save all changes
    await existingUser.save();

    // Log profile updates (non-username, which is logged separately)
    if (profileImage) {
      await logActivity(req, "PROFILE_IMAGE_CHANGE", {
        targetId: userId.toString(),
        targetType: "user",
        description: "Updated profile image",
      });
    }
    if (theme) {
      await logActivity(req, "THEME_CHANGE", {
        targetId: userId.toString(),
        targetType: "user",
        description: `Changed theme to ${theme}`,
      });
    }
    if (language) {
      await logActivity(req, "LANGUAGE_CHANGE", {
        targetId: userId.toString(),
        targetType: "user",
        description: `Changed language to ${language}`,
      });
    }
    if (bio) {
      await logActivity(req, "BIO_UPDATE", {
        targetId: userId.toString(),
        targetType: "user",
        description: "Updated bio",
      });
    }

    // Return the updated user without passwordHash
    const updatedUser = await User.findById(userId).select("-passwordHash");
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    // If username was changed, create a notification
    if (username && username !== oldUsername) {
      const userLang = updatedUser.language || "en";
      const messageEn = `Your username has been changed to "${username}".`;
      const messageBg = `Вашието потребителско име беше променено на "${username}".`;

      // Wrap translation in try/catch to avoid failures
      let titleTrans, bodyTrans;
      try {
        [titleTrans, bodyTrans] = await Promise.all([
          getDualTranslation("Username Updated"),
          getDualTranslation(messageEn),
        ]);
      } catch (translationError) {
        logger.error(translationError, "Translation failed, using fallback:");
        titleTrans = {
          en: "Username Updated",
          bg: "Потребителското име променено",
        };
        bodyTrans = { en: messageEn, bg: messageBg };
      }

      try {
        await Notification.create({
          userId: userId,
          type: NotificationType.SYSTEM,
          message: getLocalizedText(userLang, bodyTrans),
          translations: {
            message: {
              en: bodyTrans.en,
              bg: bodyTrans.bg,
            },
          },
          link: "/settings",
        });
      } catch (notifErr) {
        logger.error(notifErr, "Failed to create username change notification:");
      }

      // Log username change for audit
      await logActivity(req, "USERNAME_CHANGE", {
        targetId: userId.toString(),
        targetType: "user",
        description: `Changed username to ${username}`,
      });
    }

    return res.json(updatedUser);
  } catch (err: any) {
    logger.error(err, "Error updating user profile");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves the current user profile.
 *
 * @param req - AuthRequest
 * @param res - Express response object
 * @returns Response with requester's sanitized profile
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const user = await User.findById(req.user!.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json(user);
  } catch (err: any) {
    logger.error(err, "Error retrieving current user profile");
    return res.status(500).json({ message: err.message });
  }
};
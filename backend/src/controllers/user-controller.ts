import { Response } from "express";
import { Types } from "mongoose";
import User from "../models/user";
import RoleTypeValue from "../enums/role-type";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import { getLocalizedText } from "../utils/get-translation";
import { sendEmail } from "../utils/email";
import {
  getAccountDeletedEmailTemplate,
  getSuspensionEmailTemplate,
} from "../utils/email-templates";
import { logActivity } from "../utils/activity-logger";

/**
 * @file user-controller.ts
 * @description Handles all user-related HTTP endpoints including profile management,
 * user discovery, following/followers, and user deletion.
 */

/**
 * Checks if a username is available.
 * @param req - Express request with username query parameter
 * @param res - Express response
 * @returns JSON response with { exists: boolean }
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
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves a user's public profile by ID.
 * Access control: Users can view their own profile or others' profiles only if not banned.
 * Admins can view any profile including banned users.
 *
 * @param req - AuthRequest with params.id (user ID)
 * @param res - Express response
 * @returns User object with passwordHash excluded, or 404 if not found
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
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates a user's profile information.
 * Supports both /users/:id and /users/me endpoints.
 * Users can update their own profile; admins can update any user's profile.
 *
 * @param req - AuthRequest with optional params.id, body may contain:
 *              bio, username, profileImage, theme, language
 * @param res - Express response with updated user (passwordHash excluded)
 * @returns Updated user object or 400/403/404 error
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  console.log(123);
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
      console.log("opa");
      existingUser.username = username;
    }
    if (profileImage) existingUser.profileImage = profileImage;
    if (bio) {
      const bioTranslations = await getDualTranslation(bio);
      existingUser.bio = bio;
      existingUser.translations = { bio: bioTranslations };
    }
    if (theme) {
      const validThemes = ["dark", "purple", "cream", "light", "mango"];
      if (!validThemes.includes(theme)) {
        return res.status(400).json({ message: "Invalid theme" });
      }
      existingUser.theme = theme;
    }
    if (language) {
      const validLanguages = ["en", "bg"];
      if (!validLanguages.includes(language)) {
        return res.status(400).json({ message: "Invalid language" });
      }
      existingUser.language = language;
    }

    // Save all changes
    await existingUser.save();

    // Log profile updates (non-username, which is logged separately)
    if (profileImage) {
      await logActivity(req, "PROFILE_IMAGE_CHANGE", {
        targetId: userId,
        targetType: "user",
        description: "Updated profile image",
      });
    }
    if (theme) {
      await logActivity(req, "THEME_CHANGE", {
        targetId: userId,
        targetType: "user",
        description: `Changed theme to ${theme}`,
      });
    }
    if (language) {
      await logActivity(req, "LANGUAGE_CHANGE", {
        targetId: userId,
        targetType: "user",
        description: `Changed language to ${language}`,
      });
    }
    if (bio) {
      await logActivity(req, "BIO_UPDATE", {
        targetId: userId,
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
        console.error("Translation failed, using fallback:", translationError);
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
        console.error(
          "Failed to create username change notification:",
          notifErr,
        );
        // Do not fail the request because of notification error
      }

      // Log username change for audit
      await logActivity(req, "USERNAME_CHANGE", {
        targetId: userId,
        targetType: "user",
        description: `Changed username to ${username}`,
      });
    }

    return res.json(updatedUser);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Toggles following/unfollowing a user.
 * Creates a follow relationship or removes it if already following.
 * Sends a notification to the followed user.
 * Cannot follow yourself or banned users.
 *
 * @param req - AuthRequest with body { targetId: string }
 * @param res - Express response with message "Followed" or "Unfollowed"
 * @returns 400 if trying to follow self or banned user, 404 if users not found
 */
export const toggleFollow = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { targetId } = req.body as { targetId: string };
    const userId = req.user!.userId;

    if (userId === targetId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const user = await User.findById(userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent following banned users
    if (target.isBanned) {
      return res.status(400).json({ message: "Cannot follow this user" });
    }

    const userIdObj = new Types.ObjectId(userId);
    const targetIdObj = new Types.ObjectId(targetId);

    const isFollowing = user.following.some((id: Types.ObjectId) =>
      id.equals(targetIdObj),
    );

    if (isFollowing) {
      user.following = user.following.filter(
        (id: Types.ObjectId) => !id.equals(targetIdObj),
      );
      target.followers = target.followers.filter(
        (id: Types.ObjectId) => !id.equals(userIdObj),
      );
    } else {
      user.following.push(targetIdObj);
      target.followers.push(userIdObj);

      const followMessageEn = `${user.username} started following you`;
      const followMessageBg = `${user.username} започна да ви следва`;

      await Notification.create({
        userId: targetId,
        type: NotificationType.FOLLOW,
        message: followMessageEn,
        translations: {
          message: {
            en: followMessageEn,
            bg: followMessageBg,
          },
        },
        link: `/users/${userId}`,
      });
    }

    await user.save();
    await target.save();

    // Log follow/unfollow action for audit
    await logActivity(req, isFollowing ? "UNFOLLOW" : "FOLLOW", {
      targetId: targetId,
      targetType: "user",
      description: `${isFollowing ? "Unfollowed" : "Followed"} user ${targetId}`,
    });

    return res.json({ message: isFollowing ? "Unfollowed" : "Followed" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves the authenticated user's profile.
 *
 * @param req - AuthRequest with authenticated user
 * @param res - Express response with user object (passwordHash excluded)
 * @returns User object or 404 if not found
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
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates the authenticated user's notification preferences.
 *
 * @param req - AuthRequest with body { notificationPreferences }
 *              notificationPreferences: { emailReports, emailComments, inAppReports, inAppComments }
 * @param res - Express response with success message and updated user
 * @returns Updated user with preferences, 400 if preferences missing, 404 if user not found
 */
export const updateNotificationPreferences = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { notificationPreferences } = req.body;

    if (!notificationPreferences) {
      return res
        .status(400)
        .json({ message: "Notification preferences are required." });
    }

    // Basic validation for the structure of notificationPreferences
    const validPreferences = {
      emailReports:
        typeof notificationPreferences.emailReports === "boolean"
          ? notificationPreferences.emailReports
          : true,
      emailComments:
        typeof notificationPreferences.emailComments === "boolean"
          ? notificationPreferences.emailComments
          : true,
      inAppReports:
        typeof notificationPreferences.inAppReports === "boolean"
          ? notificationPreferences.inAppReports
          : true,
      inAppComments:
        typeof notificationPreferences.inAppComments === "boolean"
          ? notificationPreferences.inAppComments
          : true,
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: validPreferences },
      { new: true, runValidators: true },
    ).select("-passwordHash"); // Exclude password hash from response

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      message: "Notification preferences updated successfully.",
      user,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates the authenticated user's email address.
 * Validates email format and ensures email is not already in use by another account.
 *
 * @param req - AuthRequest with body { email: string }
 * @param res - Express response with success message and updated user
 * @returns Updated user, 400 for invalid/duplicate email, 404 if user not found
 */
export const updateEmail = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Check if email already exists for another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { email },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Log email change for audit
    await logActivity(req, "EMAIL_CHANGE", {
      targetId: userId,
      targetType: "user",
      description: `Changed email to ${email}`,
    });

    return res.json({ message: "Email updated successfully.", user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all regular (non-admin) users.
 * Excludes admins, banned users, and the requesting user from results.
 *
 * @param req - AuthRequest with authenticated user
 * @param res - Express response with array of User objects (passwordHash excluded)
 * @returns Sorted by creation date (newest first)
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Return all non-banned users with role 'user' (exclude admins and banned)
    // Also exclude the current user
    const users = await User.find({
      role: RoleTypeValue.USER,
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    const filteredUsers = users.filter(
      (u) => u._id.toString() !== req.user!.userId,
    );
    return res.json(filteredUsers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all admin users.
 * Admin role required to access this endpoint.
 *
 * @param req - AuthRequest with user.role === 'admin'
 * @param res - Express response with array of admin User objects (passwordHash excluded)
 * @returns 403 if requester is not admin
 */
export const getAllAdmins = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Check if user is admin
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Return all admin users
    const admins = await User.find({
      role: RoleTypeValue.ADMIN,
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.json(admins);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all regular users for user search/discovery.
 * Excludes admins, banned users, and the requesting user.
 * Intended for user search functionality.
 *
 * @param req - AuthRequest with authenticated user
 * @param res - Express response with array of User objects (passwordHash excluded)
 * @returns Sorted by creation date (newest first)
 */
export const getRegularUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Only return non-banned users with role "user" (exclude admins and banned)
    const users = await User.find({
      role: RoleTypeValue.USER,
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    // Exclude the current user from the results
    const filteredUsers = users.filter(
      (u) => u._id.toString() !== req.user!.userId,
    );
    return res.json(filteredUsers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a user account and all associated data.
 * Users can delete their own account; admins can delete any account.
 * When an admin deletes a user, a notification with reason is sent.
 * Sends a confirmation email before deletion.
 * Cleans up follow relationships and associated posts/comments.
 *
 * @param req - AuthRequest with params.id (user ID to delete), optional body { reason }
 * @param res - Express response with success message
 * @returns 403 if not authorized, 404 if user not found
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (req.user!.userId !== id && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If admin is deleting and provided a reason, send notification with reason
    if (req.user!.role === RoleTypeValue.ADMIN && reason) {
      const translatedReason = await getDualTranslation(reason);

      const suspendMessageEn = `Your account has been permanently suspended due to this reason: ${translatedReason.en}. If you think this was a mistake, immediately reach out to mangotree@support.com, with subject: ${user.username} termination and include a screenshot of this message.`;
      const suspendMessageBg = `Вашият акаунт беше спрян за постоянно поради следната причина: ${translatedReason.bg}. Ако смятате, че това е грешка, незабавно се свържете с mangotree@support.com с тема: ${user.username} termination и прикачете екранна снимка на това съобщение.`;

      await Notification.create({
        userId: id,
        type: NotificationType.REPORT_FEEDBACK,
        message: suspendMessageEn,
        translations: {
          message: {
            en: suspendMessageEn,
            bg: suspendMessageBg,
          },
        },
        link: null,
      });
    }

    // Determine if this is a self-deletion or admin deletion
    const isSelfDeletion = req.user!.userId === id;
    const userLang = user.language || "en";

    let titleKey: string;
    let bodyKey: string;

    if (isSelfDeletion) {
      // User deleted their own account
      titleKey = "Account Deleted";
      bodyKey =
        "Your account has been permanently deleted from MangoTree. You requested this deletion, and your data has been removed. We're sorry to see you go.";
    } else {
      // Admin deleted the user's account
      titleKey = "Account Deleted by Administrator";
      bodyKey =
        "Your account has been permanently deleted from MangoTree by an administrator. This action was taken due to a violation of our terms of service or community guidelines.";
    }

    const [titleTrans, bodyTrans, signatureTrans] = await Promise.all([
      getDualTranslation(titleKey),
      getDualTranslation(bodyKey),
      getDualTranslation("Sincerely, the MangoTree team"),
    ]);

    const title = getLocalizedText(userLang, titleTrans);
    const body = getLocalizedText(userLang, bodyTrans);
    const signature = getLocalizedText(userLang, signatureTrans);

    const emailHtml = isSelfDeletion
      ? getAccountDeletedEmailTemplate({ title, body, signature })
      : getSuspensionEmailTemplate({ title, message: body, signature });

    try {
      await sendEmail(user.email, title, emailHtml);
    } catch (emailError) {
      console.error("Failed to send deletion email:", emailError);
      // Continue with deletion even if email fails
    }

    // Import models for cleanup
    const PostModel = (await import("../models/post")).default;
    const CommentModel = (await import("../models/comment")).default;
    const ReportModel = (await import("../models/report")).default;
    const NotificationModel = (await import("../models/notification")).default;
    const BannedUserModel = (await import("../models/banned-user")).default;

    // Delete user's posts and comments first
    await PostModel.deleteMany({ authorId: id });
    await CommentModel.deleteMany({ userId: id });

    // Delete reports where:
    // 1. The user is the reporter (reportedBy = id)
    // 2. The user is the target (targetId = id AND targetType = 'user')
    await ReportModel.deleteMany({
      $or: [{ reportedBy: id }, { targetId: id, targetType: "user" }],
    });

    // Delete all notifications for the user
    await NotificationModel.deleteMany({ userId: id });

    // Remove user's likes from all posts and comments
    await PostModel.updateMany({ likes: id }, { $pull: { likes: id } });
    await CommentModel.updateMany({ likes: id }, { $pull: { likes: id } });

    // Clean up follow relationships before deleting the user
    try {
      if (user.following && user.following.length > 0) {
        await Promise.all(
          user.following.map((followedId: Types.ObjectId) =>
            User.findByIdAndUpdate(followedId, {
              $pull: { followers: user._id },
            }),
          ),
        );
      }
      if (user.followers && user.followers.length > 0) {
        await Promise.all(
          user.followers.map((followerId: Types.ObjectId) =>
            User.findByIdAndUpdate(followerId, {
              $pull: { following: user._id },
            }),
          ),
        );
      }
    } catch (cleanupErr) {
      console.error("Error cleaning up follow relationships:", cleanupErr);
      // Continue with deletion even if cleanup fails
    }

    // Delete ban record if user was banned
    await BannedUserModel.deleteOne({ original_user_id: id });

    // Finally delete the user account
    await User.findByIdAndDelete(id);
    return res.json({ message: "Account deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves the list of users who follow a specific user.
 * Users can view their own followers or another user's followers if they are admin.
 * Excludes banned users from the results.
 *
 * @param req - AuthRequest with params.id (target user ID)
 * @param res - Express response with array of User objects (passwordHash excluded)
 * @returns Array of follower users, 404 if target user not found, 403 if not authorized
 */
export const getFollowers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.params.id as string;
    const requesterId = req.user!.userId;

    // Ensure the user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow fetching followers of:
    // - yourself
    // - another user if you are an admin
    if (userId !== requesterId && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Populate followers' user details (exclude banned users)
    const followers = await User.find({
      _id: { $in: targetUser.followers },
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    }).select("-passwordHash");

    return res.json(followers);
  } catch (err: any) {
    console.error("Get Followers Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves the list of users that a specific user is following.
 * Users can view their own following list or another user's if they are admin.
 * Excludes banned users from the results.
 *
 * @param req - AuthRequest with params.id (target user ID)
 * @param res - Express response with array of User objects (passwordHash excluded)
 * @returns Array of followed users, 404 if target user not found, 403 if not authorized
 */
export const getFollowing = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.params.id as string;
    const requesterId = req.user!.userId;

    // Ensure the user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow fetching following of:
    // - yourself
    // - another user if you are an admin
    if (userId !== requesterId && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Populate following users' details (exclude banned users)
    const following = await User.find({
      _id: { $in: targetUser.following },
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    }).select("-passwordHash");

    return res.json(following);
  } catch (err: any) {
    console.error("Get Following Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Removes a follower from the authenticated user's followers list.
 * The authenticated user must be the one being unfollowed.
 *
 * @param req - AuthRequest with params.followerId (ID of follower to remove)
 * @param res - Express response with success message
 * @returns 400 if follower relationship doesn't exist, 404 if users not found
 */
export const removeFollower = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { followerId } = req.params;
    const userId = req.user!.userId;

    // The current user (profile owner) and the follower to remove
    const currentUser = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!currentUser) {
      return res.status(404).json({ message: "Authenticated user not found" });
    }
    if (!follower) {
      return res.status(404).json({ message: "Follower not found" });
    }

    // Check if the follower is indeed following the current user
    const isFollowing = currentUser.followers.some(
      (id) => id.toString() === followerId,
    );
    if (!isFollowing) {
      return res
        .status(400)
        .json({ message: "This user is not following you" });
    }

    // Remove currentUser from follower's following list
    follower.following = follower.following.filter(
      (id) => id.toString() !== userId,
    );
    await follower.save();

    // Remove follower from currentUser's followers list
    currentUser.followers = currentUser.followers.filter(
      (id) => id.toString() !== followerId,
    );
    await currentUser.save();

    return res.json({ message: "Follower removed successfully" });
  } catch (err: any) {
    console.error("Remove Follower Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

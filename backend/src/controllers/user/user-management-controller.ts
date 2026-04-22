/**
 * @file user-management-controller.ts
 * @description Administrative and self-service user management. 
 * Handles user/admin retrieval, account termination logic, automated 
 * bilingual email notifications, and deep database cleanup for deleted users.
 */

import { Response } from "express";
import User from "../../models/user-model";
import RoleTypeValue from "../../enums/role-type";
import Notification from "../../models/notification-model";
import NotificationType from "../../enums/notification-type";
import { AuthRequest } from "../../interfaces/auth";
import { getDualTranslation } from "../../utils/translation";
import { getLocalizedText } from "../../utils/get-translation";
import { sendEmail } from "../../utils/email";
import {
  getAccountDeletedEmailTemplate,
  getSuspensionEmailTemplate,
} from "../../utils/email-templates";
import logger from "../../utils/logger";
import LanguageTypeValue from "../../enums/language-type";

/**
 * Retrieves all regular users.
 * Excludes admins, banned accounts, and the requester.
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
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
    logger.error(err, "Error fetching users");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all administrator accounts.
 * Restricted to current admins.
 */
export const getAllAdmins = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const admins = await User.find({
      role: RoleTypeValue.ADMIN,
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.json(admins);
  } catch (err: any) {
    logger.error(err, "Error fetching admins");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves regular users for search.
 */
export const getRegularUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
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
    logger.error(err, "Error fetching regular users");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a user account.
 * Permanently removes user data, cleans up likes, notifications, 
 * related reports (user & content), and follower relationships.
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    // Authorization & Existence Check
    if (req.user!.userId !== id && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Admin Reason Notification
    if (req.user!.role === RoleTypeValue.ADMIN && reason) {
      const translatedReason = await getDualTranslation(reason);

      const suspendMessageEn = `Your account has been permanently suspended due to: ${translatedReason.en}. Contact support@mangotreeofficial.com for appeals.`;
      const suspendMessageBg = `Вашият акаунт беше спрян за постоянно поради: ${translatedReason.bg}. Свържете се с support@mangotreeofficial.com за обжалване.`;

      await Notification.create({
        userId: id,
        type: NotificationType.SYSTEM,
        message: suspendMessageEn,
        translations: {
          message: { en: suspendMessageEn, bg: suspendMessageBg },
        },
        link: null,
      });
    }

    // Email Preparation & Sending
    const isSelfDeletion = req.user!.userId === id;
    const userLang = user.language || LanguageTypeValue.EN; // Default to English if not set

    const titleKey = isSelfDeletion ? "Account Deleted" : "Account Deleted by Administrator";
    const bodyKey = isSelfDeletion
      ? "Your account has been permanently deleted. We're sorry to see you go."
      : "Your account has been permanently deleted by an administrator due to a violation of our terms.";

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
      logger.error(emailError, "Failed to send deletion email:");
    }

    // Model Imports & Data Cleanup
    const PostModel = (await import("../../models/post-model")).default;
    const CommentModel = (await import("../../models/comment-model")).default;
    const ReportModel = (await import("../../models/report-model")).default;
    const NotificationModel = (await import("../../models/notification-model")).default;
    const BannedUserModel = (await import("../../models/banned-user-model")).default;

    // Find IDs of items belonging to the user for report cleanup
    const userPostIds = await PostModel.find({ authorId: id }).distinct("_id");
    const userCommentIds = await CommentModel.find({ userId: id }).distinct("_id");

    // Bulk delete reports associated with the user or their content
    await ReportModel.deleteMany({
      $or: [
        { reportedBy: id },                        // Reports user made
        { targetId: id, targetType: "user" },       // Reports against user
        { targetId: { $in: userPostIds }, targetType: "post" },    // Reports against user's posts
        { targetId: { $in: userCommentIds }, targetType: "comment" } // Reports against user's comments
      ],
    });

    // Purge User Content & Interactions
    await PostModel.deleteMany({ authorId: id });
    await CommentModel.deleteMany({ userId: id });
    await NotificationModel.deleteMany({ userId: id });
    await PostModel.updateMany({ likes: id }, { $pull: { likes: id } });
    await CommentModel.updateMany({ likes: id }, { $pull: { likes: id } });

    // Clean up follow relationships (optimized)
    try {
      if (user.following?.length > 0) {
        await User.updateMany(
          { _id: { $in: user.following } },
          { $pull: { followers: user._id } }
        );
      }
      if (user.followers?.length > 0) {
        await User.updateMany(
          { _id: { $in: user.followers } },
          { $pull: { following: user._id } }
        );
      }
    } catch (cleanupErr) {
      logger.error(cleanupErr, "Error cleaning up follow relationships:");
    }

    // Final Account Purge
    await BannedUserModel.deleteOne({ original_user_id: id });
    await User.findByIdAndDelete(id);

    return res.json({ message: "Account and associated content deleted" });
  } catch (err: any) {
    logger.error(err, "Error deleting user");
    return res.status(500).json({ message: err.message });
  }
};
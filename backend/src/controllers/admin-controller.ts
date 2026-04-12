/**
 * @file admin-controller.ts
 * @description Administrative operations including content approval, rejection, and user ban management.
 */

import { Response } from "express";
import Post from "../models/post-model";
import Comment from "../models/comment-model";
import Notification from "../models/notification-model";
import NotificationType from "../enums/notification-type";
import RoleTypeValue from "../enums/role-type";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import User from "../models/user-model";
import BannedUser from "../models/banned-user-model";
import { sendEmail } from "../utils/email";
import { getLocalizedText } from "../utils/get-translation";
import { getGenericEmailTemplate } from "../utils/email-templates";
import { logActivity } from "../utils/activity-logger";
import logger from "../utils/logger";

/**
 * Fetches content flagged for manual review.
 * Currently returns posts that are not yet approved. Restricted to Admins.
 *
 * @param req - AuthRequest (Admin role required)
 * @param res - Express response object
 * @returns Response with list of flagged content items
 * @throws {Error} Database error
 *
 * @example
 * ```json
 * GET /api/admin/flagged
 * ```
 * @response
 * ```json
 * [
 * { "_id": "...", "type": "post", "content": { "title": "..." } }
 * ]
 * ```
 */
export const getFlaggedContent = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Authorization: verify the requester is an administrator
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "access denied." });
    }

    // Data retrieval: find all posts where isApproved is false
    const unapprovedPosts = await Post.find({ isApproved: false })
      .populate("authorId", "username")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    // Mapping: format the data for the frontend to easily display flagged items
    const flaggedContent = unapprovedPosts.map((post) => ({
      _id: post._id,
      type: "post",
      content: {
        title: post.title,
        content: post.content,
        image: post.image,
        translations: post.translations,
        category: (post.category as any)?.name,
        tags: post.tags,
      },
      authorId: post.authorId,
      createdAt: post.createdAt,
    }));

    return res.json(flaggedContent);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Approves a post or comment.
 * Makes the item visible and marks it as approved in the system. Logs the action.
 *
 * @param req - AuthRequest with params { type, id }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database update failure
 *
 * @example
 * ```json
 * Request params:
 * type: "post", id: "postId123"
 * ```
 * @response
 * ```json
 * { "message": "content approved successfully." }
 * ```
 */
export const approveContent = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Authorization check
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "access denied." });
    }

    const { type, id } = req.params;

    // Branching logic: handle approval based on content type (post vs comment)
    if (type === "post") {
      const post = await Post.findByIdAndUpdate(
        id,
        { isApproved: true, isVisible: true },
        { new: true },
      );
      if (!post) return res.status(404).json({ message: "post not found." });

      // Log content approval
      await logActivity(req, "CONTENT_APPROVE", {
        targetId: id,
        targetType: "post",
        description: `Approved post ${id}`,
      });
    } else if (type === "comment") {
      const comment = await Comment.findByIdAndUpdate(id, { isVisible: true });
      if (!comment)
        return res.status(404).json({ message: "comment not found." });

      // Log content approval
      await logActivity(req, "CONTENT_APPROVE", {
        targetId: id,
        targetType: "comment",
        description: `Approved comment ${id}`,
      });
    }

    return res.json({ message: "content approved successfully." });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Rejects and deletes content.
 * Removes the item from DB, translates the reason, and notifies the author.
 *
 * @param req - AuthRequest with params { type, id } and body { reason }
 * @param res - Express response object
 * @returns Response with removal confirmation
 * @throws {Error} Database or notification failure
 *
 * @example
 * ```json
 * Request body:
 * { "reason": "Inappropriate language" }
 * ```
 * @response
 * ```json
 * { "message": "content disapproved and removed." }
 * ```
 */
export const disapproveContent = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "access denied." });
    }

    const { type, id } = req.params;
    const { reason } = req.body as { reason: string };

    // Validation: a reason is mandatory to explain the removal to the user
    if (!reason) {
      return res
        .status(400)
        .json({ message: "a reason for disapproval is required." });
    }

    // Localization: translate the admin's reason to ensure the user understands it
    const translatedReason = await getDualTranslation(reason);

    if (type === "post") {
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ message: "post not found." });

      const authorId = post.authorId;
      await Post.findByIdAndDelete(id);

      // 3. notification: create a report feedback notification for the post author
      const messageEn = `your post has been removed. reason: ${reason}`;
      const messageBg = `вашата публикация беше премахната. причина: ${translatedReason.bg}`;

      await Notification.create({
        userId: authorId,
        type: NotificationType.REPORT_FEEDBACK,
        message: messageEn,
        translations: {
          message: { en: messageEn, bg: messageBg },
        },
        link: null,
      });

      // Log content rejection
      await logActivity(req, "CONTENT_REJECT", {
        targetId: id,
        targetType: "post",
        description: `Rejected post ${id}. Reason: ${reason}`,
      });
    } else if (type === "comment") {
      const comment = await Comment.findById(id);
      if (!comment)
        return res.status(404).json({ message: "comment not found." });

      const userId = comment.userId;
      await Comment.findByIdAndDelete(id);

      const msgEn = `your comment has been removed. reason: ${reason}`;
      const msgBg = `вашият коментар беше премахнат. причина: ${translatedReason.bg}`;

      await Notification.create({
        userId: userId,
        type: NotificationType.REPORT_FEEDBACK,
        message: msgEn,
        translations: {
          message: { en: msgEn, bg: msgBg },
        },
        link: null,
      });

      // Log content rejection
      await logActivity(req, "CONTENT_REJECT", {
        targetId: id,
        targetType: "comment",
        description: `Rejected comment ${id}. Reason: ${reason}`,
      });
    }

    return res.json({ message: "content disapproved and removed." });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Bans a user from the platform.
 * Creates a ban record, hides all user content, cleans up social links, and sends a ban email.
 *
 * @param req - AuthRequest with params { id } and body { ban_reason }
 * @param res - Express response object
 * @returns Response with ban confirmation
 * @throws {Error} Database or email failure
 *
 * @example
 * ```json
 * Request body:
 * { "ban_reason": "Repeated violations of terms" }
 * ```
 * @response
 * ```json
 * { "message": "user username banned successfully." }
 * ```
 */
export const banUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "access denied." });
    }

    const { id } = req.params;
    const { ban_reason } = req.body;

    if (!ban_reason) {
      return res.status(400).json({ message: "ban reason is required." });
    }

    // Verification: ensure user exists and isn't already blacklisted
    const userToBan = await User.findById(id);
    if (!userToBan) {
      return res.status(404).json({ message: "user not found." });
    }

    const alreadyBanned = await BannedUser.findOne({
      original_user_id: userToBan._id,
    });
    if (alreadyBanned) {
      return res.status(400).json({ message: "user is already banned." });
    }

    // Blacklisting: record the user in the BannedUser collection
    await BannedUser.create({
      email: userToBan.email,
      username: userToBan.username,
      original_user_id: userToBan._id,
      ban_reason: ban_reason,
      banned_at: new Date(),
    });

    // Content suppression: hide all posts and comments from the public eye
    await Post.updateMany({ authorId: userToBan._id }, { isVisible: false });
    await Comment.updateMany({ userId: userToBan._id }, { isVisible: false });
    await Notification.deleteMany({ userId: userToBan._id });

    // Relationship cleanup: pull the banned user from followers/following lists of other users
    const bannedUserId = userToBan._id;
    if (userToBan.following?.length) {
      await User.updateMany(
        { _id: { $in: userToBan.following } },
        { $pull: { followers: bannedUserId } },
      );
    }
    if (userToBan.followers?.length) {
      await User.updateMany(
        { _id: { $in: userToBan.followers } },
        { $pull: { following: bannedUserId } },
      );
    }

    // State update: update the user document itself
    userToBan.isApproved = false;
    userToBan.isBanned = true;
    await userToBan.save();

    // Notification: send localized email informing the user of their ban
    const userLang = userToBan.language || "en";
    const [titleT, bodyT, sigT] = await Promise.all([
      getDualTranslation("Account Banned"),
      getDualTranslation(
        `Your account has been banned from MangoTree. Reason: ${ban_reason}. If you believe this is a mistake, please contact mangotree@support.com.`,
      ),
      getDualTranslation("Sincerely, the MangoTree team"),
    ]);

    const title = getLocalizedText(userLang, titleT);
    const emailHtml = getGenericEmailTemplate({
      title,
      body: getLocalizedText(userLang, bodyT),
      signature: getLocalizedText(userLang, sigT),
    });

    try {
      await sendEmail(userToBan.email, title, emailHtml);
    } catch (e) {
      logger.error("ban email failed to send.");
    }

    // Log user ban
    await logActivity(req, "BAN_USER", {
      targetId: userToBan._id.toString(),
      targetType: "user",
      description: `Banned user ${userToBan.username}. Reason: ${ban_reason}`,
    });

    return res.json({
      message: `user ${userToBan.username} banned successfully.`,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Restores a banned user.
 * Deletes ban record, restores content visibility, and notifies the user via email.
 *
 * @param req - AuthRequest with params { id } (ID of the BannedUser record)
 * @param res - Express response object
 * @returns Response with unban confirmation
 * @throws {Error} Database error
 *
 * @example
 * ```json
 * POST /api/admin/unban/bannedRecordId
 * ```
 * @response
 * ```json
 * { "message": "user username unbanned successfully." }
 * ```
 */
export const unbanUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "access denied." });
    }

    const { id } = req.params;
    const bannedUser = await BannedUser.findById(id);
    if (!bannedUser)
      return res.status(404).json({ message: "banned user record not found." });

    // Restore original user: update flags and bring back content visibility
    const originalUser = await User.findById(bannedUser.original_user_id);
    if (originalUser) {
      originalUser.isApproved = true;
      originalUser.isBanned = false;
      await originalUser.save();

      await Post.updateMany(
        { authorId: originalUser._id },
        { isVisible: true },
      );
      await Comment.updateMany(
        { userId: originalUser._id },
        { isVisible: true },
      );

      // Localization: fetch translated email content
      const userLang = originalUser.language || "en";
      const [titleT, bodyT, sigT] = await Promise.all([
        getDualTranslation("Account Unbanned"),
        getDualTranslation(
          "Your account has been unbanned. Welcome back to the community.",
        ),
        getDualTranslation("Sincerely, the MangoTree team"),
      ]);

      const title = getLocalizedText(userLang, titleT);
      const emailHtml = getGenericEmailTemplate({
        title,
        body: getLocalizedText(userLang, bodyT),
        signature: getLocalizedText(userLang, sigT),
      });

      try {
        await sendEmail(originalUser.email, title, emailHtml);
      } catch (e) {
        logger.error("unban email failed.");
      }
    }

    // Log user unban
    await logActivity(req, "UNBAN_USER", {
      targetId: bannedUser.original_user_id.toString(),
      targetType: "user",
      description: `Unbanned user ${bannedUser.username}`,
    });

    // Cleanup: remove the record from the BannedUser collection
    await BannedUser.findByIdAndDelete(id);
    return res.json({
      message: `user ${bannedUser.username} unbanned successfully.`,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all currently banned users.
 * Returns a list of records from the BannedUser collection.
 *
 * @param req - AuthRequest (Admin role required)
 * @param res - Express response object
 * @returns Response with list of banned user records
 * @throws {Error} Database retrieval error
 *
 * @example
 * ```json
 * GET /api/admin/banned-users
 * ```
 * @response
 * ```json
 * [
 * { "username": "baduser123", "ban_reason": "...", "banned_at": "..." }
 * ]
 * ```
 */
export const getBannedUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "access denied." });
    }
    const bannedUsers = await BannedUser.find({});
    return res.json(bannedUsers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
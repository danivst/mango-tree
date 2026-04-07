import { Response } from "express";
import Post from "../models/post";
import Comment from "../models/comment";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import RoleTypeValue from "../enums/role-type";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import User from "../models/user";
import BannedUser from "../models/banned-user";
import { sendEmail } from "../utils/email";
import { getLocalizedText } from "../utils/get-translation";
import { getGenericEmailTemplate } from "../utils/email-templates";
import { logActivity } from "../utils/activity-logger";

/**
 * Retrieves all posts pending approval.
 * Admin only. Returns posts where isApproved is false, sorted by creation date.
 *
 * @param req - AuthRequest with user.role === ADMIN
 * @param res - Response with array of flagged content objects
 * @returns 200 with flagged posts, 403 if not admin, 500 on error
 */
export const getFlaggedContent = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // 1. authorization: verify the requester is an administrator
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "access denied." });
    }

    // 2. data retrieval: find all posts where isApproved is false
    const unapprovedPosts = await Post.find({ isApproved: false })
      .populate("authorId", "username")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    // 3. mapping: format the data for the frontend to easily display flagged items
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
 * Approves content (post or comment) making it visible.
 * Admin only. For posts, sets isApproved and isVisible to true.
 * For comments, sets isVisible to true.
 *
 * @param req - AuthRequest with params { type: "post"|"comment", id: string }
 * @param res - Response with success message or 404 if not found
 * @returns 200 on success, 403 if not admin, 404 if content not found
 */
export const approveContent = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // 1. authorization check
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "access denied." });
    }

    const { type, id } = req.params;

    // 2. branching logic: handle approval based on content type (post vs comment)
    if (type === "post") {
      const post = await Post.findByIdAndUpdate(
        id,
        { isApproved: true, isVisible: true },
        { new: true },
      );
      if (!post) return res.status(404).json({ message: "post not found." });

      // Log content approval
      await logActivity(req, 'CONTENT_APPROVE', {
        targetId: id,
        targetType: 'post',
        description: `Approved post ${id}`,
      });
    } else if (type === "comment") {
      const comment = await Comment.findByIdAndUpdate(id, { isVisible: true });
      if (!comment) return res.status(404).json({ message: "comment not found." });

      // Log content approval
      await logActivity(req, 'CONTENT_APPROVE', {
        targetId: id,
        targetType: 'comment',
        description: `Approved comment ${id}`,
      });
    }

    return res.json({ message: "content approved successfully." });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Rejects and deletes content, sending a notification to the author.
 * Admin only. Requires a reason in the request body, which is translated.
 *
 * @param req - AuthRequest with params { type, id } and body { reason: string }
 * @param res - Response with success message or error
 * @returns 200 on success, 403 if not admin, 400 if reason missing, 404 if not found
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

    // 1. validation: a reason is mandatory to explain the removal to the user
    if (!reason) {
      return res.status(400).json({ message: "a reason for disapproval is required." });
    }

    // 2. localization: translate the admin's reason to ensure the user understands it
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
      await logActivity(req, 'CONTENT_REJECT', {
        targetId: id,
        targetType: 'post',
        description: `Rejected post ${id}. Reason: ${reason}`,
      });
    } else if (type === "comment") {
      const comment = await Comment.findById(id);
      if (!comment) return res.status(404).json({ message: "comment not found." });

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
      await logActivity(req, 'CONTENT_REJECT', {
        targetId: id,
        targetType: 'comment',
        description: `Rejected comment ${id}. Reason: ${reason}`,
      });
    }

    return res.json({ message: "content disapproved and removed." });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Bans a user, hides their content, and cleans up follow relationships.
 * Admin only. Creates a BannedUser record, hides all posts/comments,
 * deletes notifications, updates follower/following relationships, and
 * sends a ban notification email.
 *
 * @param req - AuthRequest with params { id } and body { ban_reason: string }
 * @param res - Response with success message or error
 * @returns 200 on success, 403 if not admin, 400 if missing reason or already banned, 404 if user not found
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

    // 1. verification: ensure user exists and isn't already blacklisted
    const userToBan = await User.findById(id);
    if (!userToBan) {
      return res.status(404).json({ message: "user not found." });
    }

    const alreadyBanned = await BannedUser.findOne({ original_user_id: userToBan._id });
    if (alreadyBanned) {
      return res.status(400).json({ message: "user is already banned." });
    }

    // 2. blacklisting: record the user in the BannedUser collection
    await BannedUser.create({
      email: userToBan.email,
      username: userToBan.username,
      original_user_id: userToBan._id,
      ban_reason: ban_reason,
      banned_at: new Date(),
    });

    // 3. content suppression: hide all posts and comments from the public eye
    await Post.updateMany({ authorId: userToBan._id }, { isVisible: false });
    await Comment.updateMany({ userId: userToBan._id }, { isVisible: false });
    await Notification.deleteMany({ userId: userToBan._id });

    // 4. relationship cleanup: pull the banned user from followers/following lists of other users
    const bannedUserId = userToBan._id;
    if (userToBan.following?.length) {
      await User.updateMany(
        { _id: { $in: userToBan.following } },
        { $pull: { followers: bannedUserId } }
      );
    }
    if (userToBan.followers?.length) {
      await User.updateMany(
        { _id: { $in: userToBan.followers } },
        { $pull: { following: bannedUserId } }
      );
    }

    // 5. state update: update the user document itself
    userToBan.isApproved = false;
    userToBan.isBanned = true;
    await userToBan.save();

    // 6. notification: send localized email informing the user of their ban
    const userLang = userToBan.language || "en";
    const [titleT, bodyT, sigT] = await Promise.all([
      getDualTranslation("Account Banned"),
      getDualTranslation(`Your account has been banned from MangoTree. Reason: ${ban_reason}. If you believe this is a mistake, please contact mangotree@support.com.`),
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
      console.error("ban email failed to send.");
    }

    // Log user ban
    await logActivity(req, 'BAN_USER', {
      targetId: userToBan._id.toString(),
      targetType: 'user',
      description: `Banned user ${userToBan.username}. Reason: ${ban_reason}`,
    });

    return res.json({ message: `user ${userToBan.username} banned successfully.` });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Reverses a ban and restores user's content visibility.
 * Admin only. Removes BannedUser record, sets user.isBanned=false, isApproved=true,
 * makes all posts/comments visible again, and sends an unbanned email.
 *
 * @param req - AuthRequest with params { id } (BannedUser ID)
 * @param res - Response with success message or error
 * @returns 200 on success, 403 if not admin, 404 if banned user record not found
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
    if (!bannedUser) return res.status(404).json({ message: "banned user record not found." });

    // 1. restore original user: update flags and bring back content visibility
    const originalUser = await User.findById(bannedUser.original_user_id);
    if (originalUser) {
      originalUser.isApproved = true;
      originalUser.isBanned = false;
      await originalUser.save();

      await Post.updateMany({ authorId: originalUser._id }, { isVisible: true });
      await Comment.updateMany({ userId: originalUser._id }, { isVisible: true });

      // 2. localization: fetch translated email content
      const userLang = originalUser.language || "en";
      const [titleT, bodyT, sigT] = await Promise.all([
        getDualTranslation("Account Unbanned"),
        getDualTranslation("Your account has been unbanned. Welcome back to the community."),
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
        console.error("unban email failed.");
      }
    }

    // Log user unban
    await logActivity(req, 'UNBAN_USER', {
      targetId: bannedUser.original_user_id.toString(),
      targetType: 'user',
      description: `Unbanned user ${bannedUser.username}`,
    });

    // 3. cleanup: remove the record from the BannedUser collection
    await BannedUser.findByIdAndDelete(id);
    return res.json({ message: `user ${bannedUser.username} unbanned successfully.` });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all banned users from the BannedUser collection.
 * Admin only.
 *
 * @param req - AuthRequest with user.role === ADMIN
 * @param res - Response with array of BannedUser documents
 * @returns 200 with banned users list, 403 if not admin
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
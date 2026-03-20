import { Response } from "express";
import mongoose, { Types } from "mongoose";
import Post from "../models/post";
import Comment from "../models/comment";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import RoleTypeValue from "../enums/role-type";
import { AuthRequest } from "../utils/auth";
import { getDualTranslation } from "../utils/translation";
import User from "../models/user"; // Import User model
import BannedUser from "../models/banned_user"; // Import BannedUser model
import { sendEmail } from "../utils/email";

// Helper to get translation based on user language
const getLocalizedText = (userLang: string, translations: { bg: string; en: string }): string => {
  return userLang === 'bg' ? translations.bg : translations.en;
};

/* ---------- GET FLAGGED CONTENT ---------- */
export const getFlaggedContent = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const unapprovedPosts = await Post.find({ isApproved: false })
      .populate("authorId", "username")
      .populate("category", "name") // Populate category to get name
      .sort({ createdAt: -1 });

    const flaggedContent = unapprovedPosts.map((post) => ({
      _id: post._id,
      type: "post",
      content: {
        title: post.title,
        content: post.content,
        image: post.image,
        translations: post.translations,
        category: post.category ? (post.category as any).name : undefined,
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

/* ---------- APPROVE CONTENT ---------- */
export const approveContent = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { type, id } = req.params;

    if (type === "post") {
      const post = await Post.findByIdAndUpdate(
        id,
        { isApproved: true, isVisible: true },
        { new: true },
      );
      if (!post) return res.status(404).json({ message: "Post not found." });
    } else if (type === "comment") {
      const comment = await Comment.findById(id);
      if (!comment)
        return res.status(404).json({ message: "Comment not found." });
      // If adding isApproved to comments:
      // await Comment.findByIdAndUpdate(id, { isApproved: true });
    }

    return res.json({ message: "Content approved successfully." });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DISAPPROVE CONTENT ---------- */
export const disapproveContent = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { type, id } = req.params;
    const { reason } = req.body as { reason: string };

    if (!reason) {
      return res
        .status(400)
        .json({ message: "A reason for disapproval is required." });
    }

    // Get dual translation for the admin's reason
    const translatedReason = await getDualTranslation(reason);

    if (type === "post") {
      const post = await Post.findById(id).populate("authorId");
      if (!post) return res.status(404).json({ message: "Post not found." });

      const authorId = (post.authorId as any)._id || post.authorId;
      await Post.findByIdAndDelete(id);

      const messageEn = `Your post has been removed. Reason: ${translatedReason.en}`;
      const messageBg = `Вашата публикация беше премахната. Причина: ${translatedReason.bg}`;

      await Notification.create({
        userId: authorId,
        type: NotificationType.REPORT_FEEDBACK,
        message: messageEn,
        translations: {
          message: {
            en: messageEn,
            bg: messageBg,
          },
        },
        link: null,
      });
    } else if (type === "comment") {
      const comment = await Comment.findById(id).populate("userId");
      if (!comment)
        return res.status(404).json({ message: "Comment not found." });

      const userId = (comment.userId as any)._id || comment.userId;
      await Comment.findByIdAndDelete(id);

      const commentMessageEn = `Your comment has been removed. Reason: ${translatedReason.en}`;
      const commentMessageBg = `Вашият коментар беше премахнат. Причина: ${translatedReason.bg}`;

      await Notification.create({
        userId: userId,
        type: NotificationType.REPORT_FEEDBACK,
        message: commentMessageEn,
        translations: {
          message: {
            en: commentMessageEn,
            bg: commentMessageBg,
          },
        },
        link: null,
      });
    }

    return res.json({ message: "Content disapproved and removed." });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- BAN USER ---------- */
export const banUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;
    const { ban_reason } = req.body;

    if (!ban_reason) {
      return res.status(400).json({ message: "Ban reason is required." });
    }

    const userToBan = await User.findById(id);
    if (!userToBan) {
      return res.status(404).json({ message: "User not found." });
    }

    const alreadyBanned = await BannedUser.findOne({ original_user_id: userToBan._id });
    if (alreadyBanned) {
      return res.status(400).json({ message: "User is already banned." });
    }

    // Create BannedUser record
    await BannedUser.create({
      email: userToBan.email,
      username: userToBan.username,
      original_user_id: userToBan._id,
      ban_reason: ban_reason,
      banned_at: new Date(),
    });

    // Hide associated content instead of deleting
    await Post.updateMany({ authorId: userToBan._id }, { isVisible: false });
    await Comment.updateMany({ userId: userToBan._id }, { isVisible: false });
    await Notification.deleteMany({ userId: userToBan._id });

    // Clean up follow relationships before banning
    try {
      const bannedUserId = userToBan._id;
      // Remove this user from others' followers lists (who this user follows)
      if (userToBan.following && userToBan.following.length > 0) {
        await Promise.all(
          userToBan.following.map((followedId: Types.ObjectId) =>
            User.findByIdAndUpdate(followedId, {
              $pull: { followers: bannedUserId }
            })
          )
        );
      }
      // Remove this user from others' following lists (who follows this user)
      if (userToBan.followers && userToBan.followers.length > 0) {
        await Promise.all(
          userToBan.followers.map((followerId: Types.ObjectId) =>
            User.findByIdAndUpdate(followerId, {
              $pull: { following: bannedUserId }
            })
          )
        );
      }
    } catch (cleanupErr) {
      console.error("Error cleaning up follow relationships for ban:", cleanupErr);
      // Continue with ban even if cleanup fails
    }

    // Lock out user (preserve record)
    userToBan.isApproved = false;
    userToBan.isBanned = true;
    await userToBan.save();

    // Send ban notification email
    const userLang = userToBan.language || 'en';

    const [titleTrans, bodyTrans, signatureTrans] = await Promise.all([
      getDualTranslation("Account Banned"),
      getDualTranslation(`Your account has been banned from MangoTree. Reason: ${ban_reason}. If you believe this is a mistake, please contact mangotree@support.com.`),
      getDualTranslation("Sincerely, the MangoTree team"),
    ]);

    const title = getLocalizedText(userLang, titleTrans);
    const body = getLocalizedText(userLang, bodyTrans);
    const signature = getLocalizedText(userLang, signatureTrans);

    const banEmailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${body}</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${signature}</p>
      </div>
    `;

    try {
      await sendEmail(userToBan.email, title, banEmailHtml);
    } catch (emailError) {
      console.error("Failed to send ban email:", emailError);
      // Continue with response even if email fails
    }

    return res.json({ message: `User ${userToBan.username} banned successfully.` });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UNBAN USER ---------- */
export const unbanUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params; // This `id` will be the _id of the BannedUser document

    const bannedUser = await BannedUser.findById(id);
    if (!bannedUser) {
      return res.status(404).json({ message: "Banned user record not found." });
    }

    // Find the original user and unban them
    const originalUser = await User.findById(bannedUser.original_user_id);
    if (originalUser) {
      originalUser.isApproved = true;
      originalUser.isBanned = false;
      await originalUser.save();

      // Restore associated content
      await Post.updateMany({ authorId: originalUser._id }, { isVisible: true });
      await Comment.updateMany({ userId: originalUser._id }, { isVisible: true });

      // Send unban notification email
      const userLang = originalUser.language || 'en';

      const [titleTrans, bodyTrans, signatureTrans] = await Promise.all([
        getDualTranslation("Account Unbanned"),
        getDualTranslation("Your account has been unbanned from MangoTree. You can now access your account again. We welcome you back to the community."),
        getDualTranslation("Sincerely, the MangoTree team"),
      ]);

      const title = getLocalizedText(userLang, titleTrans);
      const body = getLocalizedText(userLang, bodyTrans);
      const signature = getLocalizedText(userLang, signatureTrans);

      const unbanEmailHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
          <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${body}</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${signature}</p>
        </div>
      `;

      try {
        await sendEmail(originalUser.email, title, unbanEmailHtml);
      } catch (emailError) {
        console.error("Failed to send unban email:", emailError);
        // Continue with response even if email fails
      }
    }

    // Remove the banned user record
    await BannedUser.findByIdAndDelete(id);

    return res.json({ message: `User ${bannedUser.username} unbanned successfully.` });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET BANNED USERS ---------- */
export const getBannedUsers = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const bannedUsers = await BannedUser.find({});
    return res.json(bannedUsers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

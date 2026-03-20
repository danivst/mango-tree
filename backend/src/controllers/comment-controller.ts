import { Request, Response } from "express";
import { Types } from "mongoose";

import Comment from "../models/comment";
import Post from "../models/post";
import User from "../models/user";
import Notification from "../models/notification";

import NotificationType from "../enums/notification-type";
import RoleTypeValue from "../enums/role-type";

import { moderateText } from "../utils/ai";
import { AuthRequest } from "../utils/auth";
import { getDualTranslation } from "../utils/translation";

/* ---------- CREATE COMMENT ---------- */
export const createComment = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);
    const { postId, text } = req.body;

    const post = await Post.findById(postId);
    if (!post || !post.isVisible) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Automatically translate the comment text
    const translations = await getDualTranslation(text);

    const comment = await Comment.create({
      postId,
      userId: userIdObj,
      text,
      translations,
      isVisible: true,
    });

    // Populate userId before returning
    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "username profileImage");

    if (!post.authorId.equals(userIdObj)) {
      // Localize the post title for the notification if available
      const postTitleEn = post.translations?.title?.en || post.title;
      const postTitleBg = post.translations?.title?.bg || post.title;

      // Fallback: if JWT lacks username, fetch from DB
      let actorUsername = req.user?.username;
      if (!actorUsername) {
        const actor = await User.findById(userId).select("username");
        actorUsername = actor?.username || "Someone";
      }

      const messageEn = `${actorUsername} commented on your post "${postTitleEn}"`;
      const messageBg = `${actorUsername} коментира вашата публикация "${postTitleBg}"`;

      await Notification.create({
        userId: post.authorId,
        type: NotificationType.COMMENT,
        message: messageEn,
        translations: {
          message: {
            en: messageEn,
            bg: messageBg,
          },
        },
        link: `/posts/${post._id}#comment-${populatedComment!._id}`,
      });
    }

    return res.status(201).json(populatedComment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- TOGGLE LIKE COMMENT ---------- */
export const toggleLikeComment = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    console.log(`[toggleLikeComment] User ${userId} (${userIdObj}) toggling like on comment ${comment._id}`);
    console.log(`[toggleLikeComment] Comment current likes:`, comment.likes);

    const hasLiked = comment.likes.some((likeId) => likeId.equals(userIdObj));

    console.log(`[toggleLikeComment] User has already liked?`, hasLiked);

    if (hasLiked) {
      comment.likes = comment.likes.filter(
        (likeId) => !likeId.equals(userIdObj),
      );
    } else {
      comment.likes.push(userIdObj);
    }

    await comment.save();

    if (!hasLiked && !comment.userId.equals(userIdObj)) {
      // Fallback: if JWT lacks username, fetch from DB
      let actorUsername = req.user?.username;
      if (!actorUsername) {
        const actor = await User.findById(userId).select("username");
        actorUsername = actor?.username || "Someone";
      }

      const likeMessageEn = `${actorUsername} liked your comment`;
      const likeMessageBg = `${actorUsername} хареса коментара ви`;

      await Notification.create({
        userId: comment.userId,
        type: NotificationType.LIKE,
        message: likeMessageEn,
        translations: {
          message: {
            en: likeMessageEn,
            bg: likeMessageBg,
          },
        },
        link: `/posts/${comment.postId}#comment-${comment._id}`,
      });
    }

    return res.json({
      message: hasLiked ? "Unliked" : "Liked",
      likes: comment.likes,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- TRANSLATE COMMENT ---------- */
export const translateComment = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { targetLang } = req.query;

    if (!targetLang || !['en', 'bg'].includes(targetLang as string)) {
      return res.status(400).json({ message: "Invalid target language. Use 'en' or 'bg'." });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Translate the comment text
    const translation = await getDualTranslation(comment.text);
    const isBg = targetLang === 'bg';
    const translatedText = isBg ? translation.bg : translation.en;

    return res.json({
      text: translatedText,
      sourceLang: isBg ? 'en' : 'bg',
      targetLang: targetLang,
    });
  } catch (err: any) {
    console.error("Comment translation error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE COMMENT ---------- */
export const updateComment = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = new Types.ObjectId(req.user!.userId);

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.userId.equals(userId)) {
      return res.status(403).json({ message: "Not your comment" });
    }

    const flagged = await moderateText("Comment", text);
    if (flagged) {
      const flaggedMessageEn = "Your comment update was flagged as inappropriate";
      const flaggedMessageBg = "Актуализацията на коментара ви беше маркирана като неподходяща";

      await Notification.create({
        userId,
        type: NotificationType.REPORT_FEEDBACK,
        message: flaggedMessageEn,
        translations: {
          message: {
            en: flaggedMessageEn,
            bg: flaggedMessageBg,
          },
        },
        link: `/posts/${comment.postId}#comment-${comment._id}`,
      });

      return res
        .status(400)
        .json({ message: "Comment update flagged as inappropriate" });
    }

    // Re-translate updated text
    const translations = await getDualTranslation(text);

    comment.text = text;
    comment.translations = translations;

    await comment.save();

    return res.json(comment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE COMMENT ---------- */
export const deleteComment = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = new Types.ObjectId(req.user!.userId);

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      !comment.userId.equals(userId) &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Comment.findByIdAndDelete(id);
    return res.json({ message: "Comment deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET COMMENTS BY POST ---------- */
export const getCommentsByPost = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { postId } = req.params;

    console.log(`[getCommentsByPost] Fetching comments for post: ${postId}`);

    const comments = await Comment.find({
      postId,
      $or: [{ isVisible: true }, { isVisible: { $exists: false } }],
    })
      .populate("userId", "username profileImage")
      .sort({ createdAt: -1 });

    console.log(`[getCommentsByPost] Found ${comments.length} comments`);
    comments.forEach(c => {
      const user = c.userId as any;
      console.log(`[getCommentsByPost] Comment ${c._id}: userId=${user?._id}, hasUsername=${!!user?.username}`);
    });

    return res.json(comments);
  } catch (err: any) {
    console.error("[getCommentsByPost] Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET COMMENT BY ID ---------- */
export const getComment = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    const comment = await Comment.findOne({
      _id: id,
      $or: [{ isVisible: true }, { isVisible: { $exists: false } }],
    }).populate("userId", "username profileImage");

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.json(comment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

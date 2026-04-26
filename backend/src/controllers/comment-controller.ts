/**
 * @file comment-controller.ts
 * @description Manages comment and reply operations including AI moderation,
 * notifications and translation.
 */

import { Request, Response } from "express";
import { Types } from "mongoose";
import Comment from "../models/comment-model";
import Post from "../models/post-model";
import User from "../models/user-model";
import Notification from "../models/notification-model";
import NotificationType from "../enums/notification-type";
import RoleTypeValue from "../enums/role-type";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import { moderateText } from "../utils/ai";
import { logActivity } from "../utils/activity-logger";
import logger from "../utils/logger";

/**
 * Creates a new comment or reply.
 * Performs AI moderation. If flagged, rejects content and notifies user. Otherwise, saves and notifies post/parent author.
 *
 * @param req - AuthRequest with body { postId, text, parentCommentId? }
 * @param res - Express response object
 * @returns Response with created comment or rejection reason
 * @throws {Error} Moderation service or database failure
 *
 * @example
 * ```json
 * Request body:
 * { "postId": "...", "text": "This looks delicious!" }
 * ```
 * @response
 * ```json
 * { "_id": "...", "text": "...", "userId": { "username": "..." } }
 * ```
 */
export const createComment = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);
    const { postId, text, parentCommentId } = req.body;

    const post = await Post.findById(postId);
    if (!post || !post.isVisible) {
      return res.status(404).json({ message: "Post not found" });
    }

    let moderationResult: any = null;
    let moderationError = false;

    try {
      moderationResult = await moderateText(text);
    } catch (moderationErr: any) {
      logger.error(
        moderationErr,
        "[createComment] Moderation service error",
      );
      moderationError = true;
      moderationResult = { flagged: false };
    }

    if (moderationResult?.flagged) {
      let reasonKey: string;
      let reasonDetail: string = moderationResult.reason || "";

      reasonKey = "commentInappropriate";

      const prefixEn = "Comment rejected. Reason: ";
      const prefixBg = "Коментарът е отхвърлен. Причина: ";
      const reasonEn = moderationResult.reason || "Comment is inappropriate.";
      const reasonBg = "Коментарът е неуместен.";
      const messageEn = prefixEn + reasonEn;
      const messageBg = prefixBg + reasonBg;

      await Notification.create({
        userId: userId,
        type: NotificationType.FAIL,
        message: messageEn,
        translations: {
          message: {
            en: messageEn,
            bg: messageBg,
          },
        },
        link: null,
      });

      return res.json({
        error: reasonKey,
        reason: reasonDetail,
        flagged: true,
      });
    }

    const commentData: any = {
      postId,
      userId: userIdObj,
      text,
      translations: await getDualTranslation(text),
      isVisible: true,
    };

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      if (parentComment.postId.toString() !== postId) {
        return res
          .status(400)
          .json({ message: "Parent comment does not belong to this post" });
      }
      commentData.parentCommentId = new Types.ObjectId(parentCommentId);
    }

    const comment = await Comment.create(commentData);

    const populatedComment = await Comment.findById(comment._id).populate(
      "userId",
      "username profileImage",
    );

    await logActivity(req, "COMMENT_CREATE", {
      targetId: comment._id.toString(),
      targetType: "comment",
      description: `Created comment on post ${postId}`,
    });

    if (!post.authorId.equals(userIdObj)) {
      const postTitleEn = post.translations?.title?.en || post.title;
      const postTitleBg = post.translations?.title?.bg || post.title;

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

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId).populate(
        "userId",
        "username",
      );
      const parentAuthor = parentComment?.userId;
      if (parentAuthor && !parentAuthor._id.equals(userIdObj)) {
        let actorUsername = req.user?.username;
        if (!actorUsername) {
          const actor = await User.findById(userId).select("username");
          actorUsername = actor?.username || "Someone";
        }

        const replyMessageEn = `${actorUsername} replied to your comment`;
        const replyMessageBg = `${actorUsername} отговори на вашия коментар`;

        await Notification.create({
          userId: parentAuthor._id,
          type: NotificationType.REPLY,
          message: replyMessageEn,
          translations: {
            message: {
              en: replyMessageEn,
              bg: replyMessageBg,
            },
          },
          link: `/posts/${post._id}#comment-${populatedComment!._id}`,
        });
      }
    }

    return res.status(201).json(populatedComment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Toggles a like on a comment.
 * Adds/removes user from likes array and notifies the author if it's a new like.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with updated likes array
 * @throws {Error} Database update failure
 *
 * @example
 * ```json
 * POST /api/comments/commentId123/like
 * ```
 * @response
 * ```json
 * { "message": "Liked", "likes": ["userId1", "userId2"] }
 * ```
 */
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

    const hasLiked = comment.likes.some((likeId) => likeId.equals(userIdObj));

    if (hasLiked) {
      comment.likes = comment.likes.filter(
        (likeId) => !likeId.equals(userIdObj),
      );
    } else {
      comment.likes.push(userIdObj);
    }

    await comment.save();

    await logActivity(req, hasLiked ? "UNLIKE" : "LIKE", {
      targetId: comment.id.toString(),
      targetType: "comment",
      description: `${hasLiked ? "Unliked" : "Liked"} comment ${id}`,
    });

    if (!hasLiked && !comment.userId.equals(userIdObj)) {
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

/**
 * Translates a comment on demand.
 * Uses DeepL to translate the specific comment text into the target language.
 *
 * @param req - AuthRequest with params { id } and query { targetLang }
 * @param res - Express response object
 * @returns Response with translated text
 * @throws {Error} Translation service failure
 *
 * @example
 * ```json
 * GET /api/comments/id/translate?targetLang=bg
 * ```
 * @response
 * ```json
 * { "text": "Прекрасно!", "sourceLang": "en", "targetLang": "bg" }
 * ```
 */
export const translateComment = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { targetLang } = req.query;

    if (!targetLang || !["en", "bg"].includes(targetLang as string)) {
      return res
        .status(400)
        .json({ message: "Invalid target language. Use 'en' or 'bg'." });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const translation = await getDualTranslation(comment.text);
    const isBg = targetLang === "bg";
    const translatedText = isBg ? translation.bg : translation.en;

    return res.json({
      text: translatedText,
      sourceLang: isBg ? "en" : "bg",
      targetLang: targetLang,
    });
  } catch (err: any) {
    logger.error(err, "Comment translation error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates an existing comment.
 * Re-moderates the new text via AI and re-translates it. Restricted to Owner.
 *
 * @param req - AuthRequest with params { id } and body { text }
 * @param res - Express response object
 * @returns Response with updated comment
 * @throws {Error} Moderation or database failure
 *
 * @example
 * ```json
 * Request body:
 * { "text": "Updated comment text" }
 * ```
 * @response
 * ```json
 * { "_id": "...", "text": "Updated comment text" }
 * ```
 */
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

    try {
      const moderationResult = await moderateText(text);
      if (moderationResult?.flagged) {
        const flaggedMessageEn =
          "Your comment update was flagged as inappropriate";
        const flaggedMessageBg =
          "Актуализацията на коментара ви беше маркирана като неподходяща";

        await Notification.create({
          userId,
          type: NotificationType.FAIL,
          message: flaggedMessageEn,
          translations: {
            message: {
              en: flaggedMessageEn,
              bg: flaggedMessageBg,
            },
          },
          link: `/posts/${comment.postId}#comment-${comment._id}`,
        });

        return res.json({
          flagged: true,
          reason: moderationResult.reason,
          message: "Comment update flagged as inappropriate",
        });
      }
    } catch (moderationErr: any) {
      logger.error(
        moderationErr,
        "[updateComment] Moderation service error",
      );
    }

    const translations = await getDualTranslation(text);

    comment.text = text;
    comment.translations = translations;

    await comment.save();

    const successMsgEn = "Your comment was updated successfully.";
    const successMsgBg = "Коментарът ви беше актуализиран успешно.";

    await Notification.create({
      userId: userId,
      type: NotificationType.SUCCESS,
      message: successMsgEn,
      translations: {
        message: { 
          en: successMsgEn, 
          bg: successMsgBg 
        },
      },
      link: `/posts/${comment.postId}#comment-${comment._id}`,
    });

    await logActivity(req, "COMMENT_EDIT", {
      targetId: comment.id.toString(),
      targetType: "comment",
      description: `Updated comment ${id}`,
    });

    return res.json(comment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Recursively deletes a comment tree.
 * Helper function to handle cascade deletion of replies.
 *
 * @param commentId - Root comment ID to delete
 * @returns Promise void
 * @throws {Error} Database deletion failure
 */
const deleteCommentTree = async (
  commentId: Types.ObjectId
): Promise<void> => {
  try {
    const children = await Comment.find({ parentCommentId: commentId });
    for (const child of children) {
      await deleteCommentTree(child._id as Types.ObjectId);
    }
    await Comment.findByIdAndDelete(commentId);
  } catch (err: any) {
    logger.error(err, `Error deleting comment tree for commentId ${commentId}`);
  }
};

/**
 * Deletes a comment and all its replies.
 * Restricted to Owner or Admin. Triggers a recursive tree deletion.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with deletion confirmation
 * @throws {Error} Database deletion failure
 *
 * @example
 * ```json
 * DELETE /api/comments/commentId123
 * ```
 * @response
 * ```json
 * { "message": "Comment deleted" }
 * ```
 */
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

    await deleteCommentTree(comment._id as Types.ObjectId);

    await logActivity(req, "COMMENT_DELETE", {
      targetId: comment.id.toString(),
      targetType: "comment",
      description: `Deleted comment ${id}`,
    });

    return res.json({ message: "Comment deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves comments for a post in a tree structure.
 * Organizes replies under their respective parent comments. Only returns visible comments.
 *
 * @param req - Request with params { postId }
 * @param res - Express response object
 * @returns Response with hierarchical comment list
 * @throws {Error} Database retrieval failure
 *
 * @example
 * ```json
 * GET /api/posts/postId/comments
 * ```
 * @response
 * ```json
 * [
 * { "_id": "root", "text": "...", "replies": [{ "_id": "reply", ... }] }
 * ]
 * ```
 */
export const getCommentsByPost = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({
      postId,
      $or: [{ isVisible: true }, { isVisible: { $exists: false } }],
    })
      .populate("userId", "username profileImage")
      .sort({ createdAt: 1 });

    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    comments.forEach((comment) => {
      const commentId = comment._id as Types.ObjectId;
      commentMap.set(commentId.toString(), {
        ...comment.toObject(),
        replies: [],
      });
    });

    comments.forEach((comment) => {
      const commentId = comment._id as Types.ObjectId;
      const commentObj = commentMap.get(commentId.toString());

      if (
        comment.parentCommentId &&
        commentMap.has(comment.parentCommentId.toString())
      ) {
        const parent = commentMap.get(comment.parentCommentId.toString());
        parent.replies.push(commentObj);
      } else {
        rootComments.push(commentObj);
      }
    });

    const sortRepliesRecursive = (commentList: any[]) => {
      commentList.forEach((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          sortRepliesRecursive(comment.replies);
        }
      });
    };

    rootComments.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    sortRepliesRecursive(rootComments);

    return res.json(rootComments);
  } catch (err: any) {
    logger.error(err, "[getCommentsByPost] Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Fetches a single comment.
 * Population includes the author's basic profile. Only returns if visible.
 *
 * @param req - Request with params { id }
 * @param res - Express response object
 * @returns Response with comment data
 * @throws {Error} Database fetch failure
 *
 * @example
 * ```json
 * GET /api/comments/commentId123
 * ```
 * @response
 * ```json
 * { "_id": "...", "text": "...", "userId": { "username": "..." } }
 * ```
 */
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

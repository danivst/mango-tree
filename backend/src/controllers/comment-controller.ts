import { Request, Response } from "express";
import { Types } from "mongoose";
import Comment from "../models/comment";
import Post from "../models/post";
import User from "../models/user";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import RoleTypeValue from "../enums/role-type";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import { moderateText } from "../utils/ai";

/**
 * @file comment-controller.ts
 * @description Manages comment and reply operations including AI moderation,
 * notifications, and translation.
 */

/**
 * Creates a new comment or reply on a post.
 * Moderates content via AI; if flagged as inappropriate, sends notification
 * and returns flagged status (200 OK, not an error).
 * Generates bilingual translations for the comment text.
 * Sends notifications to post author (for new comments) and parent comment author (for replies).
 *
 * @param req - AuthRequest with body { postId, text, parentCommentId? }
 * @param res - Response with created comment or flagged status
 * @returns 201 with populated comment, or 200 with flagged: true if inappropriate,
 *          404 if post not found, 500 on server error
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

    // AI Moderation for comments (check appropriateness only)
    let moderationResult: any = null;
    let moderationError = false;

    try {
      moderationResult = await moderateText(text);
    } catch (moderationErr: any) {
      console.error("[createComment] Moderation service error:", moderationErr.message);
      moderationError = true;
      moderationResult = { flagged: false }; // Continue creating comment but flag for admin review if needed
    }

    if (moderationResult?.flagged) {
      // For comments, only check isAppropriate (cooking-relatedness is not enforced)
      let reasonKey: string;
      let reasonDetail: string = moderationResult.reason || "";

      reasonKey = "commentInappropriate";
      // No need to check isCookingRelated since moderateText doesn't enforce it

      // Send notification to user with "Comment rejected. Reason:" prefix
      const prefixEn = "Comment rejected. Reason: ";
      const prefixBg = "Коментарът е отхвърлен. Причина: ";
      const reasonEn = moderationResult.reason || "Comment is inappropriate.";
      const reasonBg = "Коментарът е неуместен.";
      const messageEn = prefixEn + reasonEn;
      const messageBg = prefixBg + reasonBg;

      await Notification.create({
        userId: userId,
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

      // Return 200 OK with rejection info - moderation decision, not an error
      return res.json({
        error: reasonKey,
        reason: reasonDetail,
        flagged: true,
      });
    }

    // Build comment object
    const commentData: any = {
      postId,
      userId: userIdObj,
      text,
      translations: await getDualTranslation(text),
      isVisible: true,
    };

    // If parentCommentId is provided, it's a reply
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      if (parentComment.postId.toString() !== postId) {
        return res.status(400).json({ message: "Parent comment does not belong to this post" });
      }
      commentData.parentCommentId = new Types.ObjectId(parentCommentId);
    }

    const comment = await Comment.create(commentData);

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

    // If this is a reply, notify the parent comment author
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId).populate('userId', 'username');
      const parentAuthor = parentComment?.userId;
      if (parentAuthor && !parentAuthor._id.equals(userIdObj)) {
        // Actor username already fetched above
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
 * Toggles like/unlike on a comment.
 * Sends a notification to comment author when liked (not when unliking).
 *
 * @param req - AuthRequest with params { id } (comment ID)
 * @param res - Response with { message, likes[] }
 * @returns 200 with updated likes array, 404 if comment not found
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

/**
 * Translates a comment's text to the requested language.
 * Uses DeepL API to get both translations, then returns the requested one.
 *
 * @param req - AuthRequest with params { id } and query { targetLang: 'en'|'bg' }
 * @param res - Response with { text, sourceLang, targetLang }
 * @returns 200 with translated text, 400 for invalid language, 404 if comment not found
 */
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

/**
 * Updates a comment's text (owner only).
 * Re-translates the new text via DeepL and re-moderates via AI.
 * If flagged, sends notification but still saves the update.
 *
 * @param req - AuthRequest with params { id } and body { text }
 * @param res - Response with updated comment or flagged status
 * @returns 200 with updated comment or flagged: true, 403 if not owner, 404 if not found
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

    // AI Moderation for comment updates (check appropriateness only)
    try {
      const moderationResult = await moderateText(text);
      if (moderationResult?.flagged) {
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

        // Return 200 OK with rejection info - moderation decision, not an error
        return res.json({
          flagged: true,
          reason: moderationResult.reason,
          message: "Comment update flagged as inappropriate",
        });
      }
    } catch (moderationErr: any) {
      console.error("[updateComment] Moderation service error:", moderationErr.message);
      // Continue with update even if moderation service fails
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
// Helper to delete a comment and all its descendants recursively
const deleteCommentTree = async (commentId: Types.ObjectId): Promise<void> => {
  // Find all direct children
  const children = await Comment.find({ parentCommentId: commentId });
  // Recursively delete each child and its subtree
  for (const child of children) {
    await deleteCommentTree(child._id as Types.ObjectId);
  }
  // Finally delete this comment
  await Comment.findByIdAndDelete(commentId);
};

/**
 * Deletes a comment and all its replies recursively.
 * Owner or admin only. Uses helper deleteCommentTree for cascade deletion.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Response with success message or error
 * @returns 200 on success, 403 if not authorized, 404 if comment not found
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

    // Delete the comment and all its replies recursively
    await deleteCommentTree(comment._id as Types.ObjectId);
    return res.json({ message: "Comment deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all comments for a specific post, organized as a tree.
 * Returns only visible comments. Builds nested structure using parentCommentId.
 *
 * @param req - Request with params { postId }
 * @param res - Response with array of root comments, each having replies[] nested
 * @returns 200 with hierarchical comment tree, 500 on error
 */
export const getCommentsByPost = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { postId } = req.params;

    // Fetch all comments for the post, sorted by createdAt ascending (oldest first for proper threading)
    const comments = await Comment.find({
      postId,
      $or: [{ isVisible: true }, { isVisible: { $exists: false } }],
    })
      .populate("userId", "username profileImage")
      .sort({ createdAt: 1 }); // Sort oldest first for proper parent-before-child ordering

    // Build hierarchical tree structure
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    // First pass: create map and add replies array to each comment
    comments.forEach(comment => {
      const commentId = comment._id as Types.ObjectId;
      commentMap.set(commentId.toString(), {
        ...comment.toObject(),
        replies: []
      });
    });

    // Second pass: build tree by assigning comments to their parents
    comments.forEach(comment => {
      const commentId = comment._id as Types.ObjectId;
      const commentObj = commentMap.get(commentId.toString());

      if (comment.parentCommentId && commentMap.has(comment.parentCommentId.toString())) {
        // This is a reply - add it to parent's replies array
        const parent = commentMap.get(comment.parentCommentId.toString());
        parent.replies.push(commentObj);
      } else {
        // This is a root comment (no parent)
        rootComments.push(commentObj);
      }
    });

    // Sort replies within each parent by createdAt ascending
    const sortRepliesRecursive = (commentList: any[]) => {
      commentList.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          sortRepliesRecursive(comment.replies);
        }
      });
    };

    rootComments.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    sortRepliesRecursive(rootComments);

    return res.json(rootComments);
  } catch (err: any) {
    console.error("[getCommentsByPost] Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves a single comment by ID.
 * Only returns visible comments.
 *
 * @param req - Request with params { id }
 * @param res - Response with comment populated with userId
 * @returns 200 with comment, 404 if not found
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

/**
 * @file post-crud-controller.ts
 * @description Manages core Post lifecycle operations (CRUD).
 * Includes automated AI content moderation, multi-lingual translations (EN/BG),
 * tag processing and complex notification logic for approvals and deletions.
 */

import { Request, Response } from "express";
import { Types } from "mongoose";
import Post from "../../models/post-model";
import Comment from "../../models/comment-model";
import Notification from "../../models/notification-model";
import NotificationType from "../../enums/notification-type";
import RoleTypeValue from "../../enums/role-type";
import moderateContent from "../../utils/ai";
import { AuthRequest } from "../../interfaces/auth";
import { getDualTranslation } from "../../utils/translation";
import { logActivity } from "../../utils/activity-logger";
import logger from "../../utils/logger";

/**
 * Creates a new post.
 * Processes title, content, images, categories, and tags. Includes AI moderation,
 * dual-language translation and creates appropriate notifications for the author.
 *
 * @param req - AuthRequest with body { title, content, image?, category, tags? }
 * @param res - Express response object
 * @returns Response with created post data or flagged status
 * @throws {Error} Database error if save fails
 *
 * @example
 * ```json
 * Request body:
 * { "title": "My Pasta", "content": "Recipe here...", "category": "id", "tags": ["id1"] }
 * ```
 * @response
 * ```json
 * {
 * "messageKey": "postPublishedSuccess",
 * "post": { "_id": "...", "title": "My Pasta" }
 * }
 * ```
 */
export const createPost = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { title, content, image, category, tags } = req.body;
    const authorId = req.user!.userId;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." });
    }

    if (!category || !Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Invalid category provided." });
    }

    const tagsArray = Array.isArray(tags)
      ? tags.filter((t) => Types.ObjectId.isValid(t))
      : [];

    let moderationResult: any = null;
    let moderationError = false;

    try {
      moderationResult = await moderateContent(title, content, image);
    } catch (moderationErr: any) {
      logger.error(moderationErr, "Moderation service error");
      moderationError = true;
      moderationResult = { flagged: false };
    }

    if (moderationResult?.flagged) {
      let reasonKey =
        moderationResult.isCookingRelated === false
          ? "postNotCooking"
          : "postInappropriate";
      const messageEn = `Post upload failed. Reason: ${moderationResult.reason || "Inappropriate content."}`;
      const messageBg =
        moderationResult.isCookingRelated === false
          ? "Публикуването не бе успешно. Причина: Публикацията не е свързана с готвене."
          : "Публикуването не бе успешно. Причина: Съдържанието е неуместно.";

      await Notification.create({
        userId: authorId,
        type: NotificationType.FAIL,
        message: messageEn,
        translations: { message: { en: messageEn, bg: messageBg } },
        link: null,
      });

      return res.json({ error: reasonKey, flagged: true });
    }

    let titleTrans, contentTrans;
    try {
      [titleTrans, contentTrans] = await Promise.all([
        getDualTranslation(title),
        getDualTranslation(content),
      ]);
    } catch (err) {
      titleTrans = { en: title, bg: title };
      contentTrans = { en: content, bg: content };
    }

    const isApproved = !moderationError;

    const post = await Post.create({
      title: title,
      content: content,
      translations: { title: titleTrans, content: contentTrans },
      image: Array.isArray(image) ? image : [],
      authorId,
      category,
      tags: tagsArray,
      isApproved,
      isVisible: true,
      likes: [],
    });

    await logActivity(req, "POST_CREATE", {
      targetId: post._id.toString(),
      targetType: "post",
      description: `Created post "${title}"`,
    });

    if (!isApproved) {
      const messageEn =
        "Post upload successful, but pending admin review due to a technical check.";
      const messageBg =
        "Публикуването е успешно, но изчаква преглед от администратор поради техническа проверка.";

      await Notification.create({
        userId: authorId,
        type: NotificationType.SYSTEM,
        message: messageEn,
        translations: { message: { en: messageEn, bg: messageBg } },
        link: isApproved ? `/posts/${post._id}` : null,
      });
    }

    if (isApproved) {
      const messageEn = "Your post has been published successfully!";
      const messageBg = "Публикацията ви беше публикувана успешно!";

      await Notification.create({
        userId: authorId,
        type: NotificationType.SUCCESS,
        message: messageEn,
        translations: { message: { en: messageEn, bg: messageBg } },
        link: isApproved ? `/posts/${post._id}` : null,
      });
    }

    return res.status(isApproved ? 201 : 202).json({
      messageKey: isApproved
        ? "postPublishedSuccess"
        : "postPendingAdminReview",
      post,
    });
  } catch (err: any) {
    logger.error(err, "Create Post Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates an existing post.
 * Allows authors or admins to update fields. Includes AI re-moderation for updated
 * text and automatic re-translation.
 *
 * @param req - AuthRequest with params { id } and body containing update fields
 * @param res - Express response object
 * @returns Response with updated post data
 * @throws {Error} Database error or 403 if unauthorized
 *
 * @example
 * ```json
 * Request body:
 * { "title": "Updated Title", "tags": ["id2"] }
 * ```
 * @response
 * ```json
 * { "_id": "...", "title": "Updated Title", ... }
 * ```
 */
export const updatePost = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { title, content, tags, image, category } = req.body;
    const userId = req.user!.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      post.authorId.toString() !== userId &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let isApproved = post.isApproved;
    const contentChanged =
      title !== post.title ||
      content !== post.content ||
      JSON.stringify(image) !== JSON.stringify(post.image);

    if (contentChanged) {
      try {
        const moderationResult = await moderateContent(
          title || post.title,
          content || post.content,
          image || post.image,
        );
        if (moderationResult?.flagged) {
          let reasonKey =
            moderationResult.isCookingRelated === false
              ? "postNotCooking"
              : "postInappropriate";
          const messageEn = `Post edit rejected. Reason: ${moderationResult.reason || "Inappropriate content."}`;
          const messageBg =
            moderationResult.isCookingRelated === false
              ? "Редакцията е отхвърлена: не е свързана с готвене."
              : "Редакцията е отхвърлена: неуместно съдържание.";

          await Notification.create({
            userId: post.authorId,
            type: NotificationType.FAIL,
            message: messageEn,
            translations: { message: { en: messageEn, bg: messageBg } },
            link: null,
          });

          return res.status(200).json({ error: reasonKey, flagged: true });
        }
        isApproved = true;
      } catch (err) {
        isApproved = false;
      }
    }

    const updateData: any = {
      image: Array.isArray(image) ? image : post.image,
      category: category || post.category,
      isApproved,
      tags: Array.isArray(tags)
        ? tags.filter((tag: string) => Types.ObjectId.isValid(tag))
        : post.tags,
    };

    if (title || content) {
      const [newTitleTrans, newContentTrans] = await Promise.all([
        getDualTranslation(title || post.title),
        getDualTranslation(content || post.content),
      ]);
      updateData.title = title || post.title;
      updateData.content = content || post.content;
      updateData.translations = {
        title: newTitleTrans,
        content: newContentTrans,
      };
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("authorId", "username profileImage")
      .populate("category", "name")
      .populate("tags");

    await logActivity(req, "POST_UPDATE", {
      targetId: post.id.toString(),
      targetType: "post",
      description: `Updated post "${updatedPost?.title}"`,
    });

    const messageKey = isApproved
      ? "postUpdatedSuccess"
      : "postPendingAdminReview";
    const notifMessageEn = isApproved
      ? "Your post has been updated successfully!"
      : "Your edit is pending admin review.";
    const notifMessageBg = isApproved
      ? "Публикацията ви беше обновена успешно!"
      : "Редакцията ви изчаква преглед от администратор.";

    await Notification.create({
      userId: post.authorId,
      type: NotificationType.SUCCESS,
      message: notifMessageEn,
      translations: { message: { en: notifMessageEn, bg: notifMessageBg } },
      link: `/posts/${post._id}`,
    });

    return res.status(isApproved ? 200 : 202).json({
      messageKey,
      post: updatedPost,
    });
  } catch (err: any) {
    logger.error(err, "Update Post Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all visible posts.
 * Fetches non-flagged content, populates author info and aggregates comment counts.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @returns Response with array of post objects
 * @throws {Error} Database retrieval error
 *
 * @example
 * ```typescript
 * GET /api/posts
 * ```
 * @response
 * ```json
 * [ { "_id": "...", "title": "Pasta", "commentCount": 5 }, ... ]
 * ```
 */
export const getAllPosts = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const posts = await Post.find({ isVisible: true })
      .populate("authorId", "username profileImage")
      .populate("tags")
      .sort({ createdAt: -1 })
      .lean();

    const postIds = posts.map((post) => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(
      commentCounts.map((c) => [c._id.toString(), c.count]),
    );
    const postsWithCounts = posts.map((post) => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0,
    }));

    return res.json(postsWithCounts);
  } catch (err: any) {
    logger.error(err, "Get All Posts Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves a single post by ID.
 * Populates author and category details and calculates comment totals.
 *
 * @param req - Express request with params { id }
 * @param res - Express response object
 * @returns Response with detailed post object
 * @throws {Error} 404 if not found or database error
 *
 * @example
 * ```typescript
 * GET /api/posts/post_id_123
 * ```
 * @response
 * ```json
 * { "_id": "123", "title": "Pasta", "authorId": { "username": "chef" }, ... }
 * ```
 */
export const getPostById = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("authorId", "username profileImage")
      .populate("category", "name")
      .populate("tags");

    if (!post || !post.isVisible)
      return res.status(404).json({ message: "Post not found" });

    const commentCount = await Comment.countDocuments({
      postId: post._id,
      isVisible: { $ne: false },
    });
    return res.json({ ...post.toObject(), commentCount });
  } catch (err: any) {
    logger.error(err, "Get Post By ID Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a post.
 * Permanently removes the post record. Sends notifications to the author
 * and logs the action for audit.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} 403 if unauthorized or database failure
 *
 * @example
 * ```typescript
 * DELETE /api/posts/post_id_123
 * ```
 * @response
 * ```json
 * { "message": "Post deleted successfully" }
 * ```
 */
export const deletePost = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (
      post.authorId.toString() !== req.user!.userId &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const authorId = post.authorId;
    const postTitle = post.title;
    await Post.findByIdAndDelete(req.params.id);

    await logActivity(req, "POST_DELETE", {
      targetId: req.params.id.toString(),
      targetType: "post",
      description: `Deleted post: ${postTitle}`,
    });

    const messageEn =
      post.authorId.toString() === req.user!.userId
        ? "You deleted your post."
        : "Your post was removed by an administrator.";
    const messageBg =
      post.authorId.toString() === req.user!.userId
        ? "Вие изтрихте вашата публикация."
        : "Вашата публикация беше премахната от администратор.";

    await Notification.create({
      userId: authorId,
      type: NotificationType.DELETED,
      message: messageEn,
      translations: { message: { en: messageEn, bg: messageBg } },
      link: "/account",
    });

    return res.json({ message: "Post deleted successfully" });
  } catch (err: any) {
    logger.error(err, "Delete Post Error");
    return res.status(500).json({ message: err.message });
  }
};

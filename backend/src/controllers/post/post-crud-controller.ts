/**
 * @file post-crud-controller.ts
 * @description Manages core Post lifecycle operations (CRUD). 
 * Includes automated AI content moderation, multi-lingual translations (EN/BG), 
 * tag processing, and complex notification logic for approvals and deletions.
 */

import { Request, Response } from "express";
import { Types } from "mongoose";
import Post from "../../models/post-model";
import Comment from "../../models/comment-model";
import Tag from "../../models/tag-model";
import Notification from "../../models/notification-model";
import NotificationType from "../../enums/notification-type";
import RoleTypeValue from "../../enums/role-type";
import moderateContent from "../../utils/ai";
import { AuthRequest } from "../../interfaces/auth";
import { getDualTranslation } from "../../utils/translation";
import { logActivity } from "../../utils/activity-logger";
import logger from "../../utils/logger";
import { log } from "node:console";

/**
 * Creates a new post.
 * Processes title, content, images, categories, and tags. Includes AI moderation, 
 * dual-language translation, and creates appropriate notifications for the author.
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

    // Validate category is a valid ObjectId
    if (!category || !Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Invalid category provided." });
    }

    // Ensure tags is an array
    let tagsArray = Array.isArray(tags) ? tags : [];

    // Convert tag IDs to tag names
    if (tagsArray.length > 0) {
      const validTagIds = tagsArray.filter((tag) =>
        Types.ObjectId.isValid(tag),
      );
      if (validTagIds.length > 0) {
        const tagDocs = await Tag.find({ _id: { $in: validTagIds } }).lean();
        const idToNameMap = new Map(
          tagDocs.map((t: any) => [t._id.toString(), t.name]),
        );
        tagsArray = tagsArray.map((tag) =>
          Types.ObjectId.isValid(tag) && idToNameMap.has(tag)
            ? idToNameMap.get(tag)!
            : tag,
        );
      }
    }

    // AI Moderation for Text and Images
    let moderationResult: any = null;
    let moderationError = false;

    try {
      moderationResult = await moderateContent(title, content, image);
    } catch (moderationErr: any) {
      logger.error(moderationErr, "Moderation service error");
      moderationError = true;
      moderationResult = { flagged: false }; // Create the post but flag for admin review
    }

    if (moderationResult?.flagged) {
      // Determine specific error code based on moderation flags
      let reasonKey: string;
      let reasonDetail: string = moderationResult.reason || "";

      if (moderationResult.isCookingRelated === false) {
        reasonKey = "postNotCooking";
      } else if (moderationResult.isAppropriate === false) {
        reasonKey = "postInappropriate";
      } else {
        // Generic rejection (should not happen with current logic, but fallback)
        reasonKey = "postRejected";
      }

      // Send notification to user with "Post rejected. Reason:" prefix
      const prefixEn = "Post rejected. Reason: ";
      const prefixBg = "Публикацията е отхвърлена. Причина: ";
      const reasonEn = moderationResult.reason || "Content is inappropriate.";
      const reasonBg =
        moderationResult.isCookingRelated === false
          ? "Публикацията не е свързана с готвене."
          : moderationResult.isAppropriate === false
            ? "Съдържанието е неуместно."
            : "Съдържанието е неподходящо.";
      const messageEn = prefixEn + reasonEn;
      const messageBg = prefixBg + reasonBg;

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

      // Return 200 OK with rejection info - this is a moderation decision, not an error
      return res.json({
        error: reasonKey,
        reason: reasonDetail,
        flagged: true,
      });
    }

    // Translate title and content with fallback
    let titleTrans: { en: string; bg: string };
    let contentTrans: { en: string; bg: string };
    try {
      [titleTrans, contentTrans] = await Promise.all([
        getDualTranslation(title),
        getDualTranslation(content),
      ]);
    } catch (err) {
      titleTrans = { en: title, bg: title };
      contentTrans = { en: content, bg: content };
    }

    // Translate tags with fallback
    let tagsTranslations: { bg: string[]; en: string[] } = { bg: [], en: [] };
    if (tagsArray.length > 0) {
      try {
        const tagTranslationPromises = tagsArray.map((tag) =>
          getDualTranslation(tag),
        );
        const tagTranslations = await Promise.all(tagTranslationPromises);
        tagsTranslations.en = tagTranslations.map((t) => t.en);
        tagsTranslations.bg = tagTranslations.map((t) => t.bg);
      } catch (err) {
        // If translation fails, use original tags for both languages
        tagsTranslations.en = tagsArray;
        tagsTranslations.bg = tagsArray;
      }
    }

    const imagesArray = Array.isArray(image) ? image : [];

    // Determine approval status:
    // - flagged true (caught by AI) → rejected above (never reaches here)
    // - flagged false, no moderation error → auto-approved
    // - moderation error (quota, API down) → requires admin review (isApproved: false)
    const isApproved = !moderationError;

    // If moderation failed, optionally notify user that post needs review
    if (moderationError) {
      const messageEn =
        "Your post has been submitted and is pending admin review due to AI service limitations.";
      const messageBg =
        "Публикацията ви беше изпратена и чака одобрение от администратор поради ограничения в AI услугата.";

      try {
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
      } catch (notifErr) {
        logger.error(notifErr, "Failed to send moderation error notification:");
      }
    }

    const post = await Post.create({
      title: titleTrans.en,
      content: contentTrans.en,
      translations: {
        title: titleTrans,
        content: contentTrans,
        tags: tagsTranslations,
      },
      image: imagesArray,
      authorId,
      category,
      tags: tagsArray,
      isApproved: isApproved,
      isVisible: true,
      likes: [],
    });

    // Log post creation for audit
    await logActivity(req, "POST_CREATE", {
      targetId: post._id.toString(),
      targetType: "post",
      description: `Created post: ${post.title}`,
    });

    // Send success notification for successfully published posts (not pending review)
    if (isApproved) {
      try {
        await Notification.create({
          userId: authorId,
          type: NotificationType.REPORT_FEEDBACK,
          message: "Your post has been published successfully!",
          translations: {
            message: {
              en: "Your post has been published successfully!",
              bg: "Публикацията ви беше публикувана успешно!",
            },
          },
          link: `/posts/${post._id}`,
        });
      } catch (notifErr) {
        logger.error(notifErr, "Failed to send success notification:");
      }
    }

    // Send success message based on status
    if (moderationError) {
      // Post created but needs admin review
      return res.status(202).json({
        messageKey: "postPendingAdminReview",
        post,
      });
    } else {
      return res.status(201).json({
        messageKey: "postPublishedSuccess",
        post,
      });
    }
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
    const { title, content, ...otherUpdates } = req.body;
    const userId = req.user!.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      post.authorId.toString() !== userId &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (title || content) {
      const { flagged } = await moderateContent(
        title || post.title,
        content || post.content,
        otherUpdates.image || post.image,
      );
      if (flagged) {
        return res.status(400).json({
          error: "contentFlaggedDuringUpdate",
        });
      }
    }

    const updateData: any = { ...otherUpdates };

    // Convert tag IDs to tag names if tags are being updated
    if (updateData.tags && Array.isArray(updateData.tags)) {
      const tagIds = updateData.tags.filter((tag: string) =>
        Types.ObjectId.isValid(tag),
      );
      if (tagIds.length > 0) {
        const tagDocs = await Tag.find({ _id: { $in: tagIds } }).lean();
        const idToNameMap = new Map(
          tagDocs.map((t: any) => [t._id.toString(), t.name]),
        );
        updateData.tags = updateData.tags.map((tag: string) =>
          Types.ObjectId.isValid(tag) && idToNameMap.has(tag)
            ? idToNameMap.get(tag)!
            : tag,
        );
      }
    }

    if (title || content) {
      const [newTitleTrans, newContentTrans] = await Promise.all([
        title
          ? getDualTranslation(title)
          : Promise.resolve(
              post.translations?.title || { en: post.title, bg: post.title },
            ),
        content
          ? getDualTranslation(content)
          : Promise.resolve(
              post.translations?.content || {
                en: post.content,
                bg: post.content,
              },
            ),
      ]);

      updateData.title = newTitleTrans.en;
      updateData.content = newContentTrans.en;
      // Preserve existing tags translations if they exist
      updateData.translations = {
        title: newTitleTrans,
        content: newContentTrans,
      };
      if (post.translations?.tags) {
        updateData.translations.tags = post.translations.tags;
      }
    }

    // If tags are being updated, translate them and merge into translations
    if (updateData.tags && Array.isArray(updateData.tags)) {
      const tagsToTranslate = updateData.tags;
      let tagsTrans: { bg: string[]; en: string[] };
      try {
        const tagTranslations = await Promise.all(
          tagsToTranslate.map((tag: string) => getDualTranslation(tag)),
        );
        tagsTrans = {
          en: tagTranslations.map((t) => t.en),
          bg: tagTranslations.map((t) => t.bg),
        };
      } catch (err) {
        tagsTrans = { en: tagsToTranslate, bg: tagsToTranslate };
      }

      // Ensure updateData.translations exists
      if (!updateData.translations) {
        // Preserve existing title/content translations if not already being updated
        updateData.translations = {
          title: post.translations?.title || { en: post.title, bg: post.title },
          content: post.translations?.content || {
            en: post.content,
            bg: post.content,
          },
        };
      }
      // Set/override tags translations
      updateData.translations.tags = tagsTrans;
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return res.json(updatedPost);
  } catch (err: any) {
    logger.error(err, "Update Post Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all visible posts.
 * Fetches non-flagged content, populates author info, and aggregates comment counts.
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
      .sort({ createdAt: -1 })
      .lean();

    // Get comment counts for posts
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
      .populate("category", "name");
    if (!post || !post.isVisible)
      return res.status(404).json({ message: "Post not found" });

    // Get comment count
    const commentCount = await Comment.countDocuments({
      postId: post._id,
      isVisible: { $ne: false },
    });

    const postWithCount = {
      ...post.toObject(),
      commentCount,
    };

    return res.json(postWithCount);
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

    // Determine if this is self-deletion or admin deletion
    const isSelfDeletion = authorId.toString() === req.user!.userId;

    if (isSelfDeletion) {
      // Notify the user that they deleted their own post
      const messageEn = `You deleted your post.`;
      const messageBg = `Вие изтрихте вашата публикация.`;

      try {
        await Notification.create({
          userId: authorId,
          type: NotificationType.POST_DELETED,
          message: messageEn,
          translations: {
            message: {
              en: messageEn,
              bg: messageBg,
            },
          },
          link: "/account",
        });
      } catch (notifErr) {
        logger.error(notifErr, "Failed to send self-deletion notification:");
      }
    } else if (req.user!.role === RoleTypeValue.ADMIN) {
      // Admin deleted someone else's post: notify the author
      const messageEn = `Your post was removed by an administrator.`;
      const messageBg = `Вашата публикация беше премахната от администратор.`;

      try {
        await Notification.create({
          userId: authorId,
          type: NotificationType.POST_DELETED,
          message: messageEn,
          translations: {
            message: {
              en: messageEn,
              bg: messageBg,
            },
          },
          link: "/account",
        });
      } catch (notifErr) {
        logger.error(notifErr, "Failed to send admin-deletion notification:");
      }
    }

    // Log post deletion for audit
    await logActivity(req, "POST_DELETE", {
      targetId: req.params.id,
      targetType: "post",
      description: `Deleted post: ${postTitle}`,
    });

    return res.json({ message: "Post deleted successfully" });
  } catch (err: any) {
    logger.error(err, "Delete Post Error");
    return res.status(500).json({ message: err.message });
  }
};
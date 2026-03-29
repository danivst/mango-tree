import { Request, Response } from "express";
import { Types } from "mongoose";
import Post from "../models/post";
import Comment from "../models/comment";
import User from "../models/user";
import Tag from "../models/tag";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import RoleTypeValue from "../enums/role-type";
import moderateContent from "../utils/ai";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";

/**
 * Creates a new post with title, content, optional image, category, and tags.
 * Automatically translates title and content to both English and Bulgarian.
 * Moderates content via AI; if flagged as inappropriate, returns a flagged status (200 OK) with rejection reason.
 * If moderation service fails, the post is created but marked as pending admin approval.
 * Notifies the author upon successful publication or if pending review.
 *
 * @param req - AuthRequest with body { title, content, image?, category, tags? }
 * @param res - Response with created post or flagged status
 * @returns 201 with post on success, 200 with flagged:true if rejected, 400 for validation errors,
 *          500 on server error
 *
 * @example
 * ```json
 * {
 *   "title": "My Delicious Pasta",
 *   "content": "Here's how I make pasta...",
 *   "category": "category_id",
 *   "tags": ["italian", "easy"]
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
      const validTagIds = tagsArray.filter(tag => Types.ObjectId.isValid(tag));
      if (validTagIds.length > 0) {
        const tagDocs = await Tag.find({ _id: { $in: validTagIds } }).lean();
        const idToNameMap = new Map(tagDocs.map((t: any) => [t._id.toString(), t.name]));
        tagsArray = tagsArray.map(tag =>
          Types.ObjectId.isValid(tag) && idToNameMap.has(tag)
            ? idToNameMap.get(tag)!
            : tag
        );
      }
    }

    // AI Moderation for Text and Images
    let moderationResult: any = null;
    let moderationError = false;

    try {
      moderationResult = await moderateContent(title, content, image);
    } catch (moderationErr: any) {
      console.error("[createPost] Moderation service error:", moderationErr.message);
      moderationError = true;
      moderationResult = { flagged: false }; // We'll still create the post but flag for admin review
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
        const tagTranslationPromises = tagsArray.map(tag => getDualTranslation(tag));
        const tagTranslations = await Promise.all(tagTranslationPromises);
        tagsTranslations.en = tagTranslations.map(t => t.en);
        tagsTranslations.bg = tagTranslations.map(t => t.bg);
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
      const messageEn = "Your post has been submitted and is pending admin review due to AI service limitations.";
      const messageBg = "Публикацията ви беше изпратена и чака одобрение от администратор поради ограничения в AI услугата.";

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
        console.error("[createPost] Failed to send moderation error notification:", notifErr);
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
        console.error("[createPost] Failed to send success notification:", notifErr);
        // Don't fail the request if notification fails
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
    console.error("Create Post Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Toggles like/unlike on a post.
 * If liking, sends a notification to the post author.
 *
 * @param req - AuthRequest with params { id } (post ID)
 * @param res - Response with { message: "Liked" | "Unliked", totalLikes: number }
 * @returns 200 with like status and total likes, 404 if post not found
 */
export const toggleLikePost = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const hasLiked = post.likes.some((likeId: Types.ObjectId) =>
      likeId.equals(userIdObj),
    );

    if (hasLiked) {
      post.likes = post.likes.filter(
        (likeId: Types.ObjectId) => !likeId.equals(userIdObj),
      );
    } else {
      post.likes.push(userIdObj);
    }

    await post.save();

    if (!hasLiked && post.authorId.toString() !== userId) {
      const postTitleEn = post.translations?.title?.en || post.title;
      const postTitleBg = post.translations?.title?.bg || post.title;

      // Fallback: if JWT lacks username, fetch from DB
      let actorUsername = req.user?.username;
      if (!actorUsername) {
        const actor = await User.findById(userId).select("username");
        actorUsername = actor?.username || "Someone";
      }

      const messageEn = `${actorUsername} liked your post "${postTitleEn}"`;
      const messageBg = `${actorUsername} хареса вашата публикация "${postTitleBg}"`;

      await Notification.create({
        userId: post.authorId,
        type: NotificationType.LIKE,
        message: messageEn,
        translations: {
          message: {
            en: messageEn,
            bg: messageBg,
          },
        },
        link: `/posts/${post._id}`,
      });
    }

    return res.json({
      message: hasLiked ? "Unliked" : "Liked",
      totalLikes: post.likes.length,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates a post's title, content, image, category, and/or tags.
 * Only the post author or an admin can update.
 * Re-moderates new content via AI; if flagged, returns 400 with error.
 * Automatically re-translates updated fields.
 *
 * @param req - AuthRequest with params { id } and body containing any updatable fields
 * @param res - Response with updated post or error
 * @returns 200 with updated post, 400 if flagged, 403 if not authorized, 404 if post not found
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
      const tagIds = updateData.tags.filter((tag: string) => Types.ObjectId.isValid(tag));
      if (tagIds.length > 0) {
        const tagDocs = await Tag.find({ _id: { $in: tagIds } }).lean();
        const idToNameMap = new Map(tagDocs.map((t: any) => [t._id.toString(), t.name]));
        updateData.tags = updateData.tags.map((tag: string) =>
          Types.ObjectId.isValid(tag) && idToNameMap.has(tag)
            ? idToNameMap.get(tag)!
            : tag
        );
      }
    }

    if (title || content) {
      const [newTitleTrans, newContentTrans] = await Promise.all([
        title
          ? getDualTranslation(title)
          : Promise.resolve(post.translations?.title || { en: post.title, bg: post.title }),
        content
          ? getDualTranslation(content)
          : Promise.resolve(post.translations?.content || { en: post.content, bg: post.content }),
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
          tagsToTranslate.map((tag: string) => getDualTranslation(tag))
        );
        tagsTrans = {
          en: tagTranslations.map(t => t.en),
          bg: tagTranslations.map(t => t.bg),
        };
      } catch (err) {
        tagsTrans = { en: tagsToTranslate, bg: tagsToTranslate };
      }

      // Ensure updateData.translations exists
      if (!updateData.translations) {
        // Preserve existing title/content translations if not already being updated
        updateData.translations = {
          title: post.translations?.title || { en: post.title, bg: post.title },
          content: post.translations?.content || { en: post.content, bg: post.content },
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
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- FEED & GETTERS ---------- */
/**
 * Retrieves all visible posts, sorted by creation date (newest first).
 * Includes author details and comment counts.
 *
 * @param req - Express request
 * @param res - Response with array of posts with commentCount
 * @returns 200 with posts array, 500 on error
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
    const postIds = posts.map(post => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));
    const postsWithCounts = posts.map(post => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0
    }));

    return res.json(postsWithCounts);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves a single visible post by ID, with author and category populated.
 * Includes comment count.
 *
 * @param req - Express request with params { id }
 * @param res - Response with post object including commentCount
 * @returns 200 with post, 404 if not found or not visible
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
      isVisible: { $ne: false }
    });

    const postWithCount = {
      ...post.toObject(),
      commentCount
    };

    return res.json(postWithCount);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- TRANSLATE POST ---------- */
/**
 * Translates a post's title, content, and tags to the requested language.
 *
 * @param req - AuthRequest with params { id } and query { targetLang: 'en'|'bg' }
 * @param res - Response with { title, content, tags, sourceLang, targetLang }
 * @returns 200 with translations, 400 for invalid language, 404 if post not found
 */
export const translatePost = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { targetLang } = req.query;

    // Validate target language
    if (!targetLang || !['en', 'bg'].includes(targetLang as string)) {
      return res.status(400).json({ message: "Invalid target language. Use 'en' or 'bg'." });
    }

    const post = await Post.findById(id)
      .populate("authorId", "username profileImage")
      .populate("category", "name");
    if (!post || !post.isVisible) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Determine source text (original content)
    const titleToTranslate = post.title;
    const contentToTranslate = post.content;

    // Get translations for both languages
    const [titleTrans, contentTrans] = await Promise.all([
      getDualTranslation(titleToTranslate),
      getDualTranslation(contentToTranslate),
    ]);

    // Translate tags
    let translatedTags: string[] = [];
    if (post.tags && post.tags.length > 0) {
      const tagsTranslations = await Promise.all(
        post.tags.map(tag => getDualTranslation(tag))
      );
      const isBg = targetLang === 'bg';
      translatedTags = tagsTranslations.map(t => (isBg ? t.bg : t.en));
    }

    // Return the requested language
    const isBg = targetLang === 'bg';
    const translatedTitle = isBg ? titleTrans.bg : titleTrans.en;
    const translatedContent = isBg ? contentTrans.bg : contentTrans.en;

    return res.json({
      title: translatedTitle,
      content: translatedContent,
      tags: translatedTags,
      sourceLang: isBg ? 'en' : 'bg',
      targetLang: targetLang,
    });
  } catch (err: any) {
    console.error("Translation error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a post. Only the author or an admin can delete.
 * Sends a notification to the author (self-deletion) or to the post author (admin deletion).
 *
 * @param req - AuthRequest with params { id }
 * @param res - Response with success message
 * @returns 200 on success, 403 if not authorized, 404 if post not found
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
        console.error("[deletePost] Failed to send self-deletion notification:", notifErr);
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
        console.error("[deletePost] Failed to send admin-deletion notification:", notifErr);
      }
    }

    return res.json({ message: "Post deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves the home feed for the authenticated user.
 * Excludes the user's own posts and includes comment counts.
 * Supports pagination via query parameters `limit` and `skip`.
 *
 * @param req - AuthRequest with optional query { limit?, skip? }
 * @param res - Response with { posts: Post[], total: number, hasMore: boolean }
 * @returns 200 with paginated posts, 404 if user not found
 */
export const getHomeFeed = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allPosts = await Post.find({
      isVisible: true,
      authorId: { $ne: userIdObj },
    })
      .populate("authorId", "username profileImage")
      .sort({ createdAt: -1 })
      .lean();

    // Get comment counts for all posts
    const postIds = allPosts.map(post => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));

    // Add commentCount to each post
    const postsWithCounts = allPosts.map(post => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0
    }));

    const paginatedPosts = postsWithCounts.slice(skip, skip + limit);

    return res.json({
      posts: paginatedPosts,
      total: postsWithCounts.length,
      hasMore: skip + limit < postsWithCounts.length,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET POSTS BY AUTHOR ---------- */
/**
 * Retrieves all visible posts by a specific author, with author and category populated.
 * Includes comment counts.
 *
 * @param req - AuthRequest with params { authorId }
 * @param res - Response with array of posts
 * @returns 200 with posts array, 500 on error
 */
export const getPostsByAuthor = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { authorId } = req.params;

    const posts = await Post.find({ authorId, isVisible: true })
      .populate("category", "name translations")
      .populate("authorId", "username profileImage")
      .sort({ createdAt: -1 })
      .lean();

    // Get comment counts for posts
    const postIds = posts.map(post => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));
    const postsWithCounts = posts.map(post => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0
    }));

    return res.json(postsWithCounts);
  } catch (err: any) {
    console.error("Get Posts By Author Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- SEARCH POSTS ---------- */
/**
 * Searches posts by text using MongoDB full-text search with regex fallback.
 * Returns posts matching the query, with author and category populated.
 * Includes comment counts and pagination.
 *
 * @param req - AuthRequest with query { q, limit=50, skip=0 }
 * @param res - Response with { posts: Post[], total: number, hasMore: boolean }
 * @returns 200 with results, 400 if query missing, 500 on error
 */
export const searchPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { q, limit = 50, skip = 0 } = req.query;
    const query = (q as string)?.trim();


    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Prevent caching of search results
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // First, try $text search
    let posts = await Post.find(
      {
        $text: { $search: query },
        isVisible: true,
      },
      { score: { $meta: "textScore" } }
    )
      .populate("authorId", "username profileImage")
      .populate("category", "name translations")
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .skip(parseInt(skip as string) || 0)
      .limit(parseInt(limit as string) || 50)
      .lean();


    // If $text search returned nothing, try a fallback regex search (case insensitive)
    if (posts.length === 0) {
      const regexQuery = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ],
        isVisible: true
      };

      posts = await Post.find(regexQuery)
        .populate("authorId", "username profileImage")
        .populate("category", "name translations")
        .sort({ createdAt: -1 })
        .skip(parseInt(skip as string) || 0)
        .limit(parseInt(limit as string) || 50)
        .lean();

    }

    // Get total count for pagination
    const total = await Post.countDocuments({
      $text: { $search: query },
      isVisible: true,
    });

    // Get comment counts for posts
    const postIds = posts.map(post => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));
    const postsWithCounts = posts.map(post => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0
    }));


    return res.json({
      posts: postsWithCounts,
      total,
      hasMore: parseInt(skip as string) + parseInt(limit as string) < total,
    });
  } catch (err: any) {
    console.error("Search Posts Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET FOLLOWED POSTS ---------- */
/**
 * Retrieves posts from users that the authenticated user is following.
 * Excludes the user's own posts. Supports pagination.
 *
 * @param req - AuthRequest with optional query { limit?, skip? }
 * @param res - Response with { posts: Post[], total: number, hasMore: boolean }
 * @returns 200 with paginated posts, 401 if not authenticated, 404 if user not found
 */
export const getFollowedPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      console.error("getFollowedPosts: No userId in token");
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userIdObj = new Types.ObjectId(userId);
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    // Get user's following list
    const user = await User.findById(userId).select("following");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter and convert following IDs to valid ObjectIds
    const followingIds: Types.ObjectId[] = [];
    for (const id of user.following) {
      if (Types.ObjectId.isValid(id)) {
        try {
          followingIds.push(new Types.ObjectId(id));
        } catch (e) {
          // Skip invalid IDs
        }
      }
    }

    // If user follows nobody, return empty
    if (followingIds.length === 0) {
      return res.json({
        posts: [],
        total: 0,
        hasMore: false,
      });
    }

    // Find posts from followed users (exclude user's own posts)
    let posts;
    try {
      posts = await Post.find({
        authorId: { $in: followingIds, $ne: userIdObj },
        isVisible: true,
      })
        .populate("authorId", "username profileImage")
        .populate("category", "name translations")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1) // Fetch one extra to check if there are more
        .lean();
    } catch (queryErr) {
      console.error("getFollowedPosts: Error fetching posts:", queryErr);
      console.error("Query details:", { followingIds, userIdObj, skip, limit: limit + 1 });
      throw queryErr; // Re-throw to be caught by outer catch
    }

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;

    // Get total for accurate count (optional, could be expensive)
    let total;
    try {
      total = await Post.countDocuments({
        authorId: { $in: followingIds, $ne: userIdObj },
        isVisible: true,
      });
    } catch (countErr) {
      console.error("getFollowedPosts: Error counting posts:", countErr);
      total = paginatedPosts.length; // Fallback
    }

    // Get comment counts for posts
    const postIds = paginatedPosts.map(post => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));
    const postsWithCounts = paginatedPosts.map(post => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0
    }));

    return res.json({
      posts: postsWithCounts,
      total,
      hasMore,
    });
  } catch (err: any) {
    console.error("Get Followed Posts Error:", err);
    console.error("Error details:", err.stack);
    return res.status(500).json({ message: "Failed to fetch followed posts", error: err.message });
  }
};

/* ---------- GET SUGGESTED POSTS ---------- */
/**
 * Retrieves suggested posts for the user based on their activity.
 * Recommendations consider liked posts, commented posts, and followed categories/tags.
 * Excludes posts from followed users and already liked posts.
 *
 * @param req - AuthRequest with optional query { limit?, skip? }
 * @param res - Response with { posts: Post[], total: number, hasMore: boolean }
 * @returns 200 with paginated suggested posts, 401 if not authenticated, 404 if user not found
 */
export const getSuggestedPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      console.error("getSuggestedPosts: No userId in token");
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userIdObj = new Types.ObjectId(userId);
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    // Parallel fetch user data
    const [user, likedPosts, commentedPostIds] = await Promise.all([
      User.findById(userId).select("following"),
      Post.find({ likes: userIdObj, isVisible: true })
        .select("_id category tags")
        .lean(),
      Comment.find({ userId: userIdObj })
        .select("postId")
        .lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract data for scoring
    const followingIds = user.following.map((id) =>
      Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id
    );

    const likedPostIds = likedPosts.map((p) => p._id);
    const commentedPostIdsSet = new Set(
      commentedPostIds.map((c) => c.postId).filter(Boolean)
    );

    // Build category affinity map (categories user has liked)
    const categoryAffinity = new Set<string>();
    likedPosts
      .map((p) => p.category?.toString())
      .filter((id): id is string => id !== undefined && id !== null)
      .forEach((catId) => categoryAffinity.add(catId));

    // Build tag affinity map (tags from liked/interacted posts)
    const tagAffinity = new Set<string>();
    likedPosts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => tagAffinity.add(tag.toLowerCase()));
      }
    });

    // Build candidate pool: posts NOT from user, NOT from followed users (already in their own feed), isVisible
    const candidateQuery: any = {
      isVisible: true,
    };

    // Only add authorId filter if we have followingIds
    if (followingIds.length > 0) {
      candidateQuery.authorId = { $nin: followingIds };
    }
    candidateQuery.authorId = { ...(candidateQuery.authorId || {}), $ne: userIdObj };

    // Exclude posts user has already liked (optional, keeps feed fresh)
    if (likedPostIds.length > 0) {
      candidateQuery._id = { $nin: likedPostIds };
    }

    // Get total count of candidates for pagination
    const totalCandidates = await Post.countDocuments(candidateQuery);

    // Fetch candidate posts with pagination
    const candidates = await Post.find(candidateQuery)
      .populate("authorId", "username profileImage")
      .populate("category", "name translations")
      .sort({ createdAt: -1 }) // Start with recent as baseline
      .skip(skip)
      .limit(limit * 2) // Fetch more to allow scoring and sorting
      .lean();

    // Score each candidate post (simplified with defensive checks)
    const scoredCandidates: any[] = candidates.map((post: any) => {
      let score = 0;

      // Safely get category ID
      const categoryDoc = post.category as any;
      const postCategory = categoryDoc?._id?.toString() || categoryDoc?.toString();

      // Safely get tags
      const postTags = Array.isArray(post.tags) ? post.tags.map((t: string) => t.toLowerCase()) : [];

      // Date calculations
      const postDate = new Date(post.createdAt);
      const daysAgo = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
      const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;

      // Category affinity: +3 per matching category
      if (postCategory && categoryAffinity.has(postCategory)) {
        score += 3;
      }

      // Tag overlap: +2 per matching tag
      const matchingTags = postTags.filter((tag: string) => tagAffinity.has(tag)).length;
      score += matchingTags * 2;

      // Recency: +1 per day newer (max +30)
      const recencyBonus = Math.max(0, 30 - Math.floor(daysAgo));
      score += recencyBonus;

      // Popularity: +log(likes + 1)
      score += Math.log(likesCount + 1);

      // Randomness: -5 to +5
      score += (Math.random() * 10) - 5;

      return { ...post, score };
    });

    // Sort by score descending, then by date as tiebreaker
    scoredCandidates.sort((a, b) => {
      if (Math.abs(b.score - a.score) < 0.01) {
        // Close scores, use date
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return b.score - a.score;
    });

    // Take only the requested limit
    const scoredPosts = scoredCandidates.slice(0, limit);

    // Edge case: if we don't have enough posts, fall back to recent popular posts
    if (scoredPosts.length < limit && skip === 0) {
      const remainingNeeded = limit - scoredPosts.length;
      const fallbackQuery = {
        isVisible: true,
        authorId: { $ne: userIdObj },
        _id: { $nin: scoredPosts.map((p) => p._id) },
      };

      const fallbackPosts = await Post.find(fallbackQuery)
        .populate("authorId", "username profileImage")
        .populate("category", "name translations")
        .sort({ createdAt: -1, likes: -1 })
        .limit(remainingNeeded)
        .lean();

      // Add score property to fallback posts to keep consistent type
      const fallbackPostsWithScore = fallbackPosts.map((p: any) => ({ ...p, score: 0 }));
      scoredPosts.push(...fallbackPostsWithScore);
    }

    // Get comment counts for posts
    const allReturnedPosts = [...scoredPosts];
    const postIds = allReturnedPosts.map(post => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));
    const postsWithCounts = allReturnedPosts.map(post => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0
    }));

    return res.json({
      posts: postsWithCounts,
      total: Math.max(totalCandidates, scoredPosts.length),
      hasMore: skip + limit < totalCandidates,
    });
  } catch (err: any) {
    console.error("Get Suggested Posts Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

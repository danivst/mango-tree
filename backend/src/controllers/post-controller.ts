import { Request, Response } from "express";
import { Types } from "mongoose";

import Post, { IPost } from "../models/post";
import Comment from "../models/comment";
import User from "../models/user";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import RoleTypeValue from "../enums/role-type";
import moderateContent from "../utils/ai";
import { AuthRequest } from "../utils/auth";
import { getDualTranslation } from "../utils/translation";

/* ---------- CREATE POST ---------- */
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
    const tagsArray = Array.isArray(tags) ? tags : [];

    // AI Moderation for Text and Images
    let flagged: boolean | null = null;
    let moderationError = false;

    try {
      flagged = await moderateContent(title, content, image);
    } catch (moderationErr: any) {
      console.error("[createPost] Moderation service error:", moderationErr.message);
      moderationError = true;
      flagged = false; // We'll still create the post but flag for admin review
    }

    if (flagged) {
      const messageEn = "Your post was flagged as inappropriate. Please adjust the content.";
      const messageBg = "Публикацията ви беше маркирана като неподходяща. Моля, коригирайте съдържанието.";
      
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

      return res.status(400).json({
        message: "Your post was flagged as inappropriate.",
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

    const imagesArray = Array.isArray(image) ? image : [];

    // Determine approval status:
    // - flagged true (caught by AI) → rejected above (never reaches here)
    // - flagged false, no moderation error → auto-approved
    // - moderation error (quota, API down) → requires admin review (isApproved: false)
    const isApproved = !moderationError;

    // If moderation failed, optionally notify user that post needs review
    if (moderationError) {
      try {
        await Notification.create({
          userId: authorId,
          type: NotificationType.SYSTEM, // or a new type like MODERATION_PENDING
          message: "Your post has been submitted and is pending admin review due to service limitations.",
          translations: {
            message: {
              en: "Your post has been submitted and is pending admin review due to service limitations.",
              bg: "Публикацията ви беше изпратена и чака одобрение от администратор поради ограничения в услугата.",
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
      },
      image: imagesArray,
      authorId,
      category,
      tags: tagsArray,
      isApproved: isApproved,
      isVisible: true,
      likes: [],
    });

    // Send success message based on status
    if (moderationError) {
      // Post created but needs admin review
      return res.status(202).json({
        message: "Post created successfully but requires admin review due to moderation service limitations.",
        post,
      });
    } else {
      return res.status(201).json(post);
    }

    return res.status(201).json(post);
  } catch (err: any) {
    console.error("Create Post Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- TOGGLE LIKE POST ---------- */
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

/* ---------- UPDATE POST ---------- */
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
      const flagged = await moderateContent(
        title || post.title,
        content || post.content,
        otherUpdates.image || post.image,
      );
      if (flagged) return res.status(400).json({ message: "Content flagged" });
    }

    const updateData: any = { ...otherUpdates };

    if (title || content) {
      const [newTitleTrans, newContentTrans] = await Promise.all([
        title
          ? getDualTranslation(title)
          : Promise.resolve(post.translations.title),
        content
          ? getDualTranslation(content)
          : Promise.resolve(post.translations.content),
      ]);

      updateData.title = newTitleTrans.en;
      updateData.content = newContentTrans.en;
      updateData.translations = {
        title: newTitleTrans,
        content: newContentTrans,
      };
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

    // Return the requested language
    const isBg = targetLang === 'bg';
    const translatedTitle = isBg ? titleTrans.bg : titleTrans.en;
    const translatedContent = isBg ? contentTrans.bg : contentTrans.en;

    return res.json({
      title: translatedTitle,
      content: translatedContent,
      sourceLang: isBg ? 'en' : 'bg',
      targetLang: targetLang,
    });
  } catch (err: any) {
    console.error("Translation error:", err);
    return res.status(500).json({ message: err.message });
  }
};

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
    await Post.findByIdAndDelete(req.params.id);
    return res.json({ message: "Post deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

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
export const searchPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { q, limit = 50, skip = 0 } = req.query;
    const query = (q as string)?.trim();

    console.log(`[searchPosts] Query: "${query}", limit: ${limit}, skip: ${skip}, user: ${req.user?.userId}`);

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

    console.log(`[searchPosts] $text search found ${posts.length} posts`);

    // If $text search returned nothing, try a fallback regex search (case insensitive)
    if (posts.length === 0) {
      console.log('[searchPosts] $text search returned 0, trying regex fallback...');
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

      console.log(`[searchPosts] Regex fallback found ${posts.length} posts`);
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

    console.log(`[searchPosts] Total: ${total}, hasMore: ${parseInt(skip as string) + parseInt(limit as string) < total}`);

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

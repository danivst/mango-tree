/**
 * @file post-feed-controller.ts
 * @description Manages post discovery and feed generation. 
 * Handles personalized home feeds, followed user content, full-text search with regex fallback, 
 * and a weighted recommendation engine for suggested content.
 */

import { Response } from "express";
import { Types } from "mongoose";
import Post from "../../models/post-model";
import Comment from "../../models/comment-model";
import User from "../../models/user-model";
import { AuthRequest } from "../../interfaces/auth";
import logger from "../../utils/logger";

/**
 * Retrieves the home feed.
 * Excludes user's own posts and returns newest visible content with pagination.
 *
 * @param req - AuthRequest with optional query { limit, skip }
 * @param res - Express response object
 * @returns Response with paginated array of posts
 * @throws {Error} Database retrieval failure
 *
 * @example
 * ```typescript
 * GET /api/posts/feed/home?limit=10&skip=0
 * ```
 * @response
 * ```json
 * { "posts": [...], "total": 100, "hasMore": true }
 * ```
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
    const postIds = allPosts.map((post) => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(
      commentCounts.map((c) => [c._id.toString(), c.count]),
    );

    // Add commentCount to each post
    const postsWithCounts = allPosts.map((post) => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0,
    }));

    const paginatedPosts = postsWithCounts.slice(skip, skip + limit);

    return res.json({
      posts: paginatedPosts,
      total: postsWithCounts.length,
      hasMore: skip + limit < postsWithCounts.length,
    });
  } catch (err: any) {
    logger.error(err, "Get Home Feed Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves posts by a specific author.
 * Used for displaying user profile timelines.
 *
 * @param req - AuthRequest with params { authorId }
 * @param res - Express response object
 * @returns Response with array of posts by the author
 * @throws {Error} Database error
 *
 * @example
 * ```typescript
 * GET /api/posts/author/user_id_123
 * ```
 * @response
 * ```json
 * [ { "_id": "...", "title": "Cool Post" }, ... ]
 * ```
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
    logger.error(err, "Get Posts By Author Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Performs a text search on posts.
 * Utilizes MongoDB text indices for optimized search with a regex fallback for partial matches.
 *
 * @param req - AuthRequest with query { q, limit, skip }
 * @param res - Express response object
 * @returns Response with search results
 * @throws {Error} 400 if query missing or database error
 *
 * @example
 * ```typescript
 * GET /api/posts/search?q=Pasta
 * ```
 * @response
 * ```json
 * { "posts": [...], "total": 5 }
 * ```
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
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    // First, try $text search
    let posts = await Post.find(
      {
        $text: { $search: query },
        isVisible: true,
      },
      { score: { $meta: "textScore" } },
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
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ],
        isVisible: true,
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

    return res.json({
      posts: postsWithCounts,
      total,
      hasMore: parseInt(skip as string) + parseInt(limit as string) < total,
    });
  } catch (err: any) {
    logger.error(err, "Search Posts Error:");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves the followed feed.
 * Aggregate posts from users that the requester is following.
 *
 * @param req - AuthRequest with query { limit, skip }
 * @param res - Express response object
 * @returns Response with paginated followed feed
 * @throws {Error} Database error
 *
 * @example
 * ```typescript
 * GET /api/posts/feed/followed
 * ```
 * @response
 * ```json
 * { "posts": [...], "hasMore": false }
 * ```
 */
export const getFollowedPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      logger.error("No userId in token");
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
          logger.error(e, "Invalid following ID:");
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
      logger.error(queryErr, "Error fetching posts");
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
      logger.error(countErr, "Error counting posts:");
      total = paginatedPosts.length; // Fallback
    }

    // Get comment counts for posts
    const postIds = paginatedPosts.map((post) => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(
      commentCounts.map((c) => [c._id.toString(), c.count]),
    );
    const postsWithCounts = paginatedPosts.map((post) => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0,
    }));

    return res.json({
      posts: postsWithCounts,
      total,
      hasMore,
    });
  } catch (err: any) {
    logger.error(err, "Get Followed Posts Error");
    return res
      .status(500)
      .json({ message: "Failed to fetch followed posts", error: err.message });
  }
};

/**
 * Retrieves weighted content suggestions.
 * Algorithm considers liked categories, tag overlap, and global popularity.
 *
 * @param req - AuthRequest with query { limit, skip }
 * @param res - Express response object
 * @returns Response with personalized suggestions
 * @throws {Error} Database error
 *
 * @example
 * ```typescript
 * GET /api/posts/feed/suggested
 * ```
 * @response
 * ```json
 * { "posts": [...], "total": 20 }
 * ```
 */
export const getSuggestedPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      logger.error("No userId in token");
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
      Comment.find({ userId: userIdObj }).select("postId").lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract data for scoring
    const followingIds = user.following.map((id) =>
      Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id,
    );

    const likedPostIds = likedPosts.map((p) => p._id);
    const commentedPostIdsSet = new Set(
      commentedPostIds.map((c) => c.postId).filter(Boolean),
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
    candidateQuery.authorId = {
      ...(candidateQuery.authorId || {}),
      $ne: userIdObj,
    };

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
      const postCategory =
        categoryDoc?._id?.toString() || categoryDoc?.toString();

      // Safely get tags
      const postTags = Array.isArray(post.tags)
        ? post.tags.map((t: string) => t.toLowerCase())
        : [];

      // Date calculations
      const postDate = new Date(post.createdAt);
      const daysAgo = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
      const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;

      // Category affinity: +3 per matching category
      if (postCategory && categoryAffinity.has(postCategory)) {
        score += 3;
      }

      // Tag overlap: +2 per matching tag
      const matchingTags = postTags.filter((tag: string) =>
        tagAffinity.has(tag),
      ).length;
      score += matchingTags * 2;

      // Recency: +1 per day newer (max +30)
      const recencyBonus = Math.max(0, 30 - Math.floor(daysAgo));
      score += recencyBonus;

      // Popularity: +log(likes + 1)
      score += Math.log(likesCount + 1);

      // Randomness: -5 to +5
      score += Math.random() * 10 - 5;

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
      const fallbackPostsWithScore = fallbackPosts.map((p: any) => ({
        ...p,
        score: 0,
      }));
      scoredPosts.push(...fallbackPostsWithScore);
    }

    // Get comment counts for posts
    const allReturnedPosts = [...scoredPosts];
    const postIds = allReturnedPosts.map((post) => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(
      commentCounts.map((c) => [c._id.toString(), c.count]),
    );
    const postsWithCounts = allReturnedPosts.map((post) => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0,
    }));

    return res.json({
      posts: postsWithCounts,
      total: Math.max(totalCandidates, scoredPosts.length),
      hasMore: skip + limit < totalCandidates,
    });
  } catch (err: any) {
    logger.error(err, "Get Suggested Posts Error");
    return res.status(500).json({ message: err.message });
  }
};

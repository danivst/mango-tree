/**
 * @file post-feed-controller.ts
 * @description Manages post discovery and feed generation. 
 * Handles personalized home feeds, followed user content, full-text search with regex fallback 
 * and a weighted recommendation engine for suggested content.
 */

import { Response, Request } from "express";
import { Types } from "mongoose";
import Post from "../../models/post-model";
import Comment from "../../models/comment-model";
import User from "../../models/user-model";
import Tag from "../../models/tag-model";
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
      isApproved: true,
      authorId: { $ne: userIdObj },
    })
      .populate("authorId", "username profileImage")
      .populate("tags")
      .sort({ createdAt: -1 })
      .lean();

    const postIds = allPosts.map((post) => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(
      commentCounts.map((c) => [c._id.toString(), c.count]),
    );

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

    const posts = await Post.find({ authorId, isVisible: true, isApproved: true, })
      .populate("category", "name translations")
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

    const limitNum = Number(limit) || 50;
    const skipNum = Number(skip) || 0;

    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    // Find Tag IDs that match the search string in name or translations
    const matchingTags = await Tag.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { "translations.bg": { $regex: query, $options: "i" } },
        { "translations.en": { $regex: query, $options: "i" } }
      ]
    }).select("_id");
    const tagIds = matchingTags.map(t => t._id);

    // Separate $text search to avoid restricted $or usage and metadata conflicts
    const textMatchedPosts = await Post.find(
      { $text: { $search: query }, isVisible: true, isApproved: true },
      { _id: 1 }
    ).lean();
    const textMatchedIds = textMatchedPosts.map(p => p._id);

    // Combined query using $in for both text and tag matches, with visibility and approval filters
    const finalQuery = {
      $or: [
        { _id: { $in: textMatchedIds } },
        { tags: { $in: tagIds } }
      ],
      isVisible: true,
      isApproved: true,
    };

    let posts = await Post.find(finalQuery)
      .populate("authorId", "username profileImage")
      .populate("category", "name translations")
      .populate("tags")
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    // Fallback regex search if indexed results yielded nothing
    if (posts.length === 0) {
      const regexQuery = {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
        ],
        isVisible: true,
        isApproved: true,
      };

      posts = await Post.find(regexQuery)
        .populate("authorId", "username profileImage")
        .populate("category", "name translations")
        .populate("tags") 
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean();
    }

    const total = await Post.countDocuments(finalQuery);

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
      hasMore: skipNum + limitNum < total,
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
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    
    const userIdObj = new Types.ObjectId(userId);
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const user = await User.findById(userId).select("following");
    if (!user) return res.status(404).json({ message: "User not found" });

    const followingIds = user.following
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (followingIds.length === 0) {
      return res.json({ posts: [], total: 0, hasMore: false });
    }

    const posts = await Post.find({
      authorId: { $in: followingIds, $ne: userIdObj },
      isVisible: true,
      isApproved: true,
    })
      .populate("authorId", "username profileImage")
      .populate("category", "name translations")
      .populate("tags")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .lean();

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;

    const total = await Post.countDocuments({
      authorId: { $in: followingIds, $ne: userIdObj },
      isVisible: true,
      isApproved: true,
    });

    const postIds = paginatedPosts.map((post) => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));
    const postsWithCounts = paginatedPosts.map((post) => ({
      ...post,
      commentCount: countsMap.get(post._id.toString()) || 0,
    }));

    return res.json({ posts: postsWithCounts, total, hasMore });
  } catch (err: any) {
    logger.error(err, "Get Followed Posts Error");
    return res.status(500).json({ message: "Failed to fetch followed posts" });
  }
};

/**
 * Retrieves weighted content suggestions.
 * Algorithm considers liked categories, tag overlap and global popularity.
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
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    
    const userIdObj = new Types.ObjectId(userId);
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const [user, likedPosts] = await Promise.all([
      User.findById(userId).select("following"),
      Post.find({ likes: userIdObj, isVisible: true, isApproved: true, }).select("_id category tags").lean(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    const followingIds = user.following
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    const likedPostIds = likedPosts.map((p) => p._id);

    const categoryAffinity = new Set<string>();
    likedPosts.forEach(p => {
      if (p.category) categoryAffinity.add(p.category.toString());
    });

    // Build tag affinity map using Tag IDs
    const tagAffinity = new Set<string>();
    likedPosts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tagId: any) => tagAffinity.add(tagId.toString()));
      }
    });

    const candidateQuery: any = {
      isVisible: true,
      isApproved: true,
      authorId: { $nin: [...followingIds, userIdObj] },
      _id: { $nin: likedPostIds }
    };

    const totalCandidates = await Post.countDocuments(candidateQuery);

    const candidates = await Post.find(candidateQuery)
      .populate("authorId", "username profileImage")
      .populate("category", "name translations")
      .populate("tags") 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit * 2)
      .lean();

    const scoredCandidates = candidates.map((post: any) => {
      let score = 0;
      const postCategory = post.category?._id?.toString() || post.category?.toString();
      
      const postTagIds = Array.isArray(post.tags)
        ? post.tags.map((t: any) => t._id?.toString() || t.toString())
        : [];

      const postDate = new Date(post.createdAt);
      const daysAgo = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
      const likesCount = post.likes?.length || 0;

      if (postCategory && categoryAffinity.has(postCategory)) score += 3;

      // Tag overlap scoring based on IDs
      const matchingTags = postTagIds.filter((tagId: string) => tagAffinity.has(tagId)).length;
      score += matchingTags * 2;

      score += Math.max(0, 30 - Math.floor(daysAgo));
      score += Math.log(likesCount + 1);
      score += Math.random() * 10 - 5;

      return { ...post, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    const scoredPosts = scoredCandidates.slice(0, limit);

    const postIds = scoredPosts.map((post) => post._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isVisible: { $ne: false } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));
    const postsWithCounts = scoredPosts.map((post) => ({
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
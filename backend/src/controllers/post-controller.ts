import { Request, Response } from 'express';
import { Types } from 'mongoose';

import Post from '../models/post';
import Comment from '../models/comment';
import User from '../models/user';
import Notification from '../models/notification';
import NotificationType from '../enums/notification-type';
import RoleTypeValue, { RoleType } from '../enums/role-type';
import moderateText from '../utils/ai';
import { AuthRequest } from '../utils/auth';

/* ---------- CREATE POST ---------- */
export const createPost = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { title, content, image, category, tags } = req.body as {
      title: string;
      content: string;
      image?: string;
      category?: string;
      tags?: string[];
    };
    const authorId = req.user!.userId;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: 'Title and content are required.' });
    }

    const flagged = await moderateText(title, content);
    if (flagged) {
      await Notification.create({
        userId: authorId,
        type: NotificationType.REPORT_FEEDBACK,
        message:
          'Your post was flagged as inappropriate. Please adjust the content.',
        link: null,
      });

      return res.status(400).json({
        message:
          'Your post was flagged as inappropriate. A notification has been sent.',
      });
    }

    const post = await Post.create({
      title,
      content,
      image,
      authorId,
      category,
      tags,
      isApproved: true,
      isVisible: true,
      likes: [],
    });

    return res.status(201).json(post);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- TOGGLE LIKE POST ---------- */
export const toggleLikePost = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const hasLiked = post.likes.some((likeId: Types.ObjectId) =>
      likeId.equals(userIdObj)
    );

    if (hasLiked) {
      post.likes = post.likes.filter(
        (likeId: Types.ObjectId) => !likeId.equals(userIdObj)
      );
    } else {
      post.likes.push(userIdObj);
    }

    await post.save();

    if (!hasLiked && post.authorId.toString() !== userId) {
      await Notification.create({
        userId: post.authorId,
        type: NotificationType.LIKE,
        message: `${req.user!.username} liked your post "${post.title}"`,
        link: `/posts/${post._id}`,
      });
    }

    return res.json({
      message: hasLiked ? 'Unliked' : 'Liked',
      totalLikes: post.likes.length,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET ALL POSTS ---------- */
export const getAllPosts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const posts = await Post.find({ isVisible: true })
      .populate('authorId', 'username profileImage')
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET POST BY ID ---------- */
export const getPostById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate(
      'authorId',
      'username profileImage'
    );
    if (!post || !post.isVisible)
      return res.status(404).json({ message: 'Post not found' });

    return res.json(post);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE POST ---------- */
export const updatePost = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user!.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (
      post.authorId.toString() !== userId &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to edit this post' });
    }

    if (updates.title || updates.content) {
      const flagged = await moderateText(
        updates.title || '',
        updates.content || ''
      );
      if (flagged) {
        return res
          .status(400)
          .json({ message: 'Post flagged as inappropriate' });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updates, {
      new: true,
    });

    return res.json(updatedPost);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE POST ---------- */
export const deletePost = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (
      post.authorId.toString() !== userId &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);
    return res.json({ message: 'Post deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET HOME FEED (ALGORITHMIC) ---------- */
export const getHomeFeed = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    // Get user's following list
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followingIds = user.following.map(id => id.toString());

    // Get posts user has interacted with (liked or commented)
    const likedPosts = await Post.find({
      likes: userIdObj,
      isVisible: true
    }).select('_id');

    const commentedPosts = await Comment.find({ userId: userIdObj })
      .select('postId')
      .distinct('postId');

    const interactedPostIds = new Set<string>();
    likedPosts.forEach((post: any) => {
      interactedPostIds.add(post._id.toString());
    });
    commentedPosts.forEach((postId: Types.ObjectId) => {
      interactedPostIds.add(postId.toString());
    });

    // Get tags from posts user has liked (for suggestions)
    const likedPostsWithTags = await Post.find({
      likes: userIdObj,
      isVisible: true
    }).select('tags');

    const preferredTags = new Set<string>();
    likedPostsWithTags.forEach((post: any) => {
      post.tags.forEach((tag: string) => {
        preferredTags.add(tag);
      });
    });

    const preferredTagsArray = Array.from(preferredTags);

    // STEP 1: Get new posts from users the user follows (not interacted with)
    const followedUsersPosts = await Post.find({
      isVisible: true,
      authorId: { $in: user.following, $ne: userIdObj },
      _id: { $nin: Array.from(interactedPostIds).map(id => new Types.ObjectId(id)) }
    })
      .populate('authorId', 'username profileImage')
      .sort({ createdAt: -1 })
      .lean();

    // STEP 2: Get posts with tags matching liked posts (suggestions based on interests)
    // Exclude posts from followed users (already shown in step 1) and interacted posts
    let suggestedPosts: any[] = [];
    if (preferredTagsArray.length > 0) {
      const excludeIds = [
        ...Array.from(interactedPostIds).map(id => new Types.ObjectId(id)),
        ...followedUsersPosts.map((p: any) => new Types.ObjectId(p._id))
      ];
      
      suggestedPosts = await Post.find({
        isVisible: true,
        tags: { $in: preferredTagsArray },
        authorId: { $ne: userIdObj, $nin: user.following },
        _id: { $nin: excludeIds }
      })
        .populate('authorId', 'username profileImage')
        .sort({ createdAt: -1 })
        .lean();
    }

    // STEP 3: If no suggested posts, get other posts (any posts not interacted with)
    // Exclude posts from followed users (already shown in step 1)
    let otherPosts: any[] = [];
    if (suggestedPosts.length === 0) {
      const excludeIds = [
        ...Array.from(interactedPostIds).map(id => new Types.ObjectId(id)),
        ...followedUsersPosts.map((p: any) => new Types.ObjectId(p._id))
      ];
      
      otherPosts = await Post.find({
        isVisible: true,
        authorId: { $ne: userIdObj, $nin: user.following },
        _id: { $nin: excludeIds }
      })
        .populate('authorId', 'username profileImage')
        .sort({ createdAt: -1 })
        .lean();
    }

    // STEP 4: Combine all posts (followed users first, then suggestions, then others)
    let allPosts = [
      ...followedUsersPosts,
      ...suggestedPosts,
      ...otherPosts
    ];

    // STEP 5: If we still don't have enough posts, add posts they've already interacted with
    if (allPosts.length < limit + skip) {
      const interactedPosts = await Post.find({
        isVisible: true,
        _id: { $in: Array.from(interactedPostIds).map(id => new Types.ObjectId(id)) },
        authorId: { $ne: userIdObj }
      })
        .populate('authorId', 'username profileImage')
        .sort({ createdAt: -1 })
        .lean();

      allPosts = [...allPosts, ...interactedPosts];
    }

    // Apply pagination
    const paginatedPosts = allPosts.slice(skip, skip + limit);

    return res.json({
      posts: paginatedPosts,
      total: allPosts.length,
      hasMore: skip + limit < allPosts.length
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
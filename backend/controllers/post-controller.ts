import { Request, Response } from 'express';
import { Types } from 'mongoose';

import Post from '../models/post';
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
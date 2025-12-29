import { Request, Response } from 'express';
import { Types } from 'mongoose';

import Comment from '../models/comment';
import Post from '../models/post';
import Notification from '../models/notification';

import NotificationType from '../enums/notification-type';
import RoleTypeValue, { RoleType } from '../enums/role-type';

import moderateText from '../utils/ai';
import { AuthRequest } from '../utils/auth';

/* ---------- CREATE COMMENT ---------- */
export const createComment = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);
    const { postId, text } = req.body as { postId: string; text: string };

    const post = await Post.findById(postId);
    if (!post || !post.isVisible) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({ postId, userId: userIdObj, text });

    if (!post.authorId.equals(userIdObj)) {
      await Notification.create({
        userId: post.authorId,
        type: NotificationType.COMMENT,
        message: `${req.user!.username} commented on your post "${post.title}"`,
        link: `/posts/${post._id}#comment-${comment._id}`,
      });
    }

    return res.status(201).json(comment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- TOGGLE LIKE COMMENT ---------- */
export const toggleLikeComment = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const hasLiked = comment.likes.some(likeId => likeId.equals(userIdObj));

    if (hasLiked) {
      comment.likes = comment.likes.filter(likeId => !likeId.equals(userIdObj));
    } else {
      comment.likes.push(userIdObj);
    }

    await comment.save();

    if (!hasLiked && !comment.userId.equals(userIdObj)) {
      await Notification.create({
        userId: comment.userId,
        type: NotificationType.LIKE,
        message: `${req.user!.username} liked your comment`,
        link: `/posts/${comment.postId}#comment-${comment._id}`,
      });
    }

    return res.json({
      message: hasLiked ? 'Unliked' : 'Liked',
      totalLikes: comment.likes.length,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE COMMENT ---------- */
export const updateComment = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { text } = req.body as { text: string };
    const userId = new Types.ObjectId(req.user!.userId);

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!comment.userId.equals(userId)) {
      return res.status(403).json({ message: 'Not your comment' });
    }

    const flagged = await moderateText('Comment', text);
    if (flagged) {
      await Notification.create({
        userId,
        type: NotificationType.REPORT_FEEDBACK,
        message: 'Your comment update was flagged as inappropriate',
        link: `/posts/${comment.postId}#comment-${comment._id}`,
      });

      return res
        .status(400)
        .json({ message: 'Comment update flagged as inappropriate' });
    }

    comment.text = text;
    await comment.save();

    return res.json(comment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE COMMENT ---------- */
export const deleteComment = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = new Types.ObjectId(req.user!.userId);

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (
      !comment.userId.equals(userId) &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Comment.findByIdAndDelete(id);
    return res.json({ message: 'Comment deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET COMMENTS BY POST ---------- */
export const getCommentsByPost = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId })
      .populate('userId', 'username profileImage')
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
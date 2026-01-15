import { Response } from 'express';
import Post from '../models/post';
import Comment from '../models/comment';
import Notification from '../models/notification';
import User from '../models/user';
import NotificationType from '../enums/notification-type';
import RoleTypeValue from '../enums/role-type';
import { AuthRequest } from '../utils/auth';

/* ---------- GET FLAGGED CONTENT ---------- */
export const getFlaggedContent = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Get posts that are not approved
    const unapprovedPosts = await Post.find({ isApproved: false })
      .populate('authorId', 'username')
      .sort({ createdAt: -1 });

    // Get comments that might be flagged (we'll need to add isApproved to comments)
    // For now, we'll just return posts
    const flaggedContent = unapprovedPosts.map((post) => ({
      _id: post._id,
      type: 'post',
      content: {
        title: post.title,
        content: post.content,
        image: post.image,
      },
      authorId: post.authorId,
      createdAt: post.createdAt,
    }));

    return res.json(flaggedContent);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- APPROVE CONTENT ---------- */
export const approveContent = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { type, id } = req.params;

    if (type === 'post') {
      const post = await Post.findByIdAndUpdate(
        id,
        { isApproved: true, isVisible: true },
        { new: true }
      );
      if (!post) return res.status(404).json({ message: 'Post not found.' });
    } else if (type === 'comment') {
      // Comments don't have isApproved yet, but we can add it
      const comment = await Comment.findById(id);
      if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    }

    return res.json({ message: 'Content approved successfully.' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DISAPPROVE CONTENT ---------- */
export const disapproveContent = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { type, id } = req.params;
    const { reason } = req.body;

    if (type === 'post') {
      const post = await Post.findById(id).populate('authorId');
      if (!post) return res.status(404).json({ message: 'Post not found.' });

      const authorId = typeof post.authorId === 'object' && post.authorId && '_id' in post.authorId 
        ? (post.authorId as any)._id.toString() 
        : post.authorId.toString();

      await Post.findByIdAndDelete(id);
      
      await Notification.create({
        userId: authorId,
        type: NotificationType.REPORT_FEEDBACK,
        message: `Your post has been removed. Reason: ${reason}`,
        link: null,
      });
    } else if (type === 'comment') {
      const comment = await Comment.findById(id).populate('userId');
      if (!comment) return res.status(404).json({ message: 'Comment not found.' });

      const userId = typeof comment.userId === 'object' && comment.userId && '_id' in comment.userId 
        ? (comment.userId as any)._id.toString() 
        : comment.userId.toString();

      await Comment.findByIdAndDelete(id);
      
      await Notification.create({
        userId: userId,
        type: NotificationType.REPORT_FEEDBACK,
        message: `Your comment has been removed. Reason: ${reason}`,
        link: null,
      });
    }

    return res.json({ message: 'Content disapproved and removed.' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

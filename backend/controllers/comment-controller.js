import Comment from '../models/comment.js';
import Post from '../models/post.js';
import Notification from '../models/notification.js';
import NotificationType from '../enums/notification-type.js';
import moderateText from '../utils/ai.js';

export const createComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId, text } = req.body;

    const post = await Post.findById(postId);
    if (!post || !post.isVisible) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({ postId, userId, text });

    if (post.authorId.toString() !== userId) {
      await Notification.create({
        userId: post.authorId,
        type: NotificationType.COMMENT,
        message: `${req.user.username} commented on your post "${post.title}"`,
        link: `/posts/${post._id}#comment-${comment._id}`
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleLikeComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const hasLiked = comment.likes.includes(userId);
    hasLiked ? comment.likes.pull(userId) : comment.likes.push(userId);
    await comment.save();

    if (!hasLiked && comment.userId.toString() !== userId) {
      await Notification.create({
        userId: comment.userId,
        type: NotificationType.LIKE,
        message: `${req.user.username} liked your comment`,
        link: `/posts/${comment.postId}#comment-${comment._id}`
      });
    }

    res.json({ message: hasLiked ? 'Unliked' : 'Liked', totalLikes: comment.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== userId)
      return res.status(403).json({ message: 'Not your comment' });

    const flagged = await moderateText(text);
    if (flagged) {
      await Notification.create({
        userId,
        type: NotificationType.REPORT_FEEDBACK,
        message: 'Your comment update was flagged as inappropriate',
        link: `/posts/${comment.postId}#comment-${comment._id}`
      });
      return res.status(400).json({ message: 'Comment update flagged as inappropriate' });
    }

    comment.text = text;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== userId && req.user.role !== RoleType.ADMIN)
      return res.status(403).json({ message: 'Not authorized' });

    await Comment.findByIdAndDelete(id);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId })
      .populate('userId', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
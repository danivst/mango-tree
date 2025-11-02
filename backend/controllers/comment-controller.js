import Comment from '../models/comment.js';
import Post from '../models/post.js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import RoleType from '../enums/role-type.js';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const createComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId, text } = req.body;

    const post = await Post.findById(postId);
    if (!post || !post.isVisible) return res.status(404).json({ message: 'Post not found' });

    const moderation = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: text,
    });
    if (moderation.results[0].flagged)
      return res.status(400).json({ message: 'Comment flagged as inappropriate' });

    const comment = await Comment.create({ postId, userId, text });
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
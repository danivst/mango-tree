import Post from '../models/post.js';
import dotenv from 'dotenv';
import moderateText  from '../utils/ai.js';
import RoleType from '../enums/role-type.js';
dotenv.config();

export const createPost = async (req, res) => {
  try {
    const { title, content, image, category, tags } = req.body;
    const authorId = req.user.userId;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const flagged = await moderateText(title, content);
    if (flagged) {
      await Notification.create({
        userId: authorId,
        type: NotificationType.REPORT_FEEDBACK,
        message: 'Your post was flagged as inappropriate. Please adjust the content.',
        link: null
      });

      return res.status(400).json({
        message: 'Your post was flagged as inappropriate. A notification has been sent.',
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
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const hasLiked = post.likes.includes(userId);
    hasLiked ? post.likes.pull(userId) : post.likes.push(userId);

    await post.save();

    if (!hasLiked && post.authorId.toString() !== userId) {
      await Notification.create({
        userId: post.authorId,
        type: NotificationType.LIKE,
        message: `${req.user.username} liked your post "${post.title}"`,
        link: `/posts/${post._id}`
      });
    }

    res.json({
      message: hasLiked ? 'Unliked' : 'Liked',
      totalLikes: post.likes.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isVisible: true })
      .populate('authorId', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate('authorId', 'username profileImage');
    if (!post || !post.isVisible) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorId.toString() !== userId && req.user.role !== RoleType.ADMIN) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    if (updates.content || updates.title) {
      const moderation = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: `${updates.title || ''}\n${updates.content || ''}`,
      });
      if (moderation.results[0].flagged)
        return res.status(400).json({ message: 'Post flagged as inappropriate' });
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updates, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorId.toString() !== userId && req.user.role !== RoleType.ADMIN) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
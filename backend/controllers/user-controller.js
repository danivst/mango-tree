import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import RoleType from '../enums/role-type.js';
dotenv.config();

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });

    res.status(201).json({
      message: 'Registration successful!',
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.userId !== id && req.user.role !== RoleType.ADMIN)
      return res.status(403).json({ message: 'Not authorized' });

    const updates = req.body;
    delete updates.passwordHash;
    delete updates.role;

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const { targetId } = req.body;
    const userId = req.user.userId;

    if (userId === targetId) return res.status(400).json({ message: 'Cannot follow yourself' });

    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const isFollowing = user.following.includes(targetId);

    if (isFollowing) {
      user.following.pull(targetId);
      target.followers.pull(userId);

      await Notification.create({
        userId: targetId,
        type: NotificationType.UNFOLLOW,
        message: `${user.username} unfollowed you`,
        link: `/users/${userId}`
      });
    } else {
      user.following.push(targetId);
      target.followers.push(userId);

      await Notification.create({
        userId: targetId,
        type: NotificationType.FOLLOW,
        message: `${user.username} started following you`,
        link: `/users/${userId}`
      });
    }

    await user.save();
    await target.save();

    res.json({ message: isFollowing ? 'Unfollowed' : 'Followed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.userId !== id && req.user.role !== RoleType.ADMIN)
      return res.status(403).json({ message: 'Not authorized' });

    await User.findByIdAndDelete(id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import RoleType from '../enums/role-type.js';
dotenv.config();

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
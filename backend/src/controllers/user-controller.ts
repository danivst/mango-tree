import { Request, Response } from 'express';
import { Types } from 'mongoose';

import User from '../models/user';
import RoleTypeValue, { RoleType } from '../enums/role-type';
import Notification from '../models/notification';
import NotificationType from '../enums/notification-type';
import { AuthRequest } from '../utils/auth';

/* ---------- GET USER PROFILE ---------- */
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE PROFILE ---------- */
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (
      req.user!.userId !== id &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = { ...req.body } as Record<string, any>;
    delete updates.passwordHash;
    delete updates.role;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
    }).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- TOGGLE FOLLOW ---------- */
export const toggleFollow = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { targetId } = req.body as { targetId: string };
    const userId = req.user!.userId;

    if (userId === targetId) {
      return res
        .status(400)
        .json({ message: 'Cannot follow yourself' });
    }

    const user = await User.findById(userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userIdObj = new Types.ObjectId(userId);
    const targetIdObj = new Types.ObjectId(targetId);

    const isFollowing = user.following.some((id: Types.ObjectId) =>
      id.equals(targetIdObj)
    );

    if (isFollowing) {
      user.following = user.following.filter(
        (id: Types.ObjectId) => !id.equals(targetIdObj)
      );

      target.followers = target.followers.filter(
        (id: Types.ObjectId) => !id.equals(userIdObj)
      );
    } else {
      user.following.push(targetIdObj);
      target.followers.push(userIdObj);

      await Notification.create({
        userId: targetId,
        type: NotificationType.FOLLOW,
        message: `${user.username} started following you`,
        link: `/users/${userId}`,
      });
    }

    await user.save();
    await target.save();

    return res.json({
      message: isFollowing ? 'Unfollowed' : 'Followed',
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET CURRENT USER ---------- */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET ALL USERS (ADMIN ONLY) ---------- */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res
        .status(403)
        .json({ message: 'Access denied. Admins only.' });
    }

    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    // Exclude current user
    const filteredUsers = users.filter(u => u._id.toString() !== req.user!.userId);
    return res.json(filteredUsers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE USER ---------- */
export const deleteUser = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (
      req.user!.userId !== id &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If admin is deleting and reason is provided, send notification
    if (req.user!.role === RoleTypeValue.ADMIN && reason) {
      await Notification.create({
        userId: id,
        type: NotificationType.REPORT_FEEDBACK,
        message: `Your account has been permanently suspended due to this reason: ${reason}. If you think this was a mistake, immediately reach out to mangotree@support.com, with subject: ${user.username} termination and include a screenshot of this message.`,
        link: null,
      });
    }

    // Delete user's posts and comments
    const Post = (await import('../models/post')).default;
    const Comment = (await import('../models/comment')).default;
    
    await Post.deleteMany({ authorId: id });
    await Comment.deleteMany({ userId: id });

    await User.findByIdAndDelete(id);
    return res.json({ message: 'Account deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
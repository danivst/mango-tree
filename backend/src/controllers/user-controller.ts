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

    const users = await User.find().select('-passwordHash');
    return res.json(users);
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

    if (
      req.user!.userId !== id &&
      req.user!.role !== RoleTypeValue.ADMIN
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await User.findByIdAndDelete(id);
    return res.json({ message: 'Account deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
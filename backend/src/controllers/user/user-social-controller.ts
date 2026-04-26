/**
 * @file user-social-controller.ts
 * @description Manages social relationships between users, including follow/unfollow 
 * logic, follower/following retrieval with administrative overrides and 
 * manual removal of followers from a user's profile.
 */

import { Response } from "express";
import { Types } from "mongoose";
import User from "../../models/user-model";
import RoleTypeValue from "../../enums/role-type";
import Notification from "../../models/notification-model";
import NotificationType from "../../enums/notification-type";
import { AuthRequest } from "../../interfaces/auth";
import { logActivity } from "../../utils/activity-logger";
import logger from "../../utils/logger";

/**
 * Toggles a follow relationship.
 * Adds or removes users from reciprocal social lists. Sends a notification 
 * to the target user if followed.
 *
 * @param req - AuthRequest with body { targetId }
 * @param res - Express response object
 * @returns Response with follow status message
 * @throws {Error} 400 if self-follow or database error
 *
 * @example
 * ```typescript
 * POST /api/users/follow
 * { "targetId": "..." }
 * ```
 */
export const toggleFollow = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { targetId } = req.body as { targetId: string };
    const userId = req.user!.userId;

    if (userId === targetId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const user = await User.findById(userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (target.isBanned) {
      return res.status(400).json({ message: "Cannot follow this user" });
    }

    const userIdObj = new Types.ObjectId(userId);
    const targetIdObj = new Types.ObjectId(targetId);

    const isFollowing = user.following.some((id: Types.ObjectId) =>
      id.equals(targetIdObj),
    );

    if (isFollowing) {
      user.following = user.following.filter(
        (id: Types.ObjectId) => !id.equals(targetIdObj),
      );
      target.followers = target.followers.filter(
        (id: Types.ObjectId) => !id.equals(userIdObj),
      );
    } else {
      user.following.push(targetIdObj);
      target.followers.push(userIdObj);

      const followMessageEn = `${user.username} started following you`;
      const followMessageBg = `${user.username} започна да ви следва`;

      await Notification.create({
        userId: targetId,
        type: NotificationType.FOLLOW,
        message: followMessageEn,
        translations: {
          message: {
            en: followMessageEn,
            bg: followMessageBg,
          },
        },
        link: `/users/${userId}`,
      });
    }

    await user.save();
    await target.save();

    await logActivity(req, isFollowing ? "UNFOLLOW" : "FOLLOW", {
      targetId: targetId,
      targetType: "user",
      description: `${isFollowing ? "Unfollowed" : "Followed"} user ${targetId}`,
    });

    return res.json({ message: isFollowing ? "Unfollowed" : "Followed" });
  } catch (err: any) {
    logger.error(err, "Error toggling follow relationship");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves followers.
 * Returns users following the target ID. Restricted to self or admins.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with list of follower users
 */
export const getFollowers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.params.id as string;
    const requesterId = req.user!.userId;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userId !== requesterId && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const followers = await User.find({
      _id: { $in: targetUser.followers },
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    }).select("-passwordHash");

    return res.json(followers);
  } catch (err: any) {
    logger.error(err, "Error fetching followers");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves following list.
 * Returns users that the target ID is following. Restricted to self or admins.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with list of followed users
 */
export const getFollowing = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.params.id as string;
    const requesterId = req.user!.userId;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userId !== requesterId && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const following = await User.find({
      _id: { $in: targetUser.following },
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    }).select("-passwordHash");

    return res.json(following);
  } catch (err: any) {
    logger.error(err, "Error fetching following");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Removes a follower.
 * Allows a profile owner to force an unfollow from another user.
 *
 * @param req - AuthRequest with params { followerId }
 * @param res - Express response object
 * @returns Response with success message
 */
export const removeFollower = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { followerId } = req.params;
    const userId = req.user!.userId;

    const currentUser = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!currentUser) {
      return res.status(404).json({ message: "Authenticated user not found" });
    }
    if (!follower) {
      return res.status(404).json({ message: "Follower not found" });
    }

    const isFollowing = currentUser.followers.some(
      (id) => id.toString() === followerId,
    );
    if (!isFollowing) {
      return res
        .status(400)
        .json({ message: "This user is not following you" });
    }

    follower.following = follower.following.filter(
      (id) => id.toString() !== userId,
    );
    await follower.save();

    currentUser.followers = currentUser.followers.filter(
      (id) => id.toString() !== followerId,
    );
    await currentUser.save();

    return res.json({ message: "Follower removed successfully" });
  } catch (err: any) {
    logger.error(err, "Error removing follower");
    return res.status(500).json({ message: err.message });
  }
};

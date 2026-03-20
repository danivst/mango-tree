import { Request, Response } from "express";
import { Types } from "mongoose";

import User from "../models/user";
import RoleTypeValue from "../enums/role-type";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import { AuthRequest } from "../utils/auth";
import { getDualTranslation } from "../utils/translation"; // Standardized import
import { sendEmail } from "../utils/email";

// Helper to get translation based on user language
const getLocalizedText = (userLang: string, translations: { bg: string; en: string }): string => {
  return userLang === 'bg' ? translations.bg : translations.en;
};

/* ---------- CHECK USERNAME UNIQUENESS ---------- */
export const checkUsername = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Username is required" });
    }

    const exists = await User.exists({ username });
    return res.json({ exists: !!exists });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET USER PROFILE ---------- */
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user is banned: only self, admin, or non-banned users can view
    const isSelf = req.user!.userId === id;
    const isAdmin = req.user!.role === RoleTypeValue.ADMIN;
    if (!isSelf && !isAdmin && user.isBanned) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE PROFILE ---------- */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Support both /users/:id and /users/me
    const paramId = req.params.id;
    const userId = paramId || req.user!.userId; // If no ID param, use logged-in user

    const { bio, username, profileImage, theme, language } = req.body;

    // Authorization: user can update their own profile, or admin can update any
    if (req.user!.userId !== userId && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 1. Check Username uniqueness if being changed
    if (username) {
      const exists = await User.findOne({ username, _id: { $ne: userId } });
      if (exists) {
        return res.status(400).json({ message: "Username already taken." });
      }
    }

    const updates: any = {};
    if (username) updates.username = username;
    if (profileImage) updates.profileImage = profileImage;

    if (bio) {
      const bioTranslations = await getDualTranslation(bio);
      updates.bio = bio;
      updates.translations = { bio: bioTranslations };
    }

    // Update theme if provided
    if (theme) {
      const validThemes = ["dark", "purple", "cream", "light", "mango"];
      if (!validThemes.includes(theme)) {
        return res.status(400).json({ message: "Invalid theme" });
      }
      updates.theme = theme;
    }

    // Update language if provided
    if (language) {
      const validLanguages = ["en", "bg"];
      if (!validLanguages.includes(language)) {
        return res.status(400).json({ message: "Invalid language" });
      }
      updates.language = language;
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- TOGGLE FOLLOW ---------- */
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

    // Prevent following banned users
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

    return res.json({ message: isFollowing ? "Unfollowed" : "Followed" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET CURRENT USER ---------- */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const user = await User.findById(req.user!.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE NOTIFICATION PREFERENCES ---------- */
export const updateNotificationPreferences = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { notificationPreferences } = req.body;

    if (!notificationPreferences) {
      return res.status(400).json({ message: "Notification preferences are required." });
    }

    // Basic validation for the structure of notificationPreferences
    const validPreferences = {
      emailReports: typeof notificationPreferences.emailReports === 'boolean' ? notificationPreferences.emailReports : true,
      emailComments: typeof notificationPreferences.emailComments === 'boolean' ? notificationPreferences.emailComments : true,
      inAppReports: typeof notificationPreferences.inAppReports === 'boolean' ? notificationPreferences.inAppReports : true,
      inAppComments: typeof notificationPreferences.inAppComments === 'boolean' ? notificationPreferences.inAppComments : true,
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: validPreferences },
      { new: true, runValidators: true },
    ).select("-passwordHash"); // Exclude password hash from response

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ message: "Notification preferences updated successfully.", user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE EMAIL ---------- */
export const updateEmail = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Check if email already exists for another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { email },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ message: "Email updated successfully.", user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET ALL USERS (All authenticated users) ---------- */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Return all non-banned users with role 'user' (exclude admins and banned)
    // Also exclude the current user
    const users = await User.find({
      role: RoleTypeValue.USER,
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    const filteredUsers = users.filter(
      (u) => (u._id as any).toString() !== req.user!.userId,
    );
    return res.json(filteredUsers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET ALL ADMINS (Admin Only) ---------- */
export const getAllAdmins = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Check if user is admin
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Return all admin users
    const admins = await User.find({
      role: RoleTypeValue.ADMIN,
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.json(admins);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET REGULAR USERS (FOR USER SEARCH) ---------- */
export const getRegularUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    // Only return non-banned users with role "user" (exclude admins and banned)
    const users = await User.find({
      role: RoleTypeValue.USER,
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    // Exclude the current user from the results
    const filteredUsers = users.filter(
      (u) => (u._id as any).toString() !== req.user!.userId,
    );
    return res.json(filteredUsers);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE USER ---------- */
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (req.user!.userId !== id && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If admin is deleting and provided a reason, send notification with reason
    if (req.user!.role === RoleTypeValue.ADMIN && reason) {
      const translatedReason = await getDualTranslation(reason);

      const suspendMessageEn = `Your account has been permanently suspended due to this reason: ${translatedReason.en}. If you think this was a mistake, immediately reach out to mangotree@support.com, with subject: ${user.username} termination and include a screenshot of this message.`;
      const suspendMessageBg = `Вашият акаунт беше спрян за постоянно поради следната причина: ${translatedReason.bg}. Ако смятате, че това е грешка, незабавно се свържете с mangotree@support.com с тема: ${user.username} termination и прикачете екранна снимка на това съобщение.`;

      await Notification.create({
        userId: id,
        type: NotificationType.REPORT_FEEDBACK,
        message: suspendMessageEn,
        translations: {
          message: {
            en: suspendMessageEn,
            bg: suspendMessageBg,
          },
        },
        link: null,
      });
    }

    // Determine if this is a self-deletion or admin deletion
    const isSelfDeletion = req.user!.userId === id;
    const userLang = user.language || 'en';

    let titleKey: string;
    let bodyKey: string;

    if (isSelfDeletion) {
      // User deleted their own account
      titleKey = "Account Deleted";
      bodyKey = "Your account has been permanently deleted from MangoTree. You requested this deletion, and your data has been removed. We're sorry to see you go.";
    } else {
      // Admin deleted the user's account
      titleKey = "Account Deleted by Administrator";
      bodyKey = "Your account has been permanently deleted from MangoTree by an administrator. This action was taken due to a violation of our terms of service or community guidelines.";
    }

    const [titleTrans, bodyTrans, signatureTrans] = await Promise.all([
      getDualTranslation(titleKey),
      getDualTranslation(bodyKey),
      getDualTranslation("Sincerely, the MangoTree team"),
    ]);

    const title = getLocalizedText(userLang, titleTrans);
    const body = getLocalizedText(userLang, bodyTrans);
    const signature = getLocalizedText(userLang, signatureTrans);

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${body}</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${signature}</p>
      </div>
    `;

    try {
      await sendEmail(user.email, title, emailHtml);
    } catch (emailError) {
      console.error("Failed to send deletion email:", emailError);
      // Continue with deletion even if email fails
    }

    const Post = (await import("../models/post")).default;
    const Comment = (await import("../models/comment")).default;

    await Post.deleteMany({ authorId: id });
    await Comment.deleteMany({ userId: id });

    await User.findByIdAndDelete(id);
    // Clean up follow relationships BEFORE deleting the user
    // 1. Remove this user from others' followers lists (who this user follows)
    // 2. Remove this user from others' following lists (who follows this user)
    try {
      const userToDelete = await User.findById(id);
      if (userToDelete) {
        const userIdObj = new Types.ObjectId(id);

        // For each user that the deleted user follows, remove the deleted user from their followers
        if (userToDelete.following && userToDelete.following.length > 0) {
          await Promise.all(
            userToDelete.following.map((followedId: Types.ObjectId) =>
              User.findByIdAndUpdate(followedId, {
                $pull: { followers: userIdObj }
              })
            )
          );
        }

        // For each user that follows the deleted user, remove the deleted user from their following
        if (userToDelete.followers && userToDelete.followers.length > 0) {
          await Promise.all(
            userToDelete.followers.map((followerId: Types.ObjectId) =>
              User.findByIdAndUpdate(followerId, {
                $pull: { following: userIdObj }
              })
            )
          );
        }
      }
    } catch (cleanupErr) {
      console.error("Error cleaning up follow relationships:", cleanupErr);
      // Continue with deletion even if cleanup fails
    }

    await User.findByIdAndDelete(id);
    return res.json({ message: "Account deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET FOLLOWERS ---------- */
export const getFollowers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.params.id as string;
    const requesterId = req.user!.userId;

    // Ensure the user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow fetching followers of:
    // - yourself
    // - another user if you are an admin
    if (userId !== requesterId && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Populate followers' user details (exclude banned users)
    const followers = await User.find({
      _id: { $in: targetUser.followers },
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    }).select("-passwordHash");

    return res.json(followers);
  } catch (err: any) {
    console.error("Get Followers Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET FOLLOWING ---------- */
export const getFollowing = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.params.id as string;
    const requesterId = req.user!.userId;

    // Ensure the user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow fetching following of:
    // - yourself
    // - another user if you are an admin
    if (userId !== requesterId && req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Populate following users' details (exclude banned users)
    const following = await User.find({
      _id: { $in: targetUser.following },
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
    }).select("-passwordHash");

    return res.json(following);
  } catch (err: any) {
    console.error("Get Following Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- REMOVE FOLLOWER ---------- */
export const removeFollower = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { followerId } = req.params;
    const userId = req.user!.userId;

    // The current user (profile owner) and the follower to remove
    const currentUser = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!currentUser) {
      return res.status(404).json({ message: "Authenticated user not found" });
    }
    if (!follower) {
      return res.status(404).json({ message: "Follower not found" });
    }

    // Check if the follower is indeed following the current user
    const isFollowing = currentUser.followers.some(
      (id) => id.toString() === followerId
    );
    if (!isFollowing) {
      return res
        .status(400)
        .json({ message: "This user is not following you" });
    }

    // Remove currentUser from follower's following list
    follower.following = follower.following.filter(
      (id) => id.toString() !== userId
    );
    await follower.save();

    // Remove follower from currentUser's followers list
    currentUser.followers = currentUser.followers.filter(
      (id) => id.toString() !== followerId
    );
    await currentUser.save();

    return res.json({ message: "Follower removed successfully" });
  } catch (err: any) {
    console.error("Remove Follower Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

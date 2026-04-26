/**
 * @file interfaces.ts
 * @description Shared interfaces used across frontend and backend.
 */

import {
  RoleType,
  ThemeType,
  LanguageType,
  NotificationType,
  ReportTargetType,
  ReportStatusType,
  Translation,
  NotificationPreferences,
  CategoryTranslations,
  TagTranslations,
} from "./types";

/**
 * @interface IUser
 * @description Shared user document shape.
 */
export interface IUser {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: RoleType;
  resetToken?: string;
  resetTokenExpiry?: Date;
  profileImage?: string;
  bio?: string;
  isApproved?: boolean;
  isBanned?: boolean;
  translations: {
    bio: {
      bg: string;
      en: string;
    };
  };
  theme?: ThemeType;
  language?: LanguageType;
  twoFactorEnabled?: boolean;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;
  createdAt: Date;
  followers: string[];
  following: string[];
  pastUsernames: {
    username: string;
    changedAt: Date;
  }[];
}

/**
 * @interface User
 * @description Public-facing user data returned by most API endpoints.
 */
export interface User {
  _id: string;
  username: string;
  email: string;
  role: RoleType;
  createdAt: string;
  profileImage?: string;
  bio?: string;
  translations?: {
    bio: {
      bg: string;
      en: string;
    };
  };
  isApproved?: boolean;
  isBanned?: boolean;
  banned_user_id?: string;
}

/**
 * @interface UserProfile
 * @description Authenticated user profile data with preferences and social connections.
 */
export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: RoleType;
  createdAt: string;
  profileImage?: string;
  bio?: string;
  translations?: {
    bio: {
      bg: string;
      en: string;
    };
  };
  followers: string[];
  following: string[];
  theme?: ThemeType;
  language?: LanguageType;
  notificationPreferences?: NotificationPreferences;
  pastUsernames?: {
    username: string;
    changedAt: string;
  }[];
}

/**
 * @interface INotification
 * @description Shared notification document shape.
 */
export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  message: string;
  translations: {
    message: {
      bg: string;
      en: string;
    };
  };
  link?: string | null;
  read: boolean;
  createdAt: Date;
}

/**
 * @interface Notification
 * @description In-app notification data returned to the client.
 */
export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  message: string;
  translations: {
    message: Translation;
  };
  link?: string | null;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * @interface IPost
 * @description Shared post document shape.
 */
export interface IPost {
  _id: string;
  title: string;
  content: string;
  translations: {
    title: {
      bg: string;
      en: string;
    };
    content: {
      bg: string;
      en: string;
    };
  };
  image: string[];
  authorId: string;
  category: string;
  tags: string[];
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
  isApproved: boolean;
  isVisible: boolean;
}

/**
 * @interface Post
 * @description Post data returned to clients.
 */
export interface Post {
  _id: string;
  title: string;
  content: string;
  translations: {
    title: {
      bg: string;
      en: string;
    };
    content: {
      bg: string;
      en: string;
    };
    tags?: {
      bg: string[];
      en: string[];
    };
  };
  image: string[];
  authorId: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  category: {
    _id: string;
    name: string;
    translations?: {
      name?: {
        bg?: string;
        en?: string;
      };
    };
  };
  tags: string[];
  likes: string[];
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isApproved?: boolean;
  isVisible?: boolean;
}

/**
 * @interface Comment
 * @description Comment data with optional nested replies.
 */
export interface Comment {
  _id: string;
  postId: string;
  userId: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  text: string;
  translations: {
    bg: string;
    en: string;
  };
  createdAt: string;
  updatedAt: string;
  likes: string[];
  isLiked?: boolean;
  parentCommentId?: string;
  replies?: Comment[];
}

/**
 * @interface Category
 * @description Content category data.
 */
export interface Category {
  _id: string;
  name: string;
  translations?: CategoryTranslations;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * @interface Tag
 * @description Tag data that can be associated with posts.
 */
export interface Tag {
  _id: string;
  name: string;
  translations?: TagTranslations;
  type?: "meal_time" | "cuisine" | "difficulty" | "meal_type";
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
/**
 * @interface Report
 * @description Content report submitted by a user.
 */
export interface Report {
  _id: string;
  reportedBy: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  translations?: {
    reason: Translation;
  };
  status: ReportStatusType;
  createdAt: string;
}

/**
 * @interface BannedUser
 * @description Banned user record preserved for moderation history.
 */
export interface BannedUser {
  _id: string;
  email: string;
  username: string;
  originalUserId: string;
  banReason: string;
  bannedAt: string;
}

/**
 * @interface FlaggedContent
 * @description Content flagged for admin review.
 */
export interface FlaggedContent {
  _id: string;
  type: "post" | "comment" | "image";
  content: any;
  authorId: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

/**
/**
 * @interface JwtPayload
 * @description JWT payload data.
 */
export interface JwtPayload {
  userId: string;
  username?: string;
  role: RoleType;
}

/**
 * @interface LoginResponse
 * @description Response returned after successful login or registration.
 */
export interface LoginResponse {
  message?: string;
  token?: string;
  refreshToken?: string;
  user: {
    id: string;
    username: string;
    role: RoleType;
    bio?: string;
    translations?: any;
  };
  redirectTo?: string;
  twoFactorRequired?: boolean;
  userId?: string;
}

/**
 * @interface ErrorResponse
 * @description Generic API error response.
 */
export interface ErrorResponse {
  message: string;
}

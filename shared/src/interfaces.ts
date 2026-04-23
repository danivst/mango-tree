/**
 * @file interfaces.ts
 * @description Shared interfaces used across frontend and backend.
 * These interfaces are simplified for cross-platform compatibility.
 */

import { RoleType, ThemeType, LanguageType, NotificationType, ReportTargetType, ReportStatusType, Translation, NotificationPreferences, CategoryTranslations, TagTranslations } from './types';

// ============================================================================
// User Interfaces
// ============================================================================

/**
 * Backend Mongoose document interface for User model.
 * Note: This is simplified for shared usage - backend should extend with Mongoose.Document
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
 * Represents a user account in the MangoTree application.
 * This is the public-facing user data returned by most API endpoints.
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
 * Detailed profile information for the authenticated user.
 * Extends basic User with social connections and preferences.
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

// ============================================================================
// Notification Interfaces
// ============================================================================

/**
 * Backend Mongoose document interface for Notification model.
 * Note: This is simplified for shared usage - backend should extend with Mongoose.Document
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
 * An in-app notification sent to a user.
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

// ============================================================================
// Content Types (Post, Comment, Category, Tag)
// ============================================================================

/**
 * Backend Mongoose document interface for Post model.
 * Note: This is simplified for shared usage - backend should extend with Mongoose.Document
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
 * A user's post in the MangoTree application.
 * Includes content, media, categorization, and engagement metrics.
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
 * A comment on a post, with optional nested replies.
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
 * Content category for organizing posts.
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
 * Tag that can be associated with posts for categorization.
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

// ============================================================================
// Moderation & Reporting Types
// ============================================================================

/**
 * A content report submitted by a user.
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
 * Represents a user who has been banned from the platform.
 * Stored in separate collection to preserve historical records.
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
 * Content flagged for admin review (AI moderation queue).
 * Not a backend model; constructed for admin UI.
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

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Payload structure for JWT tokens.
 * Contains user identity and role information for authentication.
 */
export interface JwtPayload {
  userId: string;
  username?: string;
  role: RoleType;
}

/**
 * Response structure for successful login/registration.
 * With HttpOnly cookies, tokens are no longer returned in the response.
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
 * Generic error response from API.
 */
export interface ErrorResponse {
  message: string;
}
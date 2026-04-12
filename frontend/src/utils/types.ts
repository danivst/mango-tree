/**
 * @file types.ts
 * @description Centralized type definitions for frontend API contracts.
 * These interfaces define the shape of data exchanged between the frontend and backend.
 * They are adapted from the backend's Mongoose models to plain JavaScript objects suitable for the frontend.
 */

// ============================================================================
// Enums and Basic Types
// ============================================================================

/**
 * User roles for access control.
 * @typedef {'user' | 'admin'} RoleType
 */
export type RoleType = 'user' | 'admin';

/**
 * Types of notifications that can be sent to users.
 * @typedef {'like' | 'comment' | 'reply' | 'follow' | 'report_feedback' | 'post_deleted' | 'system'} NotificationType
 */
export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'report_feedback' | 'post_deleted' | 'system' | 'new_login';

/**
 * Content types that can be reported.
 * @typedef {'post' | 'comment' | 'user'} ReportTargetType
 */
export type ReportTargetType = 'post' | 'comment' | 'user';

/**
 * Status values for content reports.
 * @typedef {'pending' | 'reviewed' | 'rejected' | 'action_taken'} ReportStatusType
 */
export type ReportStatusType = 'pending' | 'reviewed' | 'rejected' | 'action_taken';

/**
 * Supported UI theme names.
 * @typedef {'dark' | 'purple' | 'cream' | 'light' | 'mango'} Theme
 */
export type Theme = typeof ThemeValues[number];
export const ThemeValues = ['dark', 'purple', 'cream', 'light', 'mango'];

/**
 * Supported language codes.
 * @typedef {'en' | 'bg'} Language
 */
export type Language = typeof LanguageValues[number];
export const LanguageValues = ['en', 'bg'];

// ============================================================================
// Translation Types
// ============================================================================

/**
 * Bilingual translation structure for dynamically stored text.
 * Stores both Bulgarian (bg) and English (en) versions of content.
 *
 * @interface Translation
 * @property {string} bg - Bulgarian translation
 * @property {string} en - English translation
 */
export interface Translation {
  bg: string;
  en: string;
}

/**
 * Translation structure for category names.
 *
 * @interface CategoryTranslations
 * @property {Translation} name - Translated category name
 */
export interface CategoryTranslations {
  name: Translation;
}

/**
 * Translation structure for tag names.
 *
 * @interface TagTranslations
 * @property {Translation} name - Translated tag name
 */
export interface TagTranslations {
  name: Translation;
}

/**
 * Translation structure for comment text.
 *
 * @interface CommentTranslations
 * @property {string} bg - Bulgarian translation
 * @property {string} en - English translation
 */
export interface CommentTranslations {
  bg: string;
  en: string;
}

/**
 * Translation structure for notification messages.
 *
 * @interface NotificationTranslations
 * @property {Translation} message - Translated notification message
 */
export interface NotificationTranslations {
  message: Translation;
}

/**
 * Translation structure for report reasons.
 *
 * @interface ReportTranslations
 * @property {Translation} reason - Translated report reason
 */
export interface ReportTranslations {
  reason: Translation;
}

// ============================================================================
// User & Profile Types
// ============================================================================

/**
 * User preferences for receiving notifications.
 *
 * @interface NotificationPreferences
 * @property {boolean} emailReports - Receive email notifications for reports
 * @property {boolean} emailComments - Receive email notifications for comments
 * @property {boolean} inAppReports - Receive in-app notifications for reports
 * @property {boolean} inAppComments - Receive in-app notifications for comments
 */
export interface NotificationPreferences {
  emailReports: boolean;
  emailComments: boolean;
  inAppReports: boolean;
  inAppComments: boolean;
}

/**
 * Represents a user account in the MangoTree application.
 * This is the public-facing user data returned by most API endpoints.
 *
 * @interface User
 * @property {string} _id - Unique identifier (MongoDB ObjectId as string)
 * @property {string} username - Unique username (trimmed, min 3 characters)
 * @property {string} email - Unique email address (lowercase)
 * @property {RoleType} role - User's role (USER or ADMIN)
 * @property {string} createdAt - Account creation timestamp (ISO string)
 * @property {string} [profileImage] - Optional profile image URL (default empty)
 * @property {string} [bio] - Optional user biography (max 100 chars)
 * @property {{ bio: Translation }} [translations] - Bilingual translations for bio
 * @property {boolean} [isApproved] - Whether user is approved (default: true)
 * @property {boolean} [isBanned] - Whether user is banned (default: false)
 * @property {string} [banned_user_id] - Optional banned user record ID (admin use)
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
    bio: Translation;
  };
  isApproved?: boolean;
  isBanned?: boolean;
  banned_user_id?: string;
}

/**
 * Detailed profile information for the authenticated user.
 * Extends basic User with social connections and preferences.
 *
 * @interface UserProfile
 * @property {string} _id - Unique identifier
 * @property {string} username - Unique username
 * @property {string} email - Email address
 * @property {RoleType} role - User role
 * @property {string} createdAt - Account creation timestamp
 * @property {string} [profileImage] - Optional profile image URL
 * @property {string} [bio] - Optional biography
 * @property {{ bio: Translation }} [translations] - Bilingual translations for bio
 * @property {string[]} followers - Array of user IDs who follow this user
 * @property {string[]} following - Array of user IDs this user follows
 * @property {Theme} [theme] - Preferred UI theme
 * @property {Language} [language] - Preferred language (en or bg)
 * @property {NotificationPreferences} [notificationPreferences] - Notification settings
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
    bio: Translation;
  };
  followers: string[];
  following: string[];
  theme?: Theme;
  language?: Language;
  notificationPreferences?: NotificationPreferences;
  pastUsernames?: {
    username: string;
    changedAt: string;
  }[];
}

// ============================================================================
// Content Types (Post, Comment, Category, Tag)
// ============================================================================

/**
 * Content category for organizing posts.
 *
 * @interface Category
 * @property {string} _id - Unique identifier
 * @property {string} name - Category name
 * @property {CategoryTranslations} [translations] - Bilingual translations for name
 * @property {string} [createdBy] - Optional username of creator
 * @property {string} [createdAt] - Creation timestamp (ISO string)
 * @property {string} [updatedAt] - Last modification timestamp (ISO string)
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
 *
 * @interface Tag
 * @property {string} _id - Unique identifier
 * @property {string} name - Tag name
 * @property {TagTranslations} [translations] - Bilingual translations for tag name
 * @property {TagType} [type] - Optional tag classification (meal_time, cuisine, difficulty, meal_type)
 * @property {string} [createdBy] - Optional username who created the tag
 * @property {string} [createdAt] - Creation timestamp (ISO string)
 * @property {string} [updatedAt] - Last modification timestamp (ISO string)
 */
export interface Tag {
  _id: string;
  name: string;
  translations?: TagTranslations;
  type?: 'meal_time' | 'cuisine' | 'difficulty' | 'meal_type';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A user's post in the MangoTree application.
 * Includes content, media, categorization, and engagement metrics.
 *
 * @interface Post
 * @property {string} _id - Unique identifier
 * @property {string} title - Post title
 * @property {string} content - Post content/description
 * @property {{
 *   title: { bg: string; en: string };
 *   content: { bg: string; en: string };
 *   tags?: { bg: string[]; en: string[] };
 * }} translations - Bilingual translations for content and tags
 * @property {string[]} image - Array of image URLs (base64 or file paths)
 * @property {{ _id: string; username: string; profileImage?: string }} authorId - Author's public profile data
 * @property {{ _id: string; name: string; translations?: { name?: { bg?: string; en?: string } } }} category - Category data
 * @property {string[]} tags - Array of tag strings
 * @property {string[]} likes - Array of user IDs who liked this post
 * @property {number} [commentCount] - Optional number of comments (populated)
 * @property {string} createdAt - Post creation timestamp (ISO string)
 * @property {string} [updatedAt] - Last modification timestamp (ISO string)
 * @property {boolean} [isLiked] - Whether the current user liked this post
 * @property {boolean} [isApproved] - Whether post has been approved (for moderation)
 * @property {boolean} [isVisible] - Whether post is publicly visible
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
 *
 * @interface Comment
 * @property {string} _id - Unique identifier
 * @property {string} postId - ID of the post being commented on
 * @property {{ _id: string; username: string; profileImage?: string }} userId - Comment author's public data
 * @property {string} text - Comment text content (max 200 characters)
 * @property {{ bg: string; en: string }} translations - Bilingual translations for comment text
 * @property {string} createdAt - Comment creation timestamp (ISO string)
 * @property {string} [updatedAt] - Last modification timestamp (ISO string)
 * @property {string[]} likes - Array of user IDs who liked this comment
 * @property {boolean} [isLiked] - Whether the current user liked this comment
 * @property {string} [parentCommentId] - Optional parent comment ID for replies
 * @property {Comment[]} [replies] - Optional array of nested reply comments
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

// ============================================================================
// Moderation & Reporting Types
// ============================================================================

/**
 * A content report submitted by a user.
 *
 * @interface Report
 * @property {string} _id - Unique identifier
 * @property {{ _id: string; username: string; profileImage?: string }} reportedBy - Reporting user's data
 * @property {ReportTargetType} targetType - Type of content being reported (post, comment, user)
 * @property {string} targetId - ID of the reported content
 * @property {string} reason - Reason for the report
 * @property {{ reason: Translation }} [translations] - Bilingual translations for reason
 * @property {ReportStatusType} status - Current status (pending, reviewed, rejected, action_taken)
 * @property {string} createdAt - Report submission timestamp (ISO string)
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
 *
 * @interface BannedUser
 * @property {string} _id - Unique identifier
 * @property {string} email - Banned user's email (to block re-registration)
 * @property {string} username - Banned user's chosen username
 * @property {string} original_user_id - Reference to the original User document
 * @property {string} ban_reason - Reason for the ban (admin-provided)
 * @property {string} banned_at - Timestamp when the ban was issued (ISO string)
 */
export interface BannedUser {
  _id: string;
  email: string;
  username: string;
  original_user_id: string;
  ban_reason: string;
  banned_at: string;
}

/**
 * Content flagged for admin review (AI moderation queue).
 * Not a backend model; constructed for admin UI.
 *
 * @interface FlaggedContent
 * @property {string} _id - Unique identifier (post or comment ID)
 * @property {'post' | 'comment' | 'image'} type - Type of flagged content
 * @property {any} content - The actual content object (post/comment)
 * @property {{ _id: string; username: string }} authorId - Author's basic info
 * @property {string} createdAt - Timestamp when flagged (ISO string)
 */
export interface FlaggedContent {
  _id: string;
  type: 'post' | 'comment' | 'image';
  content: any;
  authorId: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * An in-app notification sent to a user.
 *
 * @interface Notification
 * @property {string} _id - Unique identifier
 * @property {string} userId - ID of the recipient user
 * @property {NotificationType} type - Type of notification
 * @property {string} message - Notification message content
 * @property {{ message: Translation }} translations - Bilingual translations for message
 * @property {string | null} [link] - Optional URL link for the notification
 * @property {boolean} read - Whether the notification has been read
 * @property {string} createdAt - Notification creation timestamp (ISO string)
 * @property {string} [updatedAt] - Last modification timestamp (ISO string)
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
// Authentication Types
// ============================================================================

/**
 * Payload structure for JWT tokens.
 * Contains user identity and role information for authentication.
 *
 * @interface JwtPayload
 * @property {string} userId - MongoDB ObjectId of the user
 * @property {string} [username] - Optional username for convenience
 * @property {RoleType} role - User's role (USER or ADMIN)
 */
export interface JwtPayload {
  userId: string;
  username?: string;
  role: RoleType;
}

/**
 * Response structure for successful login/registration.
 *
 * @interface LoginResponse
 * @property {string} [message] - Optional message (e.g., success notice)
 * @property {string} [token] - JWT access token (if any)
 * @property {string} [refreshToken] - Refresh token (if any)
 * @property {{ id: string; username: string; role: RoleType; bio?: string; translations?: any }} user - Authenticated user data
 * @property {string} [redirectTo] - Optional redirect path after login
 * @property {boolean} [twoFactorRequired] - Whether 2FA verification is needed
 * @property {string} [userId] - User ID (for 2FA flow)
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
 *
 * @interface ErrorResponse
 * @property {string} message - Error message
 */
export interface ErrorResponse {
  message: string;
}

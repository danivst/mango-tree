import { Document, Types } from "mongoose";
import { RoleType } from "../enums/role-type";

/**
 * @interface IUser
 * @description Mongoose document interface for User model.
 * Represents a registered user in the MangoTree application.
 *
 * @property {Types.ObjectId} _id - Unique identifier (MongoDB ObjectId)
 * @property {string} username - Unique username (min 3 characters, trimmed)
 * @property {string} email - Unique email address (lowercase, trimmed)
 * @property {string} passwordHash - Bcrypt-hashed password
 * @property {RoleType} role - User role (USER or ADMIN)
 * @property {string} [resetToken] - Optional password reset token
 * @property {Date} [resetTokenExpiry] - Optional password reset token expiry
 * @property {string} [profileImage] - Optional profile image URL (default: "")
 * @property {string} [bio] - Optional user biography (max 100 chars, default: "")
 * @property {boolean} [isApproved] - Whether user is approved (default: true)
 * @property {boolean} [isBanned] - Whether user is banned (default: false)
 * @property {Translation} translations - Bilingual translations for user content
 * @property {NotificationPreferences} notificationPreferences - User's notification settings
 * @property {string} [theme] - Preferred UI theme: "dark", "purple", "cream", "light", "mango" (default: "mango")
 * @property {string} [language] - Preferred language: "en" or "bg" (default: "en")
 * @property {boolean} [twoFactorEnabled] - Whether 2FA is enabled
 * @property {string} [twoFactorCode] - Current 2FA verification code
 * @property {Date} [twoFactorCodeExpiry] - 2FA code expiry timestamp
 * @property {Date} createdAt - Account creation timestamp
 * @property {Types.ObjectId[]} followers - Array of user IDs who follow this user
 * @property {Types.ObjectId[]} following - Array of user IDs this user follows
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
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
  notificationPreferences: {
    emailReports: boolean;
    emailComments: boolean;
    inAppReports: boolean;
    inAppComments: boolean;
  };
  theme?: "dark" | "purple" | "cream" | "light" | "mango";
  language?: "en" | "bg";
  twoFactorEnabled?: boolean;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;
  createdAt: Date;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  pastUsernames: {
    username: string;
    changedAt: Date;
  }[];
}

/**
 * @interface Translation
 * @description Bilingual translation structure for dynamically stored text.
 * Stores both Bulgarian (bg) and English (en) versions of content.
 */
export interface Translation {
  bg: string;
  en: string;
}

/**
 * @interface NotificationPreferences
 * @description User preferences for receiving notifications.
 */
export interface NotificationPreferences {
  /** Email notifications for reports */
  emailReports: boolean;
  /** Email notifications for comments */
  emailComments: boolean;
  /** In-app notifications for reports */
  inAppReports: boolean;
  /** In-app notifications for comments */
  inAppComments: boolean;
}

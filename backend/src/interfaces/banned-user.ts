import mongoose, { Document } from "mongoose";

/**
 * @interface IBannedUser
 * @description Mongoose document interface for BannedUser model.
 * Represents a user who has been banned from the platform.
 * Separate collection from User to maintain historical records even if user is deleted.
 *
 * @property {string} email - Banned user's email address (for blocking re-registration)
 * @property {string} username - Banned user's chosen username
 * @property {mongoose.Types.ObjectId} original_user_id - Reference to the original User document
 * @property {string} ban_reason - Reason for the ban (admin-provided)
 * @property {Date} banned_at - Timestamp when the ban was issued
 */
export interface IBannedUser extends Document {
  email: string;
  username: string;
  original_user_id: mongoose.Types.ObjectId;
  ban_reason: string;
  banned_at: Date;
}
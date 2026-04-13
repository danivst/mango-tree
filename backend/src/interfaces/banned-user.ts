import { Document, Types } from "mongoose";

/**
 * @interface IBannedUser
 * @description Mongoose document interface for BannedUser model.
 * Represents a user who has been banned from the platform.
 * Separate collection from User to maintain historical records even if user is deleted.
 *
 * @property {string} email - Banned user's email address (for blocking re-registration)
 * @property {string} username - Banned user's chosen username
 * @property {Types.ObjectId} originalUserId - Reference to the original User document
 * @property {string} banReason - Reason for the ban (admin-provided)
 * @property {Date} bannedAt - Timestamp when the ban was issued
 */
export interface IBannedUser extends Document {
  email: string;
  username: string;
  originalUserId: Types.ObjectId;
  banReason: string;
  bannedAt: Date;
}
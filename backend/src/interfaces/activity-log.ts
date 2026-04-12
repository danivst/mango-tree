import mongoose, { Document } from "mongoose";

/**
 * @interface IActivityLog
 * @description Mongoose document interface for ActivityLog model.
 * Records system-wide actions performed by users for auditing and security.
 *
 * @property {mongoose.Types.ObjectId} userId - Reference to the User who performed the action
 * @property {string} actionType - The type of action performed (e.g., 'LOGIN', 'CREATE_POST')
 * @property {mongoose.Types.ObjectId} [targetId] - Optional reference to the affected entity
 * @property {string} [targetType] - Optional type of the affected entity (e.g., 'Post', 'Comment')
 * @property {string} description - Human-readable description of the activity
 * @property {string} [ipAddress] - Optional IP address of the user
 * @property {string} [userAgent] - Optional browser/device string
 * @property {Date} createdAt - Activity log creation timestamp
 */
export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  actionType: string;
  targetId?: mongoose.Types.ObjectId;
  targetType?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
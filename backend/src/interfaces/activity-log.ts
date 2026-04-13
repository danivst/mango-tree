import { Document, Types } from "mongoose";

/**
 * @interface IActivityLog
 * @description Mongoose document interface for ActivityLog model.
 * Records system-wide actions performed by users for auditing and security.
 *
 * @property {Types.ObjectId} userId - Reference to the User who performed the action
 * @property {string} actionType - The type of action performed (e.g., 'LOGIN', 'CREATE_POST')
 * @property {Types.ObjectId} [targetId] - Optional reference to the affected entity
 * @property {string} [targetType] - Optional type of the affected entity (e.g., 'Post', 'Comment')
 * @property {string} description - Human-readable description of the activity
 * @property {string} [ipAddress] - Optional IP address of the user
 * @property {string} [userAgent] - Optional browser/device string
 * @property {Date} createdAt - Activity log creation timestamp
 */
export interface IActivityLog extends Document {
  userId: Types.ObjectId;
  actionType: string;
  targetId?: Types.ObjectId;
  targetType?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
/**
 * @file activity-log.ts
 * @description Mongoose model for ActivityLog.
 * Records significant user actions for admin audit and review.
 *
 * @interface IActivityLog
 */

import mongoose, { Document, Schema, Model } from "mongoose";

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId; // ref: User
  actionType: string;
  targetId?: mongoose.Types.ObjectId;
  targetType?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema: Schema<IActivityLog> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    targetType: {
      type: String,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for common query patterns
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });

const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>(
  "ActivityLog",
  activityLogSchema,
);

export default ActivityLog;

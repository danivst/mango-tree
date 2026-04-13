/**
 * @file activity-log-model.ts
 * @description Mongoose model for ActivityLog.
 * Records significant user actions for admin audit and review.
 *
 * @see IActivityLog interface for the full type definition
 */

import mongoose, { Schema, Model } from "mongoose";
import { IActivityLog } from "../interfaces/activity-log";

const activityLogSchema: Schema<IActivityLog> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true, },
    actionType: { type: String, required: true, index: true, },
    targetId: { type: Schema.Types.ObjectId, index: true, },
    targetType: { type: String, index: true, },
    description: { type: String, required: true, },
    ipAddress: { type: String, },
    userAgent: { type: String, },
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

/**
 * @file notification-model.ts
 * @description Mongoose model for Notification.
 * In-app notifications sent to users for various events.
 *
 * @see INotification interface for the full type definition
 */

import mongoose, { Schema, Model } from "mongoose";
import NotificationType from "../enums/notification-type";
import { INotification } from "../interfaces/notification";

const notificationSchema: Schema<INotification> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    translations: {
      message: {
        bg: { type: String, default: "" },
        en: { type: String, default: "" },
      },
    },
    link: {
      type: String,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);

export default Notification;

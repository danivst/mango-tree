/**
 * @file notification.ts
 * @description Mongoose model for Notification.
 * In-app notifications sent to users for various events.
 *
 * @see INotification interface for the full type definition
 */

import mongoose, { Document, Schema, Model, Types } from "mongoose";
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

// Add middleware to log validation errors
notificationSchema.pre('validate', function(this: any, next) {
  if (this.message && typeof this.message !== 'string') {
    console.error('NOTIFICATION VALIDATION ERROR!');
    console.error('  Document ID:', this._id);
    console.error('  Type:', this.type);
    console.error('  message type:', typeof this.message);
    console.error('  message value:', this.message);
    console.error('  Stack:', new Error().stack);
  }
  next();
});

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);

export default Notification;

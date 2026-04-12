import { Document, Types } from "mongoose";
import { NotificationType } from "../enums/notification-type";

/**
 * @interface INotification
 * @description Mongoose document interface for Notification model.
 * Represents an in-app notification sent to a user.
 *
 * @property {Types.ObjectId} _id - Unique identifier (MongoDB ObjectId)
 * @property {Types.ObjectId} userId - Reference to the recipient User
 * @property {NotificationType} type - Type of notification (enum value)
 * @property {string} message - Notification message content
 * @property {Object} translations - Bilingual translations for message
 * @property {string | null} [link] - Optional URL link for the notification
 * @property {boolean} read - Whether the notification has been read
 * @property {Date} createdAt - Notification creation timestamp
 */
export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  message: string;
  translations: {
    message: {
      bg: string;
      en: string;
    };
  };
  link?: string | null;
  read: boolean;
  createdAt: Date;
}

/**
 * @interface NotificationTranslations
 * @description Translation structure for notification messages.
 * Used to display alerts in the user's preferred language.
 * 
 * @property {Object} message - English and Bulgarian messages
 */
export interface NotificationTranslations {
  message: {
    bg: string;
    en: string;
  };
}
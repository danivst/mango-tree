import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import NotificationType from '../enums/notification-type';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: keyof typeof NotificationType;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: Date;
}

const notificationSchema: Schema<INotification> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
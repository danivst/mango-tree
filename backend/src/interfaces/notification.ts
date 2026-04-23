import { Document, Types } from "mongoose";
import { INotification as SharedINotification } from "@mangotree/shared";

/**
 * @interface INotification
 * @description Mongoose document interface for Notification model.
 * Extends the shared INotification interface with Mongoose Document.
 */
export interface INotification
  extends Document, Omit<SharedINotification, "_id" | "userId"> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
}

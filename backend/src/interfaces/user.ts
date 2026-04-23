import { Document, Types } from "mongoose";
import { IUser as SharedIUser } from "@mangotree/shared";

/**
 * @interface IUser
 * @description Mongoose document interface for User model.
 * Extends the shared IUser interface with Mongoose Document.
 */
export interface IUser extends Document, Omit<SharedIUser, '_id' | 'followers' | 'following'> {
  _id: Types.ObjectId;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
}
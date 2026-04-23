import { Document, Types } from "mongoose";
import { Tag as SharedTag } from "@mangotree/shared";

/**
 * @interface ITag
 * @description Mongoose document interface for Tag model.
 * Extends the shared Tag interface with Mongoose Document.
 */
export interface ITag extends Document, Omit<SharedTag, '_id' | 'createdAt' | 'updatedAt'> {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
import mongoose, { Document } from "mongoose";
import { Category as SharedCategory } from "@mangotree/shared";

/**
 * @interface ICategory
 * @description Mongoose document interface for Category model.
 * Extends the shared Category interface with Mongoose Document.
 */
export interface ICategory
  extends Document, Omit<SharedCategory, "_id" | "createdAt" | "updatedAt"> {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

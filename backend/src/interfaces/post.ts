import { Document, Types } from "mongoose";
import { IPost as SharedIPost } from "@mangotree/shared";

/**
 * @interface IPost
 * @description Mongoose document interface for Post model.
 * Extends the shared IPost interface with Mongoose Document.
 */
export interface IPost extends Document, Omit<SharedIPost, '_id' | 'authorId' | 'category' | 'tags' | 'likes'> {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  category: Types.ObjectId;
  tags: Types.ObjectId[];
  likes: Types.ObjectId[];
}
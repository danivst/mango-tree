import { Document, Types } from "mongoose";

/**
 * @interface IComment
 * @description Mongoose document interface for Comment model.
 * Represents a comment on a post, with optional replies and likes.
 */
export interface IComment extends Document {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  translations: {
    bg: string;
    en: string;
  };
  likes: Types.ObjectId[];
  isVisible?: boolean;
  parentCommentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

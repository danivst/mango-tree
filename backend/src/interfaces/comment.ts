import { Document, Types } from "mongoose";

/**
 * @interface IComment
 * @description Mongoose document interface for Comment model.
 * Represents a comment on a post, with optional replies.
 *
 * @property {Types.ObjectId} _id - Unique identifier (MongoDB ObjectId)
 * @property {Types.ObjectId} postId - Reference to the Post being commented on
 * @property {Types.ObjectId} userId - Reference to the User who wrote the comment
 * @property {string} text - Comment text content (max 200 characters)
 * @property {CommentTranslations} translations - Bilingual translations for comment text
 * @property {Types.ObjectId[]} likes - Array of user IDs who liked this comment
 * @property {boolean} [isVisible] - Whether comment is visible (default: true)
 * @property {Types.ObjectId} [parentCommentId] - Optional reference to parent comment for replies
 * @property {Date} createdAt - Comment creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
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

/**
 * @interface CommentTranslations
 * @description Translation structure for comment text.
 */
export interface CommentTranslations {
  bg: string;
  en: string;
}

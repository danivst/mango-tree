import { Document, Types } from "mongoose";

/**
 * @interface IPost
 * @description Mongoose document interface for Post model.
 * Represents a user's post in the MangoTree application.
 *
 * @property {Types.ObjectId} _id - Unique identifier (MongoDB ObjectId)
 * @property {string} title - Post title
 * @property {string} content - Post content/description
 * @property {PostTranslations} translations - Bilingual translations for content and tags
 * @property {string[]} image - Array of image URLs (base64 or file paths)
 * @property {Types.ObjectId} authorId - Reference to the User who created this post
 * @property {Types.ObjectId} category - Reference to the Category document
 * @property {string[]} tags - Array of tag strings for categorization
 * @property {Types.ObjectId[]} likes - Array of user IDs who liked this post
 * @property {Date} createdAt - Post creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 * @property {boolean} isApproved - Whether post has been approved (for moderation)
 * @property {boolean} isVisible - Whether post is publicly visible
 */
export interface IPost extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  translations: {
    title: {
      bg: string;
      en: string;
    };
    content: {
      bg: string;
      en: string;
    };
    tags?: {
      bg: string[];
      en: string[];
    };
  };
  image: string[];
  authorId: Types.ObjectId;
  category: Types.ObjectId;
  tags: string[];
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isApproved: boolean;
  isVisible: boolean;
}

/**
 * @interface PostTranslations
 * @description Translation structure for post content.
 */
export interface PostTranslations {
  title: {
    bg: string;
    en: string;
  };
  content: {
    bg: string;
    en: string;
  };
  tags?: {
    bg: string[];
    en: string[];
  };
}

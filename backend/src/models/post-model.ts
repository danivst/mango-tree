/**
 * @file post-model.ts
 * @description Mongoose model for Post.
 * User-generated content with AI moderation, translations, and search indexes.
 *
 * @see IPost interface for the full type definition
 */

import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { IPost } from "../interfaces/post";

const postSchema: Schema<IPost> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    translations: {
      title: {
        bg: { type: String, default: "" },
        en: { type: String, default: "" },
      },
      content: {
        bg: { type: String, default: "" },
        en: { type: String, default: "" },
      },
      tags: {
        bg: { type: [String], default: [] },
        en: { type: [String], default: [] },
      },
    },
    image: {
      type: [String],
      default: [],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    category: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isApproved: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Text index for search functionality
postSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text',
});

// Compound indexes for better query performance
postSchema.index({ isVisible: 1, createdAt: -1 });
postSchema.index({ authorId: 1, isVisible: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ likes: 1 });

const Post: Model<IPost> = mongoose.model<IPost>(
  "Post", 
  postSchema,
);

export default Post;

/**
 * @file comment-model.ts
 * @description Mongoose model for Comment.
 * Supports nested replies via parentCommentId.
 *
 * @see IComment interface for the full type definition
 */

import mongoose, { Schema, Model } from "mongoose";
import { IComment } from "../interfaces/comment";

const commentSchema: Schema<IComment> = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Post",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    text: {
      type: String,
      required: true,
      maxLength: 200,
    },
    translations: {
      bg: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isVisible: {
      type: Boolean,
      default: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying of replies
commentSchema.index({ parentCommentId: 1, createdAt: 1 });
commentSchema.index({ postId: 1, createdAt: 1 });

const Comment: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  commentSchema,
);

export default Comment;

import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IComment extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  // Key name is the language code, value is translated text
  translations: {
    bg: string;
    en: string;
  };
  likes: Types.ObjectId[]; // array of user IDs who liked
  isVisible?: boolean;
  parentCommentId?: Types.ObjectId; // Reference to parent comment (for replies)
  createdAt: Date;
  updatedAt: Date;
}

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

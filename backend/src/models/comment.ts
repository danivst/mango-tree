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
  createdAt: Date;
  likes: Types.ObjectId[]; // array of user IDs who liked
  isVisible?: boolean; // Added isVisible
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Comment: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  commentSchema,
);

export default Comment;

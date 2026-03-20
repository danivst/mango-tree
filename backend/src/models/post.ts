import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IPost extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  // Key name is the language code, value is translated text
  translations: {
    title: {
      bg: string;
      en: string;
    };
    content: {
      bg: string;
      en: string;
    };
  };
  image: string[];
  authorId: Types.ObjectId;
  category: Schema.Types.ObjectId;
  tags: string[];
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isApproved: boolean;
  isVisible: boolean;
}

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

const Post: Model<IPost> = mongoose.model<IPost>("Post", postSchema);

export default Post;

import mongoose, { Document, Schema, Model, Types } from "mongoose";
import RoleTypeValue from "../enums/role-type";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: (typeof RoleTypeValue)[keyof typeof RoleTypeValue];
  resetToken?: string;
  resetTokenExpiry?: Date;
  profileImage?: string;
  bio?: string;
  isApproved?: boolean; // Added isApproved
  isBanned?: boolean; // Added isBanned
  // Key name is the language code, value is translated bio
  translations: {
    bio: {
      bg: string;
      en: string;
    };
  };
  notificationPreferences: {
    emailReports: boolean;
    emailComments: boolean;
    inAppReports: boolean;
    inAppComments: boolean;
  };
  theme?: string; // User's preferred theme: dark, purple, cream, light
  language?: string; // User's preferred language: en, bg
  createdAt: Date;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
}

const userSchema: Schema<IUser> = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(RoleTypeValue),
      default: RoleTypeValue.USER,
    },
    resetToken: String,
    resetTokenExpiry: Date,
    profileImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 100,
      default: "",
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    translations: {
      bio: {
        bg: { type: String, default: "" },
        en: { type: String, default: "" },
      },
    },
    notificationPreferences: {
      emailReports: { type: Boolean, default: true },
      emailComments: { type: Boolean, default: true },
      inAppReports: { type: Boolean, default: true },
      inAppComments: { type: Boolean, default: true },
    },
    theme: {
      type: String,
      enum: ["dark", "purple", "cream", "light", "mango"],
      default: "mango",
    },
    language: {
      type: String,
      enum: ["en", "bg"],
      default: "en",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    followers: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    following: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;

/**
 * @file user.ts
 * @description Mongoose model for User.
 * Core user account with authentication, profile, preferences, and social features.
 *
 * @see IUser interface for the full type definition
 */

import mongoose, { Document, Schema, Model, Types } from "mongoose";
import RoleTypeValue from "../enums/role-type";
import { IUser } from "../interfaces/user";

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
    // 2FA fields
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: {
      type: String,
    },
    twoFactorCodeExpiry: {
      type: Date,
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
    // History of previous usernames with timestamps
    pastUsernames: {
      type: [
        {
          username: String,
          changedAt: {
            type: Date,
            default: Date.now,
          },
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

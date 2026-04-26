/**
 * @file user-model.ts
 * @description Mongoose model for User.
 * Core user account with authentication, profile, preferences and social features.
 *
 * @see IUser interface for the full type definition
 */

import mongoose, { Schema, Model } from "mongoose";
import RoleTypeValue from "../enums/role-type";
import { IUser } from "../interfaces/user";
import ThemeTypeValue from "../enums/theme-type";
import LanguageTypeValue from "../enums/language-type";

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
    theme: {
      type: String,
      enum: Object.values(ThemeTypeValue),
      default: ThemeTypeValue.MANGO,
    },
    language: {
      type: String,
      enum: Object.values(LanguageTypeValue),
      default: LanguageTypeValue.EN,
    },
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

const User: Model<IUser> = mongoose.model<IUser>(
  "User", 
  userSchema,
);

export default User;

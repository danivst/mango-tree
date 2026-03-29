/**
 * @file tag.ts
 * @description Mongoose model for Tag.
 * Tags categorize posts by cuisine, meal type, difficulty, etc.
 *
 * @see ITag interface for the full type definition
 */

import mongoose, { Document, Schema, Model } from "mongoose";
import TagType from "../enums/tag-type";
import { ITag } from "../interfaces/tag";

const tagSchema: Schema<ITag> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    translations: {
      bg: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    type: {
      type: String,
      enum: Object.values(TagType),
      required: false,
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Tag: Model<ITag> = mongoose.model<ITag>("Tag", tagSchema);

export default Tag;

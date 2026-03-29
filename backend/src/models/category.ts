/**
 * @file category.ts
 * @description Mongoose model for Category.
 * Categories organize posts by topic and support bilingual names.
 *
 * @see ICategory interface for the full type definition
 */

import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { ICategory } from "../interfaces/category";

const categorySchema: Schema<ICategory> = new Schema(
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
    createdBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Category: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  categorySchema,
);

export default Category;

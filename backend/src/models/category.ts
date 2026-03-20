import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  // Key name is the language code, value is translated category name
  translations: {
    name: {
      bg: string;
      en: string;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

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

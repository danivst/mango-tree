import mongoose, { Document, Schema, Model } from "mongoose";
import TagType from "../enums/tag-type";

export interface ITag extends Document {
  name: string;
  // Key name is the language code, value is translated name
  translations: {
    name: {
      bg: string;
      en: string;
    };
  };
  type?: keyof typeof TagType;
  createdAt?: Date;
  updatedAt?: Date;
}

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
  },
  {
    timestamps: true,
  },
);

const Tag: Model<ITag> = mongoose.model<ITag>("Tag", tagSchema);

export default Tag;

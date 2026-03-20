import mongoose, { Document, Schema, Model } from "mongoose";

export interface ITranslation extends Document {
  key: string;
  en: string;
  bg: string;
  context?: string;
}

const translationSchema: Schema<ITranslation> = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    en: {
      type: String,
      required: true,
    },
    bg: {
      type: String,
      required: true,
    },
    context: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Translation: Model<ITranslation> = mongoose.model<ITranslation>(
  "Translation",
  translationSchema,
);

export default Translation;

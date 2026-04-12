import mongoose, { Document } from "mongoose";
import TagType from "../enums/tag-type";

/**
 * @interface ITag
 * @description Mongoose document interface for Tag model.
 * Represents a tag that can be associated with posts for filtering and search.
 *
 * @property {mongoose.Types.ObjectId} _id - Unique identifier (MongoDB ObjectId)
 * @property {string} name - Tag name
 * @property {Object} translations - Bilingual translations for tag name
 * @property {keyof typeof TagType} [type] - Optional tag type classification
 * @property {string} [createdBy] - Optional username who created the tag
 * @property {Date} [createdAt] - Tag creation timestamp
 * @property {Date} [updatedAt] - Last modification timestamp
 */
export interface ITag extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  translations: {
    name: {
      bg: string;
      en: string;
    };
  };
  type?: keyof typeof TagType;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @interface TagTranslations
 * @description Translation structure for tag names.
 * Used during creation to handle bilingual tag identification.
 * 
 * @property {Object} name - English and Bulgarian names
 */
export interface TagTranslations {
  name: {
    bg: string;
    en: string;
  };
}
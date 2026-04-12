import mongoose, { Document } from "mongoose";

/**
 * @interface ICategory
 * @description Mongoose document interface for Category model.
 * Represents a content category for organizing posts.
 *
 * @property {mongoose.Types.ObjectId} _id - Unique identifier (MongoDB ObjectId)
 * @property {string} name - Category name
 * @property {Object} translations - Bilingual translations for category name
 * @property {string} [createdBy] - Optional username of creator
 * @property {Date} [createdAt] - Category creation timestamp
 * @property {Date} [updatedAt] - Last modification timestamp
 */
export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  translations: {
    name: {
      bg: string;
      en: string;
    };
  };
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @interface CategoryTranslations
 * @description Translation structure for category names.
 * Used to handle bilingual data for UI display.
 * 
 * @property {Object} name - English and Bulgarian names
 */
export interface CategoryTranslations {
  name: {
    bg: string;
    en: string;
  };
}
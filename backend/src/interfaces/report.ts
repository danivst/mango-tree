import { Document, Types } from "mongoose";
import { ReportStatusType } from "../enums/report-status-type";
import { ReportTargetType } from "../enums/report-target-type";

/**
 * @interface IReport
 * @description Mongoose document interface for Report model.
 * Represents a content report submitted by a user for moderation review.
 *
 * @property {Types.ObjectId} _id - Unique identifier (MongoDB ObjectId)
 * @property {Types.ObjectId} reportedBy - Reference to the reporting User
 * @property {ReportTargetType} targetType - Type of content being reported (POST, COMMENT, USER)
 * @property {Types.ObjectId} targetId - Reference ID to the reported content
 * @property {string} reason - Reason for the report
 * @property {Object} translations - Bilingual translations for report reason
 * @property {ReportStatusType} status - Current status of the report (PENDING, RESOLVED)
 * @property {Date} createdAt - Report submission timestamp
 */
export interface IReport extends Document {
  _id: Types.ObjectId;
  reportedBy: Types.ObjectId;
  targetType: ReportTargetType;
  targetId: Types.ObjectId;
  reason: string;
  translations: {
    reason: {
      bg: string;
      en: string;
    };
  };
  status: ReportStatusType;
  createdAt: Date;
}

/**
 * @interface ReportTranslations
 * @description Translation structure for report reasons.
 * Ensures moderators can read the report context in multiple languages.
 * 
 * @property {Object} reason - English and Bulgarian reasons
 */
export interface ReportTranslations {
  reason: {
    bg: string;
    en: string;
  };
}
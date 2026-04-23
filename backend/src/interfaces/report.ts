import { Document, Types } from "mongoose";
import { ReportStatusType } from "../enums/report-status-type";
import { ReportTargetType } from "../enums/report-target-type";

/**
 * @interface IReport
 * @description Mongoose document interface for Report model.
 * Represents a content report submitted by a user for moderation review.
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

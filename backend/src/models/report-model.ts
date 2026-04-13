/**
 * @file report-model.ts
 * @description Mongoose model for Report.
 * Tracks user reports against content (posts, comments, users) and their resolution status.
 *
 * @see IReport interface for the full type definition
 */

import mongoose, { Schema, Model } from "mongoose";
import ReportStatusType from "../enums/report-status-type";
import ReportTargetType from "../enums/report-target-type";
import { IReport } from "../interfaces/report";

const reportSchema: Schema<IReport> = new Schema(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    targetType: {
      type: String,
      enum: Object.values(ReportTargetType),
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    translations: {
      bg: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: Object.values(ReportStatusType),
      default: ReportStatusType.PENDING,
    },
  },
  {
    timestamps: true,
  },
);

const Report: Model<IReport> = mongoose.model<IReport>(
  "Report",
  reportSchema
);

export default Report;

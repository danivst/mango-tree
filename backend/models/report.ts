import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import ReportStatusType from '../enums/report-status-type';
import ReportTargetType from '../enums/report-target-type';

export interface IReport extends Document {
  reportedBy: Types.ObjectId;
  targetType: keyof typeof ReportTargetType;
  targetId: Types.ObjectId;
  reason: string;
  status: typeof ReportStatusType[keyof typeof ReportStatusType];
  createdAt: Date;
}

const reportSchema: Schema<IReport> = new Schema({
  reportedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
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
  status: {
    type: String,
    enum: Object.values(ReportStatusType),
    default: ReportStatusType.PENDING,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Report: Model<IReport> = mongoose.model<IReport>('Report', reportSchema);

export default Report;
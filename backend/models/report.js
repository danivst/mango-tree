import mongoose from 'mongoose';
import ReportStatusType from '../enums/report-status-type.js';
import ReportTargetType from '../enums/report-target-type.js';

const { Schema } = mongoose;

const reportSchema = new Schema({
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
});

export default mongoose.model('Report', reportSchema);
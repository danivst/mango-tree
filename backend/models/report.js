const mongoose = require('mongoose');
const { default: ReportStatusType } = require('../enums/report-status-type.js');
const { default: ReportTargetType } = require('../enums/report-target-type.js');
const { Schema } = mongoose;

const reportSchema = new Schema({
  reportedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  targetType: {
    type: ReportTargetType,
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
    type: ReportStatusType,
    default: ReportStatusType.PENDING,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Report', reportSchema);
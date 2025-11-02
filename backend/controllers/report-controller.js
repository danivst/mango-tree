import Report from '../models/report.js';
import Post from '../models/post.js';
import Comment from '../models/comment.js';
import ReportTargetType from '../enums/report-target-type.js';
import ReportStatusType from '../enums/report-status-type.js';
import RoleType from '../enums/role-type.js';

export const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    const reportedBy = req.user.userId;

    if (!ReportTargetType.includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type.' });
    }

    if (targetType === ReportTargetType.POST) {
      const post = await Post.findById(targetId);
      if (!post) return res.status(404).json({ message: 'Post not found.' });
    } else if (targetType === ReportTargetType.COMMENT) {
      const comment = await Comment.findById(targetId);
      if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    }

    const report = await Report.create({
      reportedBy,
      targetType,
      targetId,
      reason,
      status: ReportStatusType.PENDING,
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const reports = await Report.find()
      .populate('reportedBy', 'username profileImage')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!ReportStatusType.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!report) return res.status(404).json({ message: 'Report not found.' });

    res.json({ message: 'Report updated', report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
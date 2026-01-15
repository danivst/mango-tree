import { Request, Response } from 'express';

import Report from '../models/report';
import Post from '../models/post';
import Comment from '../models/comment';
import Notification from '../models/notification';
import NotificationType from '../enums/notification-type';

import ReportTargetTypeValue, { ReportTargetType } from '../enums/report-target-type';
import ReportStatusTypeValue, { ReportStatusType } from '../enums/report-status-type';
import RoleTypeValue, { RoleType } from '../enums/role-type';
import { AuthRequest } from '../utils/auth';

/* ---------- CREATE REPORT ---------- */
export const createReport = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { targetType, targetId, reason } = req.body as {
      targetType: string;
      targetId: string;
      reason: string;
    };
    const reportedBy = req.user!.userId;

    if (!Object.values(ReportTargetTypeValue).includes(targetType as ReportTargetType)) {
      return res.status(400).json({ message: 'Invalid target type.' });
    }

    if (targetType === ReportTargetTypeValue.POST) {
      const post = await Post.findById(targetId);
      if (!post) return res.status(404).json({ message: 'Post not found.' });
    } else if (targetType === ReportTargetTypeValue.COMMENT) {
      const comment = await Comment.findById(targetId);
      if (!comment)
        return res.status(404).json({ message: 'Comment not found.' });
    }

    const report = await Report.create({
      reportedBy,
      targetType,
      targetId,
      reason,
      status: ReportStatusTypeValue.PENDING,
      createdAt: new Date(),
    });

    return res
      .status(201)
      .json({ message: 'Report submitted successfully', report });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- GET ALL REPORTS ---------- */
export const getAllReports = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const reports = await Report.find()
      .populate('reportedBy', 'username profileImage')
      .sort({ createdAt: -1 });

    return res.json(reports);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE REPORT STATUS ---------- */
export const updateReportStatus = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const { status, reason } = req.body as { status: string; reason?: string };

    if (!Object.values(ReportStatusTypeValue).includes(status as ReportStatusType)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const report = await Report.findById(id)
      .populate('reportedBy', 'username')
      .populate('targetId');
    
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    const updatedReport = await Report.findByIdAndUpdate(id, { status }, { new: true });

    // Send notification to reporter if rejected
    if (status === ReportStatusTypeValue.REJECTED && reason) {
      const reportedById = typeof report.reportedBy === 'object' && report.reportedBy && '_id' in report.reportedBy
        ? (report.reportedBy as any)._id.toString()
        : (report.reportedBy as any).toString();
      
      await Notification.create({
        userId: reportedById,
        type: NotificationType.REPORT_FEEDBACK,
        message: `Your report has been reviewed and not been marked as disruptive. Reason: ${reason}`,
        link: null,
      });
    }

    return res.json({ message: 'Report updated', report: updatedReport });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE REPORTED ITEM ---------- */
export const deleteReportedItem = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const { reason } = req.body as { reason: string };

    const report = await Report.findById(id)
      .populate('reportedBy', 'username')
      .populate('targetId');
    
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    const targetType = report.targetType as ReportTargetType;
    
    if (targetType === ReportTargetTypeValue.POST) {
      const post = await Post.findById(report.targetId).populate('authorId');
      if (post && post.authorId) {
        const authorId = typeof post.authorId === 'object' && post.authorId && '_id' in post.authorId
          ? (post.authorId as any)._id.toString()
          : (post.authorId as any).toString();
        
        await Post.findByIdAndDelete(report.targetId);
        
        // Notify author
        await Notification.create({
          userId: authorId,
          type: NotificationType.REPORT_FEEDBACK,
          message: `Your post has been removed. Reason: ${reason}`,
          link: null,
        });
      }
    } else if (targetType === ReportTargetTypeValue.COMMENT) {
      const comment = await Comment.findById(report.targetId).populate('userId');
      if (comment && comment.userId) {
        const userId = typeof comment.userId === 'object' && comment.userId && '_id' in comment.userId
          ? (comment.userId as any)._id.toString()
          : (comment.userId as any).toString();
        
        await Comment.findByIdAndDelete(report.targetId);
        
        // Notify author
        await Notification.create({
          userId: userId,
          type: NotificationType.REPORT_FEEDBACK,
          message: `Your comment has been removed. Reason: ${reason}`,
          link: null,
        });
      }
    }

    // Notify reporter
    const reportedById = typeof report.reportedBy === 'object' && report.reportedBy && '_id' in report.reportedBy
      ? (report.reportedBy as any)._id.toString()
      : (report.reportedBy as any).toString();
    
    await Notification.create({
      userId: reportedById,
      type: NotificationType.REPORT_FEEDBACK,
      message: 'Your report has been helpful and the item has been taken down.',
      link: null,
    });

    // Update report status to action_taken
    await Report.findByIdAndUpdate(id, { status: ReportStatusTypeValue.ACTION_TAKEN });

    return res.json({ message: 'Item deleted and notifications sent.' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
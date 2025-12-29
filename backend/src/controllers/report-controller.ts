import { Request, Response } from 'express';

import Report from '../models/report';
import Post from '../models/post';
import Comment from '../models/comment';

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
    const { status } = req.body as { status: string };

    if (!Object.values(ReportStatusTypeValue).includes(status as ReportStatusType)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    return res.json({ message: 'Report updated', report });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
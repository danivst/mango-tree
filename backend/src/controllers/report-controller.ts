/**
 * @file report-controller.ts
 * @description Handles user reports against posts, comments, and users. 
 * Includes administrative tools for reviewing reports, updating status
 * and performing content take-downs with automated bilingual notifications.
 */

import { Response } from "express";
import Report from "../models/report-model";
import Post from "../models/post-model";
import Comment from "../models/comment-model";
import User from "../models/user-model";
import Notification from "../models/notification-model";
import NotificationType from "../enums/notification-type";
import ReportTargetTypeValue, {
  ReportTargetType,
} from "../enums/report-target-type";
import ReportStatusTypeValue, {
  ReportStatusType,
} from "../enums/report-status-type";
import RoleTypeValue from "../enums/role-type";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import { logActivity } from "../utils/activity-logger";

/**
 * Files a new report.
 * Validates the target (Post/Comment/User) existence before creating. Logs the report submission.
 *
 * @param req - AuthRequest with body { targetType, targetId, reason }
 * @param res - Express response object
 * @returns Response with created report data
 * @throws {Error} Database validation or creation failure
 *
 * @example
 * ```json
 * Request body:
 * { "targetType": "post", "targetId": "...", "reason": "Spam" }
 * ```
 * @response
 * ```json
 * { "message": "Report submitted successfully", "report": { ... } }
 * ```
 */
export const createReport = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { targetType, targetId, reason } = req.body as {
      targetType: string;
      targetId: string;
      reason: string;
    };
    const reportedBy = req.user!.userId;

    if (
      !Object.values(ReportTargetTypeValue).includes(
        targetType as ReportTargetType,
      )
    ) {
      return res.status(400).json({ message: "Invalid target type." });
    }

    if (targetType === ReportTargetTypeValue.POST) {
      const post = await Post.findById(targetId);
      if (!post) return res.status(404).json({ message: "Post not found." });
    } else if (targetType === ReportTargetTypeValue.COMMENT) {
      const comment = await Comment.findById(targetId);
      if (!comment)
        return res.status(404).json({ message: "Comment not found." });
    } else if (targetType === ReportTargetTypeValue.USER) {
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ message: "User not found." });
    }

    const report = await Report.create({
      reportedBy,
      targetType,
      targetId,
      reason,
      status: ReportStatusTypeValue.PENDING,
      createdAt: new Date(),
    });

    await logActivity(req, "REPORT_SUBMIT", {
      targetId,
      targetType: targetType as any,
      description: `Reported ${targetType} ${targetId}. Reason: ${reason}`,
    });

    return res
      .status(201)
      .json({ message: "Report submitted successfully", report });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all reports.
 * Sorted by newest first. Restricted to Admins.
 *
 * @param req - AuthRequest
 * @param res - Express response object
 * @returns Response with list of reports
 * @throws {Error} Database retrieval error
 *
 * @example
 * ```json
 * GET /api/admin/reports
 * ```
 * @response
 * ```json
 * [ { "_id": "...", "reason": "Harassment", "status": "PENDING" } ]
 * ```
 */
export const getAllReports = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }
    const reports = await Report.find()
      .populate("reportedBy", "username profileImage")
      .sort({ createdAt: -1 });
    return res.json(reports);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates the status of a report.
 * Resolves or rejects a report. If rejected, sends a translated explanation to the reporter. restricted to Admins.
 *
 * @param req - AuthRequest with params { id } and body { status, reason? }
 * @param res - Express response object
 * @returns Response with updated report data
 * @throws {Error} Database update failure
 *
 * @example
 * ```json
 * Request body:
 * { "status": "REJECTED", "reason": "Not a violation" }
 * ```
 * @response
 * ```json
 * { "message": "Report updated", "report": { ... } }
 * ```
 */
export const updateReportStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;
    const { status, reason } = req.body as { status: string; reason?: string };

    if (
      !Object.values(ReportStatusTypeValue).includes(status as ReportStatusType)
    ) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const report = await Report.findById(id).populate("reportedBy", "username");
    if (!report) return res.status(404).json({ message: "Report not found." });

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (status === ReportStatusTypeValue.REJECTED && reason) {
      const reportedById =
        (report.reportedBy as any)._id?.toString() ||
        report.reportedBy.toString();

      const translated = await getDualTranslation(reason);

      const rejectMessageEn = `Your report was reviewed and not marked as disruptive. Reason: ${reason}`;
      const rejectMessageBg = `Вашият сигнал беше прегледан и не беше отбелязан като нарушаващ правилата. Причина: ${translated.bg}`;

      await Notification.create({
        userId: reportedById,
        type: NotificationType.REPORT_FEEDBACK,
        message: rejectMessageEn,
        translations: {
          message: {
            en: rejectMessageEn,
            bg: rejectMessageBg,
          },
        },
        link: null,
      });
    }

    await logActivity(req, "REPORT_STATUS_UPDATE", {
      targetId: report.id.toString(),
      targetType: "report",
      description: `Updated report ${id} status to ${status}`,
    });

    return res.json({ message: "Report updated", report: updatedReport });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes content associated with a report.
 * Deletes the post/comment, notifies the violator with a translated reason and thanks the reporter. Restricted to Admins.
 *
 * @param req - AuthRequest with params { id } and body { reason }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database deletion failure
 *
 * @example
 * ```json
 * Request body:
 * { "reason": "Prohibited content" }
 * ```
 * @response
 * ```json
 * { "message": "Item deleted and notifications sent." }
 * ```
 */
export const deleteReportedItem = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;
    const { reason } = req.body as { reason: string };

    const report = await Report.findById(id)
      .populate("reportedBy")
      .populate("targetId");
    if (!report) return res.status(404).json({ message: "Report not found." });

    const translatedReason = await getDualTranslation(reason);
    const targetType = report.targetType as ReportTargetType;

    if (targetType === ReportTargetTypeValue.POST) {
      const post = await Post.findById(report.targetId).populate("authorId");
      if (post && post.authorId) {
        const authorId =
          (post.authorId as any)._id?.toString() || post.authorId.toString();
        await Post.findByIdAndDelete(report.targetId);

        const postRemoveMessageEn = `Your post has been removed. Reason: ${reason}`;
        const postRemoveMessageBg = `Вашата публикация беше премахната. Причина: ${translatedReason.bg}`;

        await Notification.create({
          userId: authorId,
          type: NotificationType.REPORT_FEEDBACK,
          message: postRemoveMessageEn,
          translations: {
            message: {
              en: postRemoveMessageEn,
              bg: postRemoveMessageBg,
            },
          },
          link: null,
        });
      }
    } else if (targetType === ReportTargetTypeValue.COMMENT) {
      const comment = await Comment.findById(report.targetId).populate(
        "userId",
      );
      if (comment && comment.userId) {
        const userId =
          (comment.userId as any)._id?.toString() || comment.userId.toString();
        await Comment.findByIdAndDelete(report.targetId);

        const commentRemoveMessageEn = `Your comment has been removed. Reason: ${reason}`;
        const commentRemoveMessageBg = `Вашият коментар беше премахнат. Причина: ${translatedReason.bg}`;

        await Notification.create({
          userId: userId,
          type: NotificationType.REPORT_FEEDBACK,
          message: commentRemoveMessageEn,
          translations: {
            message: {
              en: commentRemoveMessageEn,
              bg: commentRemoveMessageBg,
            },
          },
          link: null,
        });
      }
    }

    const reporterNotify = await getDualTranslation(
      "Your report has been helpful and the item has been taken down.",
    );

    const reportedById =
      (report.reportedBy as any)._id?.toString() ||
      report.reportedBy.toString();
    await Notification.create({
      userId: reportedById,
      type: NotificationType.REPORT_FEEDBACK,
      message: reporterNotify.en,
      translations: {
        message: {
          en: reporterNotify.en,
          bg: reporterNotify.bg,
        },
      },
      link: null,
    });

    await Report.findByIdAndUpdate(id, {
      status: ReportStatusTypeValue.ACTION_TAKEN,
    });

    await logActivity(req, "REPORT_ITEM_DELETE", {
      targetId: report.targetId.toString(),
      targetType: report.targetType as any,
      description: `Deleted reported ${report.targetType} ${report.targetId}`,
    });

    return res.json({ message: "Item deleted and notifications sent." });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
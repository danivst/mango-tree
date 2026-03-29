import { Response } from "express";
import Report from "../models/report";
import Post from "../models/post";
import Comment from "../models/comment";
import User from "../models/user";
import Notification from "../models/notification";
import NotificationType from "../enums/notification-type";
import ReportTargetTypeValue, { ReportTargetType } from "../enums/report-target-type";
import ReportStatusTypeValue, { ReportStatusType } from "../enums/report-status-type";
import RoleTypeValue from "../enums/role-type";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";

/**
 * Submits a report against a post, comment, or user.
 * Validates that the target exists before creating the report.
 *
 * @param req - AuthRequest with body { targetType: 'post'|'comment'|'user', targetId: string, reason: string }
 * @param res - Response with { message, report } or error
 * @returns 201 on success, 400 for invalid target or missing fields, 404 if target not found
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

    return res
      .status(201)
      .json({ message: "Report submitted successfully", report });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Retrieves all reports, sorted by newest first.
 * Admin only.
 *
 * @param req - AuthRequest with user.role === ADMIN
 * @param res - Response with array of Report documents (populated with reporter info)
 * @returns 200 with reports array, 403 if not admin
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
 * Updates the status of a report (e.g., PENDING, RESOLVED, REJECTED, ACTION_TAKEN).
 * Admin only. If rejecting with a reason, sends a notification to the reporter.
 *
 * @param req - AuthRequest with params { id } and body { status: string, reason?: string }
 * @param res - Response with { message, report } or error
 * @returns 200 on success, 400 for invalid status, 404 if report not found, 403 if not admin
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

      // Translate the rejection reason
      const translated = await getDualTranslation(reason);

      const rejectMessageEn = `Your report was reviewed and not marked as disruptive. Reason: ${translated.en}`;
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

    return res.json({ message: "Report updated", report: updatedReport });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes the reported item (post or comment) and notifies relevant parties.
 * Admin only. Sends notifications to the item author and the reporter.
 *
 * @param req - AuthRequest with params { id } (report ID) and body { reason: string }
 * @param res - Response with { message } or error
 * @returns 200 on success, 400 if target not found, 404 if report not found, 403 if not admin
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

    // Translate the removal reason for the violator
    const translatedReason = await getDualTranslation(reason);
    const targetType = report.targetType as ReportTargetType;

    if (targetType === ReportTargetTypeValue.POST) {
      const post = await Post.findById(report.targetId).populate("authorId");
      if (post && post.authorId) {
        const authorId =
          (post.authorId as any)._id?.toString() || post.authorId.toString();
        await Post.findByIdAndDelete(report.targetId);

        const postRemoveMessageEn = `Your post has been removed. Reason: ${translatedReason.en}`;
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

        const commentRemoveMessageEn = `Your comment has been removed. Reason: ${translatedReason.en}`;
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

    // Fixed messages for the reporter
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

    return res.json({ message: "Item deleted and notifications sent." });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

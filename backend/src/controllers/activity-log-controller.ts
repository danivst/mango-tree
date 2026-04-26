/**
 * @file activity-log-controller.ts
 * @description Controller for retrieving activity logs.
 * Provides admin-only access to audit logs with filtering, search and pagination.
 */

import { Response } from "express";
import ActivityLog from "../models/activity-log-model";
import { AuthRequest } from "../interfaces/auth";
import RoleTypeValue from "../enums/role-type";
import logger from "../utils/logger";

/**
 * Retrieves a paginated list of activity logs.
 * Restricted to Admins. Supports filtering by user, action type, date range and text search.
 *
 * @param req - AuthRequest with query parameters { page, limit, userId, actionType, startDate, endDate, search }
 * @param res - Express response object
 * @returns Response with paginated logs and metadata
 * @throws {Error} Database retrieval error
 *
 * @example
 * ```json
 * GET /api/admin/logs?page=1&limit=10&actionType=BAN_USER
 * ```
 * @response
 * ```json
 * {
 * "logs": [...],
 * "total": 150,
 * "page": 1,
 * "totalPages": 15
 * }
 * ```
 */
export const getActivityLogs = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      page = 1,
      limit = 50,
      userId,
      actionType,
      startDate,
      endDate,
      search,
    } = req.query;

    const query: any = {};

    if (userId) query.userId = userId;
    if (actionType) query.actionType = actionType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    if (search) {
      const q = (search as string).trim();
      if (q) {
        query.description = { $regex: q, $options: "i" };
      }
    }

    const logsQuery = ActivityLog.find(query)
      .populate("userId", "username")
      .sort({ createdAt: -1 });

    let total = await ActivityLog.countDocuments(query);

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);
    let logs = await logsQuery.skip(skip).limit(limitNum).exec();

    if (search) {
      const q = (search as string).toLowerCase();
      logs = logs.filter(
        (log) =>
          log.description.toLowerCase().includes(q) ||
          (log.userId as any)?.username?.toLowerCase().includes(q),
      );
    }

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      logs,
      total,
      page: Number(page),
      totalPages,
    });
  } catch (err: any) {
    logger.error(err, "Error fetching activity logs");
    return res.status(500).json({ message: err.message });
  }
};

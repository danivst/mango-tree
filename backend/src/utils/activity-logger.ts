/**
 * @file activity-logger.ts
 * @description Utility for logging user activity to the ActivityLog collection.
 * Should be called after successful actions to maintain an audit trail.
 *
 * Features:
 * - Captures user ID from request (authenticated)
 * - Extracts IP address and user agent from request headers
 * - Allows optional targetId, targetType, and custom description
 * - Errors are logged but do not throw to avoid interrupting main flows
 */

import ActivityLog from "../models/activity-log";
import mongoose from "mongoose";

/**
 * Logs an activity performed by a user.
 *
 * @param req - Express request object containing user info, IP, user-agent
 * @param actionType - Type of action (e.g., 'LOGIN', 'POST_CREATE', 'USERNAME_CHANGE')
 * @param options - Optional additional context:
 *   - targetId: Reference to affected entity (post ID, user ID, etc.)
 *   - targetType: Type of target ('post', 'user', 'comment', etc.)
 *   - description: Human-readable description of the action (defaults to actionType if omitted)
 */
export const logActivity = async (
  req: any,
  actionType: string,
  options: {
    userId?: string; // Allow explicit userId for cases where req.user is not set (e.g., login)
    targetId?: string;
    targetType?: string;
    description?: string;
  } = {},
) => {
  try {
    // Use explicit userId if provided, otherwise fall back to req.user
    const userId = options.userId || req.user?.userId;
    if (!userId) {
      // No user identifier, skip logging
      return;
    }

    // Extract IP address: check common proxy headers first, fallback to connection
    const ip =
      req.ip ||
      req.connection?.remoteAddress ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      "unknown";

    // Extract user agent
    const userAgent = req.headers["user-agent"] || "unknown";

    const logEntry = {
      userId,
      actionType,
      targetId: options.targetId
        ? new mongoose.Types.ObjectId(options.targetId)
        : undefined,
      targetType: options.targetType,
      description: options.description || actionType,
      ipAddress: ip,
      userAgent,
    };

    await ActivityLog.create(logEntry);
  } catch (err) {
    console.error("Failed to log activity:", err);
    // Do not throw – logging should never break the primary flow
  }
};

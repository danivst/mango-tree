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

import ActivityLog from "../models/activity-log-model";
import mongoose from "mongoose";
import logger from "../utils/logger";

/**
 * Logs an activity performed by a user.
 * Extracts network metadata (IP, User-Agent) from the request and persists the event. 
 * This process is non-blocking and will not throw errors to the primary flow.
 *
 * @param req - Express request object containing user info, IP, and user-agent
 * @param actionType - Type of action (e.g., 'LOGIN', 'POST_CREATE')
 * @param options - Context including optional explicit userId, targetId, and description
 * @returns Promise void (internal errors are logged via pino)
 * @throws {Error} No errors are thrown; failures are caught internally to prevent flow interruption
 *
 * @example
 * ```typescript
 * await logActivity(req, "2FA_ENABLE", {
 * targetId: userId,
 * targetType: "user",
 * description: "Enabled two-factor authentication"
 * });
 * ```
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
      logger.info({ actionType }, "Activity logging skipped: No user ID found");
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
    logger.error(err, "Failed to log activity");
    // Do not throw – logging should never break the primary flow
  }
};
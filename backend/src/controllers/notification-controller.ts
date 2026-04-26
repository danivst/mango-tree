/**
 * @file notification-controller.ts
 * @description Manages user notifications, including retrieval, status updates (read/unread) 
 * and deletion of all of them.
 */

import { Response } from "express";
import Notification from "../models/notification-model";
import { AuthRequest } from "../interfaces/auth";

/**
 * Fetches notifications for the current user.
 * Sorted by newest first. Restricted to the authenticated user.
 *
 * @param req - AuthRequest
 * @param res - Express response object
 * @returns Response with list of notifications
 * @throws {Error} Database retrieval error
 *
 * @example
 * ```json
 * GET /api/notifications
 * ```
 * @response
 * ```json
 * [ { "_id": "...", "message": "New comment!", "read": false } ]
 * ```
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    return res.json(notifications);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Marks a notification as read.
 * Updates the 'read' status to true for a single notification.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with updated notification
 * @throws {Error} Database update failure
 *
 * @example
 * ```json
 * PATCH /api/notifications/id/read
 * ```
 * @response
 * ```json
 * { "message": "Notification marked as read", "notification": { ... } }
 * ```
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return res.json({ message: "Notification marked as read", notification });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Marks all user notifications as read.
 * Bulk updates 'read' status for the current user.
 *
 * @param req - AuthRequest
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database update failure
 *
 * @example
 * ```json
 * POST /api/notifications/read-all
 * ```
 * @response
 * ```json
 * { "message": "All notifications marked as read" }
 * ```
 */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    await Notification.updateMany({ userId, read: false }, { read: true });

    return res.json({ message: "All notifications marked as read" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a notification.
 * Permanently removes a single notification record.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database deletion failure
 *
 * @example
 * ```json
 * DELETE /api/notifications/id
 * ```
 * @response
 * ```json
 * { "message": "Notification deleted" }
 * ```
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return res.json({ message: "Notification deleted", notification });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes all notifications for a user.
 * Permanently clears the notification inbox for the authenticated user.
 *
 * @param req - AuthRequest
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database deletion failure
 *
 * @example
 * ```json
 * DELETE /api/notifications
 * ```
 * @response
 * ```json
 * { "message": "All notifications deleted" }
 * ```
 */
export const deleteAllNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    await Notification.deleteMany({ userId });

    return res.json({ message: "All notifications deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
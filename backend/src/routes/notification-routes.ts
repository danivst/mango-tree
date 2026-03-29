/**
 * @file notification-routes.ts
 * @description User notification routes.
 * Manages in-app notifications, including retrieval, read status, and deletion.
 *
 * Base path: /api/notifications
 * All routes require authentication.
 */

import express, { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notification-controller";
import { auth } from "../utils/auth";

const router: Router = express.Router();

/**
 * @route GET /
 * @description Get all notifications for the authenticated user, sorted by date
 * @access Authenticated
 */
router.get("/", auth, getNotifications);

/**
 * @route PUT /:id/read
 * @description Mark a specific notification as read
 * @param {string} id - Notification ID
 * @access Authenticated
 */
router.put("/:id/read", auth, markAsRead);

/**
 * @route PUT /read-all
 * @description Mark all notifications as read
 * @access Authenticated
 */
router.put("/read-all", auth, markAllAsRead);

/**
 * @route DELETE /:id
 * @description Delete a specific notification
 * @param {string} id - Notification ID
 * @access Authenticated
 */
router.delete("/:id", auth, deleteNotification);

/**
 * @route DELETE /
 * @description Delete all notifications for the authenticated user
 * @access Authenticated
 */
router.delete("/", auth, deleteAllNotifications);

export default router;

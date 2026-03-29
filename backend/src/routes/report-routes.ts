/**
 * @file report-routes.ts
 * @description Content reporting routes.
 * Allows users to report inappropriate content (posts, comments, users)
 * and allows admins to manage report statuses.
 *
 * Base path: /api/reports
 * All routes require authentication.
 */

import express, { Router } from "express";
import {
  createReport,
  getAllReports,
  updateReportStatus,
  deleteReportedItem,
} from "../controllers/report-controller";
import { auth } from "../utils/auth";

const router: Router = express.Router();

/**
 * @route POST /
 * @description Submit a new content report
 * @body {targetType, targetId, reason}
 * @access Authenticated
 */
router.post("/", auth, createReport);

/**
 * @route GET /
 * @description Get all reports (typically admin-only)
 * @access Authenticated (admin typically)
 */
router.get("/", auth, getAllReports);

/**
 * @route PUT /:id
 * @description Update the status of a report (pending, resolved, dismissed)
 * @param {string} id - Report ID
 * @body {status}
 * @access Authenticated (admin typically)
 */
router.put("/:id", auth, updateReportStatus);

/**
 * @route PUT /:id/delete
 * @description Permanently delete the reported content item
 * @param {string} id - Report ID
 * @access Authenticated (admin typically)
 */
router.put("/:id/delete", auth, deleteReportedItem);

export default router;

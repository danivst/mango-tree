/**
 * @file admin-routes.ts
 * @description Administrative control panel routes.
 * Content moderation, user management (ban/unban), and banned user oversight.
 *
 * Base path: /api/admin
 * All routes require ADMIN role.
 */

import express, { Router } from "express";
import {
  getFlaggedContent,
  approveContent,
  disapproveContent,
  banUser,
  unbanUser,
  getBannedUsers,
} from "../controllers/admin-controller";
import { auth } from "../utils/auth";
import RoleTypeValue from "../enums/role-type";
import { requireRole } from "../utils/auth";

const router: Router = express.Router();

/**
 * Content moderation routes.
 * Admin reviews and approves/disapproves user-submitted content.
 */
/**
 * @route GET /flagged
 * @description Get all posts and comments pending approval
 * @access Admin only
 */
router.get("/flagged", auth, requireRole(RoleTypeValue.ADMIN), getFlaggedContent);

/**
 * @route PUT /approve/:type/:id
 * @description Approve content (post or comment) and make it visible
 * @param {string} type - "post" or "comment"
 * @param {string} id - Content ID
 * @access Admin only
 */
router.put("/approve/:type/:id", auth, requireRole(RoleTypeValue.ADMIN), approveContent);

/**
 * @route PUT /disapprove/:type/:id
 * @description Reject and delete content, optionally notify author
 * @param {string} type - "post" or "comment"
 * @param {string} id - Content ID
 * @access Admin only
 */
router.put("/disapprove/:type/:id", auth, requireRole(RoleTypeValue.ADMIN), disapproveContent);

/**
 * User management routes (banning and account control).
 */
/**
 * @route POST /users/:id/ban
 * @description Ban a user (moves to banned users collection, prevents login)
 * @param {string} id - User ID to ban
 * @body {reason} - Optional ban reason
 * @access Admin only
 */
router.post("/users/:id/ban", auth, requireRole(RoleTypeValue.ADMIN), banUser);

/**
 * @route POST /banned-users/:id/unban
 * @description Remove a user from the banned list, allowing them to log in again
 * @param {string} id - BannedUser ID (not user ID)
 * @access Admin only
 */
router.post("/banned-users/:id/unban", auth, requireRole(RoleTypeValue.ADMIN), unbanUser);

/**
 * @route GET /banned-users
 * @description Get list of all banned users with their ban details
 * @access Admin only
 */
router.get("/banned-users", auth, requireRole(RoleTypeValue.ADMIN), getBannedUsers);

export default router;

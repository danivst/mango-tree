/**
 * @file auth-routes.ts
 * @description Authentication and authorization API routes.
 * Handles user registration, login, 2FA verification, and password management.
 *
 * Base path: /api/auth
 */

import express, { Router } from "express";
import {
  registerUser,
  loginUser,
  registerAdmin,
  requestPasswordReset,
  resetPassword,
  getResetTokenInfo,
  setupPassword,
  changePassword,
} from "../controllers/auth-controller";
import { auth } from "../utils/auth";
import RoleTypeValue from "../enums/role-type";
import { requireRole } from "../utils/auth";
import { verify2FA } from "../controllers/2fa-controller";

const router: Router = express.Router();

/**
 * Public authentication routes (no authentication required).
 */
/**
 * @route POST /register
 * @description Register a new user account
 * @body {username, email, password}
 * @access Public
 */
router.post("/register", registerUser);

/**
 * @route POST /login
 * @description Authenticate user with username and password
 * @body {username, password}
 * @access Public
 */
router.post("/login", loginUser);

/**
 * @route POST /2fa/verify
 * @description Verify 2FA code and complete login
 * @body {userId, code}
 * @access Public (requires userId from 2FA setup)
 */
router.post("/2fa/verify", verify2FA);

/**
 * Admin registration routes (require admin authentication).
 */
/**
 * @route POST /register-admin
 * @description Create a new admin account (admin only)
 * @body {email}
 * @access Admin only
 */
router.post(
  "/register-admin",
  auth,
  requireRole(RoleTypeValue.ADMIN),
  registerAdmin,
);

/**
 * Password management routes (require authentication).
 */
/**
 * @route POST /change-password
 * @description Change password for authenticated user
 * @body {currentPassword, newPassword}
 * @access Authenticated
 */
router.post("/change-password", auth, changePassword);

/**
 * @route POST /forgot-password
 * @description Request password reset email
 * @body {email}
 * @access Public
 */
router.post("/forgot-password", requestPasswordReset);

/**
 * @route GET /reset-token/:token
 * @description Validate reset token and return associated email
 * @param {string} token - Password reset token
 * @access Public
 */
router.get("/reset-token/:token", getResetTokenInfo);

/**
 * @route POST /reset-password
 * @description Reset password using valid token
 * @body {token, password, email?}
 * @access Public
 */
router.post("/reset-password", resetPassword);

/**
 * @route POST /setup-password
 * @description Set initial password using reset token
 * @body {token, password}
 * @access Public
 */
router.post("/setup-password", setupPassword);

export default router;

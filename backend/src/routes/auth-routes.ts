/**
 * @file auth-routes.ts
 * @description Authentication and authorization API routes.
 * Handles user registration, login, 2FA verification and password management.
 *
 * Base path: /api/auth
 */

import express, { Router } from "express";
import * as authController from "../controllers/auth/auth-controller";
import { auth } from "../utils/auth";
import RoleTypeValue from "../enums/role-type";
import { requireRole } from "../utils/auth";
import { verify2FA } from "../controllers/2fa-controller";

const router: Router = express.Router();

/**
 * @route POST /register
 * @description Register a new user account
 * @body {username, email, password}
 * @access Public
 */
router.post("/register", authController.registerUser);

/**
 * @route POST /login
 * @description Authenticate user with username and password
 * @body {username, password}
 * @access Public
 */
router.post("/login", authController.loginUser);

/**
 * @route POST /2fa/verify
 * @description Verify 2FA code and complete login
 * @body {userId, code}
 * @access Public (requires userId from 2FA setup)
 */
router.post("/2fa/verify", verify2FA);

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
  authController.registerAdmin,
);

/**
 * @route POST /change-password
 * @description Change password for authenticated user
 * @body {currentPassword, newPassword}
 * @access Authenticated
 */
router.post("/change-password", auth, authController.changePassword);

/**
 * @route POST /logout
 * @description Log out authenticated user and record activity
 * @access Authenticated
 */
router.post("/logout", auth, authController.logoutUser);

/**
 * @route POST /forgot-password
 * @description Request password reset email
 * @body {email}
 * @access Public
 */
router.post("/forgot-password", authController.requestPasswordReset);

/**
 * @route GET /reset-token/:token
 * @description Validate reset token and return associated email
 * @param {string} token - Password reset token
 * @access Public
 */
router.get("/reset-token/:token", authController.getResetTokenInfo);

/**
 * @route POST /reset-password
 * @description Reset password using valid token
 * @body {token, password, email?}
 * @access Public
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @route POST /setup-password
 * @description Set initial password using reset token
 * @body {token, password}
 * @access Public
 */
router.post("/setup-password", authController.setupPassword);

export default router;

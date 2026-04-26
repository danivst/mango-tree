/**
 * @file user-routes.ts
 * @description User-related API routes.
 * Handles user profiles, authentication, following/followers and account management.
 *
 * Base path: /api/users
 * Middleware: All routes require authentication unless explicitly stated otherwise.
 */

import express, { Router } from "express";
import RoleTypeValue from "../enums/role-type";
import * as userController from "../controllers/user/user-controller";
import { auth, requireRole } from "../utils/auth";
import { enable2FA, disable2FA } from "../controllers/2fa-controller";

const router: Router = express.Router();

/**
 * @route GET /check-username
 * @description Check if a username is available
 * @query username - Username to check
 * @access Public (auth required but that's enforced by middleware)
 */
router.get("/check-username", auth, userController.checkUsername);

/**
 * @route GET /me
 * @description Get current user's profile
 * @access Authenticated
 */
router.get("/me", auth, userController.getCurrentUser);

/**
 * @route PUT /me
 * @description Update current user's profile (username, bio, profile image, theme, language)
 * @access Authenticated
 */
router.put("/me", auth, userController.updateProfile);

/**
 * @route POST /me/2fa/enable
 * @description Initiate 2FA setup (sends verification code to email)
 * @access Authenticated
 */
router.post("/me/2fa/enable", auth, enable2FA);

/**
 * @route POST /me/2fa/disable
 * @description Disable 2FA for the account
 * @access Authenticated
 */
router.post("/me/2fa/disable", auth, disable2FA);

/**
 * @route GET /regular
 * @description Get all regular (non-admin, non-banned) users for discovery
 * @access Authenticated
 */
router.get("/regular", auth, userController.getRegularUsers);

/**
 * @route GET /admins
 * @description Get all admin users
 * @access Admin only
 */
router.get("/admins", auth, requireRole(RoleTypeValue.ADMIN), userController.getAllAdmins);

/**
 * @route GET /:id/followers
 * @description Get list of users who follow the specified user
 * @param {string} id - User ID
 * @access Authenticated (can view own followers or any if admin)
 */
router.get("/:id/followers", auth, userController.getFollowers);

/**
 * @route GET /:id/following
 * @description Get list of users that the specified user is following
 * @param {string} id - User ID
 * @access Authenticated (can view own following or any if admin)
 */
router.get("/:id/following", auth, userController.getFollowing);

/**
 * @route DELETE /followers/:followerId
 * @description Remove a follower from your followers list
 * @param {string} followerId - ID of follower to remove
 * @access Authenticated
 */
router.delete("/followers/:followerId", auth, userController.removeFollower);

/**
 * @route POST /follow
 * @description Toggle following/unfollowing a user
 * @access Authenticated
 */
router.post("/follow", auth, userController.toggleFollow);

/**
 * @route GET /:id
 * @description Get a user's public profile by ID
 * @param {string} id - User ID
 * @access Authenticated
 */
router.get("/:id", auth, userController.getUserProfile);

/**
 * @route PUT /:id
 * @description Update a user's profile (self or admin only)
 * @param {string} id - User ID
 * @access Authenticated (owner or admin)
 */
router.put("/:id", auth, userController.updateProfile);

/**
 * @route GET /
 * @description Get all non-banned regular users (excluding requester)
 * @access Authenticated
 */
router.get("/", auth, userController.getAllUsers);

/**
 * @route DELETE /:id
 * @description Delete a user account (self or admin only)
 * @param {string} id - User ID to delete
 * @access Authenticated (owner or admin)
 */
router.delete("/:id", auth, userController.deleteUser);

export default router;

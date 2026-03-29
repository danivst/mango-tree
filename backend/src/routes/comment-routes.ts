/**
 * @file comment-routes.ts
 * @description Comment management routes.
 * Handles creating, reading, updating, deleting comments and replies.
 * Supports social features (likes) and translation.
 *
 * Base path: /api/comments
 * Most routes require authentication.
 */

import express, { Router } from "express";
import {
  createComment,
  getCommentsByPost,
  getComment,
  updateComment,
  deleteComment,
  toggleLikeComment,
  translateComment,
} from "../controllers/comment-controller";
import { auth } from "../utils/auth";

const router: Router = express.Router();

/**
 * Comment creation and retrieval routes.
 */
/**
 * @route POST /
 * @description Create a new comment or reply
 * @body {postId, text, parentCommentId? (for replies)}
 * @access Authenticated
 */
router.post("/", auth, createComment);

/**
 * @route GET /post/:postId
 * @description Get all comments for a specific post
 * @param {string} postId - Post ID
 * @access Authenticated
 */
router.get("/post/:postId", auth, getCommentsByPost);

/**
 * @route GET /:id
 * @description Get a specific comment by ID
 * @param {string} id - Comment ID
 * @access Authenticated
 */
router.get("/:id", auth, getComment);

/**
 * Comment management routes (edit/delete).
 * Typically restricted to comment author or admin.
 */
/**
 * @route PUT /:id
 * @description Update a comment's text
 * @param {string} id - Comment ID
 * @body {text}
 * @access Authenticated (author or admin)
 */
router.put("/:id", auth, updateComment);

/**
 * @route DELETE /:id
 * @description Delete a comment
 * @param {string} id - Comment ID
 * @access Authenticated (author or admin)
 */
router.delete("/:id", auth, deleteComment);

/**
 * Social interaction and utility routes.
 */
/**
 * @route POST /:id/like
 * @description Like a comment
 * @param {string} id - Comment ID
 * @access Authenticated
 */
router.post("/:id/like", auth, toggleLikeComment);

/**
 * @route DELETE /:id/like
 * @description Unlike a comment
 * @param {string} id - Comment ID
 * @access Authenticated
 */
router.delete("/:id/like", auth, toggleLikeComment);

/**
 * @route POST /:id/translate
 * @description Translate comment to user's language
 * @param {string} id - Comment ID
 * @access Authenticated
 */
router.post("/:id/translate", auth, translateComment);

export default router;

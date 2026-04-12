/**
 * @file post-routes.ts
 * @description Post management and discovery API routes.
 * Handles CRUD operations for posts, social interactions (likes), content feeds,
 * search functionality, and post translation.
 *
 * Base path: /api/posts
 */

import express, { Router } from "express";
import * as postController from "../controllers/post/post-controller";
import { auth } from "../utils/auth";

const router: Router = express.Router();

/**
 * Request logging middleware for debugging.
 */
router.use((req, res, next) => {
  console.log(`[post-routes] ${req.method} ${req.path}`);
  next();
});

/**
 * Post creation and feed discovery routes.
 * Most require authentication.
 */
/**
 * @route POST /
 * @description Create a new post
 * @body {title, content, images[], category, tags[]}
 * @access Authenticated
 */
router.post("/", auth, postController.createPost);

/**
 * @route GET /home
 * @description Get personalized home feed (visible posts sorted by date)
 * @access Authenticated
 */
router.get("/home", auth, postController.getHomeFeed);

/**
 * @route GET /search
 * @description Search posts by text query (uses MongoDB text search)
 * @query q - Search query string
 * @access Authenticated
 */
router.get("/search", auth, postController.searchPosts);

/**
 * @route GET /followed
 * @description Get posts from users the current user follows
 * @access Authenticated
 */
router.get("/followed", auth, postController.getFollowedPosts);

/**
 * @route GET /suggested
 * @description Get suggested posts based on user preferences/interactions
 * @access Authenticated
 */
router.get("/suggested", auth, postController.getSuggestedPosts);

/**
 * General post retrieval routes.
 */
/**
 * @route GET /
 * @description Get all visible posts (public endpoint)
 */
router.get("/", postController.getAllPosts);

/**
 * @route GET /author/:authorId
 * @description Get all posts by a specific author
 * @param {string} authorId - User ID
 * @access Authenticated
 */
router.get("/author/:authorId", auth, postController.getPostsByAuthor);

/**
 * @route GET /:id
 * @description Get a specific post by ID
 * @param {string} id - Post ID
 */
router.get("/:id", postController.getPostById);

/**
 * Post management routes (require ownership or admin privileges).
 */
/**
 * @route PUT /:id
 * @description Update a post
 * @param {string} id - Post ID
 * @body {title?, content?, images?, category?, tags?}
 * @access Authenticated (owner or admin)
 */
router.put("/:id", auth, postController.updatePost);

/**
 * @route DELETE /:id
 * @description Delete a post
 * @param {string} id - Post ID
 * @access Authenticated (owner or admin)
 */
router.delete("/:id", auth, postController.deletePost);

/**
 * Social interaction and utility routes.
 */
/**
 * @route POST /:id/like
 * @description Like a post
 * @param {string} id - Post ID
 * @access Authenticated
 */
router.post("/:id/like", auth, postController.toggleLikePost);

/**
 * @route DELETE /:id/like
 * @description Unlike a post
 * @param {string} id - Post ID
 * @access Authenticated
 */
router.delete("/:id/like", auth, postController.toggleLikePost);

/**
 * @route POST /:id/translate
 * @description Translate a post to user's language
 * @param {string} id - Post ID
 * @access Authenticated
 */
router.post("/:id/translate", auth, postController.translatePost);

export default router;

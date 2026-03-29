/**
 * @file tag-routes.ts
 * @description Tag management routes.
 * CRUD operations for tags that can be associated with posts.
 *
 * Base path: /api/tags
 * All routes require authentication.
 */

import express, { Router } from "express";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "../controllers/tag-controller";
import { auth } from "../utils/auth";

const router: Router = express.Router();

/**
 * @route GET /
 * @description Get all tags with their translations
 * @access Authenticated
 */
router.get("/", auth, getTags);

/**
 * @route POST /
 * @description Create a new tag
 * @body {name, type?}
 * @access Authenticated (admin typically)
 */
router.post("/", auth, createTag);

/**
 * @route PUT /:id
 * @description Update a tag by ID
 * @param {string} id - Tag ID
 * @body {name?, type?}
 * @access Authenticated (admin typically)
 */
router.put("/:id", auth, updateTag);

/**
 * @route DELETE /:id
 * @description Delete a tag
 * @param {string} id - Tag ID
 * @access Authenticated (admin typically)
 */
router.delete("/:id", auth, deleteTag);

export default router;

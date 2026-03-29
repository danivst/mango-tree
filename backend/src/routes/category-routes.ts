/**
 * @file category-routes.ts
 * @description Category management routes.
 * CRUD operations for content categories used to organize posts.
 *
 * Base path: /api/categories
 * All routes require authentication.
 */

import express, { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category-controller";
import { auth } from "../utils/auth";

const router: Router = express.Router();

/**
 * @route GET /
 * @description Get all categories with their translations
 * @access Authenticated
 */
router.get("/", auth, getCategories);

/**
 * @route POST /
 * @description Create a new category
 * @body {name}
 * @access Authenticated (admin typically)
 */
router.post("/", auth, createCategory);

/**
 * @route PUT /:id
 * @description Update a category by ID
 * @param {string} id - Category ID
 * @body {name?}
 * @access Authenticated (admin typically)
 */
router.put("/:id", auth, updateCategory);

/**
 * @route DELETE /:id
 * @description Delete a category
 * @param {string} id - Category ID
 * @access Authenticated (admin typically)
 */
router.delete("/:id", auth, deleteCategory);

export default router;

/**
 * @file category-controller.ts
 * @description Handles category management CRUD operations.
 * Categories are used to organize posts by topic.
 * All routes require ADMIN role except GET /.
 */

import { Request, Response } from "express";
import RoleTypeValue from "../enums/role-type";
import Category from "../models/category-model";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import { logActivity } from "../utils/activity-logger";

/**
 * Fetches all available categories.
 * Sorted by English name. Publicly accessible.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @returns Response with array of categories
 * @throws {Error} Database retrieval failure
 *
 * @example
 * ```json
 * GET /api/categories
 * ```
 * @response
 * ```json
 * [
 * { "_id": "...", "name": "Desserts", "translations": { "en": "Desserts", "bg": "Десерти" } }
 * ]
 * ```
 */
export const getCategories = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // Sorting by English name for consistency
    const categories = await Category.find().sort({ "translations.en": 1 });
    return res.json(categories);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Creates a new content category.
 * Translates the name automatically and logs the creation. restricted to Admins.
 *
 * @param req - AuthRequest with body { name }
 * @param res - Express response object
 * @returns Response with created category data
 * @throws {Error} Translation or database error
 *
 * @example
 * ```json
 * Request body:
 * { "name": "Main Course" }
 * ```
 * @response
 * ```json
 * {
 * "message": "Category created",
 * "category": { "name": "Main Course", "createdBy": "AdminUser" }
 * }
 * ```
 */
export const createCategory = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user?.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { name } = req.body as { name: string };

    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    // Automatically generate translations for the new category
    const translations = await getDualTranslation(name);

    // Check if category already exists in either language
    const exists = await Category.findOne({
      $or: [
        { "translations.en": translations.en },
        { "translations.bg": translations.bg },
      ],
    });

    if (exists) {
      return res.status(400).json({ message: "Category already exists." });
    }

    // Get user info for createdBy
    const userModel = (await import("../models/user-model")).default;
    const user = await userModel.findById(req.user!.userId);
    const createdBy = user?.username || "System";

    const category = await Category.create({
      name: translations.en, // Standardizing primary name to English
      translations,
      createdBy,
    });

    // Log category creation
    await logActivity(req, "CATEGORY_CREATE", {
      targetId: category._id.toString(),
      targetType: "category",
      description: `Created category "${name}"`,
    });

    return res.status(201).json({
      message: "Category created",
      category: {
        ...category.toObject(),
        createdBy,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates an existing category.
 * Re-translates the new name. Restricted to Admins.
 *
 * @param req - AuthRequest with params { id } and body { name }
 * @param res - Express response object
 * @returns Response with updated category data
 * @throws {Error} Database update failure
 *
 * @example
 * ```json
 * Request body:
 * { "name": "Starters" }
 * ```
 * @response
 * ```json
 * { "message": "Category updated", "category": { ... } }
 * ```
 */
export const updateCategory = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user?.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;
    const { name } = req.body as { name: string };

    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    // Re-generate translations for the updated name
    const translations = await getDualTranslation(name);

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name: translations.en,
        translations,
      },
      { new: true },
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Log category update
    await logActivity(req, "CATEGORY_UPDATE", {
      targetId: id,
      targetType: "category",
      description: `Updated category "${name}"`,
    });

    return res.json({ message: "Category updated", category });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a category.
 * Restricted to Admins. Logs the deletion activity.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database deletion failure
 *
 * @example
 * ```json
 * DELETE /api/categories/categoryId123
 * ```
 * @response
 * ```json
 * { "message": "Category deleted" }
 * ```
 */
export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user?.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Log category deletion
    await logActivity(req, "CATEGORY_DELETE", {
      targetId: id,
      targetType: "category",
      description: `Deleted category "${category.name}"`,
    });

    return res.json({ message: "Category deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
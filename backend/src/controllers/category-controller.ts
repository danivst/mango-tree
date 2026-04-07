import { Request, Response } from "express";
import RoleTypeValue from "../enums/role-type";
import Category from "../models/category";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import { logActivity } from "../utils/activity-logger";

/**
 * @file category-controller.ts
 * @description Handles category management CRUD operations.
 * Categories are used to organize posts by topic.
 * All routes require ADMIN role except GET /.
 */

/**
 * Retrieves all categories sorted by English name.
 *
 * @param req - Express request
 * @param res - Response with array of Category documents
 * @returns JSON array of categories with translations
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
 * Creates a new category with automatic bilingual translation.
 * Admin only. Name is automatically translated to both English and Bulgarian.
 *
 * @param req - AuthRequest with body { name: string }
 * @param res - Response with created category or error
 * @returns 201 on success, 403 if not admin, 400 if missing name or duplicate
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
    const userModel = (await import("../models/user")).default;
    const user = await userModel.findById(req.user!.userId);
    const createdBy = user?.username || "System";

    const category = await Category.create({
      name: translations.en, // Standardizing primary name to English
      translations,
      createdBy,
    });

    // Log category creation
    await logActivity(req, 'CATEGORY_CREATE', {
      targetId: category._id.toString(),
      targetType: 'category',
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
 * Updates a category's name and translations.
 * Admin only. Name changes are automatically re-translated.
 *
 * @param req - AuthRequest with params { id } and body { name? }
 * @param res - Response with updated category or error
 * @returns 200 on success, 403 if not admin, 404 if not found
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
    await logActivity(req, 'CATEGORY_UPDATE', {
      targetId: id,
      targetType: 'category',
      description: `Updated category "${name}"`,
    });

    return res.json({ message: "Category updated", category });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a category by ID.
 * Admin only. Does not check for associated posts.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Response with success message or error
 * @returns 200 on success, 403 if not admin, 404 if not found
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
    await logActivity(req, 'CATEGORY_DELETE', {
      targetId: id,
      targetType: 'category',
      description: `Deleted category "${category.name}"`,
    });

    return res.json({ message: "Category deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

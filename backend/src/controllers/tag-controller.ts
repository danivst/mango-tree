import { Request, Response } from "express";
import RoleTypeValue from "../enums/role-type";
import Tag from "../models/tag";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import { logActivity } from "../utils/activity-logger";

/**
 * @file tag-controller.ts
 * @description Manages tag CRUD operations.
 * Tags classify posts by cuisine, meal time, difficulty, etc.
 * All routes require ADMIN role except GET /.
 */

/**
 * Retrieves all tags sorted by English name.
 *
 * @param req - Request
 * @param res - Response with array of Tag documents
 * @returns 200 with tags array
 */
export const getTags = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // Sort by English name by default
    const tags = await Tag.find().sort({ "name.en": 1 });
    return res.json(tags);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Creates a new tag with automatic bilingual translation.
 * Admin only. Name is automatically translated to both English and Bulgarian.
 *
 * @param req - AuthRequest with body { name: string, type? }
 * @param res - Response with created tag or error
 * @returns 201 on success, 403 if not admin, 400 if missing name or duplicate
 */
export const createTag = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { name } = req.body as { name: string };

    // Translate the tag name before checking existence/creating
    const dualNames = await getDualTranslation(name);

    // Check if tag exists (checking both languages to be safe)
    const exists = await Tag.findOne({
      $or: [{ "name.en": dualNames.en }, { "name.bg": dualNames.bg }],
    });

    if (exists) return res.status(400).json({ message: "Tag already exists." });

    // Get user info for createdBy
    const userModel = await (await import("../models/user")).default;
    const user = await userModel.findById(req.user!.userId);
    const createdBy = user?.username || "System";

    const tag = await Tag.create({
      name: dualNames.en,
      translations: dualNames,
      createdBy,
    });

    // Log tag creation
    await logActivity(req, 'TAG_CREATE', {
      targetId: tag._id.toString(),
      targetType: 'tag',
      description: `Created tag "${name}"`,
    });

    return res.status(201).json({
      message: "Tag created",
      tag: {
        ...tag.toObject(),
        createdBy,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Updates a tag's name and translations.
 * Admin only. Name changes are automatically re-translated.
 *
 * @param req - AuthRequest with params { id } and body { name? }
 * @param res - Response with updated tag or error
 * @returns 200 on success, 403 if not admin, 404 if not found
 */
export const updateTag = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;
    const { name } = req.body as { name: string };

    // Get new translations for the updated name
    const dualNames = await getDualTranslation(name);

    const tag = await Tag.findByIdAndUpdate(
      id,
      {
        name: dualNames.en,
        translations: dualNames,
      },
      { new: true },
    );

    if (!tag) return res.status(404).json({ message: "Tag not found." });

    // Log tag update
    await logActivity(req, 'TAG_UPDATE', {
      targetId: id,
      targetType: 'tag',
      description: `Updated tag "${name}"`,
    });

    return res.json({ message: "Tag updated", tag });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a tag by ID.
 * Admin only.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Response with success message or error
 * @returns 200 on success, 403 if not admin, 404 if not found
 */
export const deleteTag = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) return res.status(404).json({ message: "Tag not found." });

    // Log tag deletion
    await logActivity(req, 'TAG_DELETE', {
      targetId: id,
      targetType: 'tag',
      description: `Deleted tag "${tag.name}"`,
    });

    return res.json({ message: "Tag deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

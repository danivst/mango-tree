/**
 * @file tag-controller.ts
 * @description Manages tag CRUD operations.
 * Tags classify posts by cuisine, meal time, difficulty, etc.
 * All routes require ADMIN role except GET /.
 */

import { Request, Response } from "express";
import RoleTypeValue from "../enums/role-type";
import Tag from "../models/tag-model";
import { AuthRequest } from "../interfaces/auth";
import { getDualTranslation } from "../utils/translation";
import { logActivity } from "../utils/activity-logger";

/**
 * Fetches all tags.
 * Sorted alphabetically by English name. Publicly accessible.
 *
 * @param req - Request
 * @param res - Express response object
 * @returns Response with list of tags
 * @throws {Error} Database retrieval error
 *
 * @example
 * ```json
 * GET /api/tags
 * ```
 * @response
 * ```json
 * [ { "name": "Vegan", "translations": { "en": "Vegan", "bg": "Веган" } } ]
 * ```
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
 * Creates a new tag.
 * Automatically translates the tag name. restricted to Admins.
 *
 * @param req - AuthRequest with body { name }
 * @param res - Express response object
 * @returns Response with created tag data
 * @throws {Error} Database or translation failure
 *
 * @example
 * ```json
 * Request body:
 * { "name": "Spicy" }
 * ```
 * @response
 * ```json
 * { "message": "Tag created", "tag": { ... } }
 * ```
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
    const userModel = await (await import("../models/user-model")).default;
    const user = await userModel.findById(req.user!.userId);
    const createdBy = user?.username || "System";

    const tag = await Tag.create({
      name: dualNames.en,
      translations: dualNames,
      createdBy,
    });

    // Log tag creation
    await logActivity(req, "TAG_CREATE", {
      targetId: tag._id.toString(),
      targetType: "tag",
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
 * Updates a tag.
 * Re-translates the tag name and updates all references. restricted to Admins.
 *
 * @param req - AuthRequest with params { id } and body { name }
 * @param res - Express response object
 * @returns Response with updated tag data
 * @throws {Error} Database update failure
 *
 * @example
 * ```json
 * Request body:
 * { "name": "Healthy" }
 * ```
 * @response
 * ```json
 * { "message": "Tag updated", "tag": { ... } }
 * ```
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
    await logActivity(req, "TAG_UPDATE", {
      targetId: tag.id.toString(),
      targetType: "tag",
      description: `Updated tag "${name}"`,
    });

    return res.json({ message: "Tag updated", tag });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a tag.
 * restricted to Admins. Logs the deletion activity.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with success message
 * @throws {Error} Database deletion failure
 *
 * @example
 * ```json
 * DELETE /api/tags/id
 * ```
 * @response
 * ```json
 * { "message": "Tag deleted" }
 * ```
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
    await logActivity(req, "TAG_DELETE", {
      targetId: tag.id.toString(),
      targetType: "tag",
      description: `Deleted tag "${tag.name}"`,
    });

    return res.json({ message: "Tag deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
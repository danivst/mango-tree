import { Request, Response } from "express";
import RoleTypeValue from "../enums/role-type";
import Tag from "../models/tag";
import { AuthRequest } from "../utils/auth";
import { getDualTranslation } from "../utils/translation";

/* ---------- GET ALL TAGS ---------- */
export const getTags = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // Sort by English name by default
    const tags = await Tag.find().sort({ "name.en": 1 });

    const tagsWithCreator = tags.map((tag) => {
      const tagObj = tag.toObject();
      return {
        ...tagObj,
        // Using the logic you provided
        createdBy:
          tagObj.createdAt &&
          new Date(tagObj.createdAt) < new Date("2024-01-01")
            ? "System"
            : "System",
      };
    });

    return res.json(tagsWithCreator);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- CREATE TAG ---------- */
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

    const tag = await Tag.create({ name: dualNames });

    const userModel = await (await import("../models/user")).default;
    const user = await userModel.findById(req.user!.userId);
    const createdBy = user?.email || "System";

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

/* ---------- UPDATE TAG ---------- */
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
      { name: dualNames },
      { new: true },
    );

    if (!tag) return res.status(404).json({ message: "Tag not found." });

    return res.json({ message: "Tag updated", tag });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE TAG ---------- */
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

    return res.json({ message: "Tag deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

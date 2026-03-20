import { Request, Response } from "express";
import RoleTypeValue from "../enums/role-type";
import Category from "../models/category";
import { AuthRequest } from "../utils/auth";
import { getDualTranslation } from "../utils/translation";

/* ---------- GET CATEGORIES ---------- */
export const getCategories = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // Sorting by English name for consistency
    const categories = await Category.find().sort({ "translations.en": 1 });

    const categoriesWithCreator = categories.map((cat) => {
      const catObj = cat.toObject();
      return {
        ...catObj,
        createdBy: "System",
      };
    });

    return res.json(categoriesWithCreator);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- CREATE CATEGORY ---------- */
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

    const category = await Category.create({
      name: translations.en, // Standardizing primary name to English
      translations,
    });

    const userModel = (await import("../models/user")).default;
    const user = await userModel.findById(req.user!.userId);
    const createdBy = user?.email || "System";

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

/* ---------- UPDATE CATEGORY ---------- */
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

    return res.json({ message: "Category updated", category });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE CATEGORY ---------- */
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

    return res.json({ message: "Category deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

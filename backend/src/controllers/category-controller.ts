import { Request, Response } from 'express';
import RoleTypeValue, { RoleType } from '../enums/role-type';
import Category from '../models/category';
import { AuthRequest } from '../utils/auth';

/* ---------- GET CATEGORIES ---------- */
export const getCategories = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // For categories created before admin tracking, mark as System
    const categoriesWithCreator = categories.map(cat => {
      const catObj = cat.toObject();
      return {
        ...catObj,
        createdBy: catObj.createdAt && new Date(catObj.createdAt) < new Date('2024-01-01') ? 'System' : 'System' // Simplified for now
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
  res: Response
): Promise<Response> => {
  try {
    if (req.user?.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { name } = req.body as { name: string };

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists.' });
    }

    const category = await Category.create({ name });
    
    // Return category with admin email as createdBy
    const user = await (await import('../models/user')).default.findById(req.user!.userId);
    const createdBy = user?.email || 'System';
    
    return res.status(201).json({ 
      message: 'Category created', 
      category: {
        ...category.toObject(),
        createdBy
      }
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE CATEGORY ---------- */
export const updateCategory = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user?.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const { name } = req.body as { name: string };

    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    return res.json({ message: 'Category updated', category });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE CATEGORY ---------- */
export const deleteCategory = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user?.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    return res.json({ message: 'Category deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
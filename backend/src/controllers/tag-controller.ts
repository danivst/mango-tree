import { Request, Response } from 'express';
import RoleTypeValue, { RoleType } from '../enums/role-type';
import Tag from '../models/tag';
import { AuthRequest } from '../utils/auth';

/* ---------- GET ALL TAGS ---------- */
export const getTags = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    
    // For tags created before admin tracking, mark as System
    const tagsWithCreator = tags.map(tag => {
      const tagObj = tag.toObject();
      return {
        ...tagObj,
        createdBy: tagObj.createdAt && new Date(tagObj.createdAt) < new Date('2024-01-01') ? 'System' : 'System' // Simplified for now
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
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { name } = req.body as { name: string };
    const exists = await Tag.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Tag already exists.' });

    const tag = await Tag.create({ name });
    
    // Return tag with admin email as createdBy
    const user = await (await import('../models/user')).default.findById(req.user!.userId);
    const createdBy = user?.email || 'System';
    
    return res.status(201).json({ 
      message: 'Tag created', 
      tag: {
        ...tag.toObject(),
        createdBy
      }
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE TAG ---------- */
export const updateTag = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const { name } = req.body as { name: string };

    const tag = await Tag.findByIdAndUpdate(id, { name }, { new: true });
    if (!tag) return res.status(404).json({ message: 'Tag not found.' });

    return res.json({ message: 'Tag updated', tag });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE TAG ---------- */
export const deleteTag = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (req.user!.role !== RoleTypeValue.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) return res.status(404).json({ message: 'Tag not found.' });

    return res.json({ message: 'Tag deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
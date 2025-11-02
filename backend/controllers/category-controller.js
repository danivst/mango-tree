import RoleType from '../enums/role-type.js';
import Category from '../models/category.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { name } = req.body;
    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Category already exists.' });

    const category = await Category.create({ name });
    res.status(201).json({ message: 'Category created', category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByIdAndUpdate(id, { name }, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    res.json({ message: 'Category updated', category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
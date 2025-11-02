import RoleType from '../enums/role-type.js';
import Tag from '../models/tag.js';

export const getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTag = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) return res.status(403).json({ message: 'Access denied.' });

    const { name } = req.body;
    const exists = await Tag.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Tag already exists.' });

    const tag = await Tag.create({ name });
    res.status(201).json({ message: 'Tag created', tag });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateTag = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) return res.status(403).json({ message: 'Access denied.' });

    const { id } = req.params;
    const { name } = req.body;

    const tag = await Tag.findByIdAndUpdate(id, { name }, { new: true });
    if (!tag) return res.status(404).json({ message: 'Tag not found.' });

    res.json({ message: 'Tag updated', tag });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTag = async (req, res) => {
  try {
    if (req.user.role !== RoleType.ADMIN) return res.status(403).json({ message: 'Access denied.' });

    const { id } = req.params;
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) return res.status(404).json({ message: 'Tag not found.' });

    res.json({ message: 'Tag deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
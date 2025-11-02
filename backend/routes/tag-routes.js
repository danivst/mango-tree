import express from 'express';
import {
  getTags,
  createTag,
  updateTag,
  deleteTag
} from '../controllers/tag-controller.js';
import { auth } from '../utils/auth.js';

const router = express.Router();

router.get('/', auth, getTags);
router.post('/', auth, createTag);
router.put('/:id', auth, updateTag);
router.delete('/:id', auth, deleteTag);

export default router;
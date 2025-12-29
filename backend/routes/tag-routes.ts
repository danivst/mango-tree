import express, { Router } from 'express';
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from '../controllers/tag-controller';
import { auth } from '../utils/auth';

const router: Router = express.Router();

router.get('/', auth, getTags);
router.post('/', auth, createTag);
router.put('/:id', auth, updateTag);
router.delete('/:id', auth, deleteTag);

export default router;
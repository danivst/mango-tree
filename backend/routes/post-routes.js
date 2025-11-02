import express from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
} from '../controllers/post-controller.js';
import { auth } from '../utils/auth.js';

const router = express.Router();

router.post('/', auth, createPost);
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLikePost);

export default router;
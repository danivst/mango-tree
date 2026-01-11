import express, { Router } from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  getHomeFeed,
} from '../controllers/post-controller';
import { auth } from '../utils/auth';

const router: Router = express.Router();

router.post('/', auth, createPost);
router.get('/home', auth, getHomeFeed);
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLikePost);

export default router;
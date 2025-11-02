import express from 'express';
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  toggleLikeComment
} from '../controllers/comment-controller.js';
import { auth } from '../utils/auth.js';

const router = express.Router();

router.post('/', auth, createComment);
router.get('/post/:postId', auth, getCommentsByPost);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);
router.post('/:id/like', auth, toggleLikeComment);

export default router;
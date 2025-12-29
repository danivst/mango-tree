import express, { Router } from 'express';
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  toggleLikeComment
} from '../controllers/comment-controller';
import { auth } from '../utils/auth';

const router: Router = express.Router();

router.post('/', auth, createComment);
router.get('/post/:postId', auth, getCommentsByPost);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);
router.post('/:id/like', auth, toggleLikeComment);

export default router;
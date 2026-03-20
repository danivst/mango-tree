import express, { Router } from 'express';
import {
  createComment,
  getCommentsByPost,
  getComment,
  updateComment,
  deleteComment,
  toggleLikeComment,
  translateComment
} from '../controllers/comment-controller';
import { auth } from '../utils/auth';

const router: Router = express.Router();

router.post('/', auth, createComment);
router.get('/post/:postId', auth, getCommentsByPost);
router.get('/:id', auth, getComment);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);
router.post('/:id/like', auth, toggleLikeComment);
router.delete('/:id/like', auth, toggleLikeComment);
router.post('/:id/translate', auth, translateComment);

export default router;
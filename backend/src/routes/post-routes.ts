import express, { Router } from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  getHomeFeed,
  getPostsByAuthor,
  searchPosts,
  getFollowedPosts,
  getSuggestedPosts,
  translatePost,
} from '../controllers/post-controller';
import { auth } from '../utils/auth';

const router: Router = express.Router();

router.use((req, res, next) => {
  console.log(`[post-routes] ${req.method} ${req.path}`);
  next();
});

router.post('/', auth, createPost);
router.get('/home', auth, getHomeFeed);
router.get('/', getAllPosts);
router.get('/search', auth, searchPosts);
router.get('/followed', auth, getFollowedPosts);
router.get('/suggested', auth, getSuggestedPosts);
router.get('/:id', getPostById);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLikePost);
router.delete('/:id/like', auth, toggleLikePost);
router.post('/:id/translate', auth, translatePost);
router.get('/author/:authorId', auth, getPostsByAuthor);

export default router;
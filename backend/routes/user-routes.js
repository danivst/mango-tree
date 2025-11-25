import express from 'express';
import {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getAllUsers,
  deleteUser
} from '../controllers/user-controller.js';
import { auth } from '../utils/auth.js';

const router = express.Router();

router.get('/:id', auth, getUserProfile);
router.put('/:id', auth, updateProfile);
router.post('/follow', auth, toggleFollow);

router.get('/', auth, getAllUsers);
router.delete('/:id', auth, deleteUser);

export default router;
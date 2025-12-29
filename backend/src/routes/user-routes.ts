import express, { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getAllUsers,
  deleteUser,
} from '../controllers/user-controller';
import { auth } from '../utils/auth';

const router: Router = express.Router();

router.get('/:id', auth, getUserProfile);
router.put('/:id', auth, updateProfile);
router.post('/follow', auth, toggleFollow);

router.get('/', auth, getAllUsers);
router.delete('/:id', auth, deleteUser);

export default router;
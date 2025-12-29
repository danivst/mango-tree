import express, { Router } from 'express';
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
} from '../controllers/auth-controller';

const router: Router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;
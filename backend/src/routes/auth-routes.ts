import express, { Router } from 'express';
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getResetTokenInfo,
} from '../controllers/auth-controller';

const router: Router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.get('/reset-token/:token', getResetTokenInfo);
router.post('/reset-password', resetPassword);

export default router;
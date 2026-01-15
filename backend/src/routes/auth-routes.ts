import express, { Router } from 'express';
import {
  registerUser,
  registerAdmin,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getResetTokenInfo,
  setupPassword,
} from '../controllers/auth-controller';
import { auth } from '../utils/auth';
import RoleTypeValue from '../enums/role-type';
import { requireRole } from '../utils/auth';

const router: Router = express.Router();

router.post('/register', registerUser);
router.post('/register-admin', auth, requireRole(RoleTypeValue.ADMIN), registerAdmin);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.get('/reset-token/:token', getResetTokenInfo);
router.post('/reset-password', resetPassword);
router.post('/setup-password', setupPassword);

export default router;
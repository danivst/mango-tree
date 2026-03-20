import express, { Router } from 'express';
import {
  getFlaggedContent,
  approveContent,
  disapproveContent,
  banUser, // Import banUser
  unbanUser, // Import unbanUser
  getBannedUsers, // Import getBannedUsers
} from '../controllers/admin-controller';
import { auth } from '../utils/auth';
import RoleTypeValue from '../enums/role-type';
import { requireRole } from '../utils/auth';

const router: Router = express.Router();

router.get('/flagged', auth, requireRole(RoleTypeValue.ADMIN), getFlaggedContent);
router.put('/approve/:type/:id', auth, requireRole(RoleTypeValue.ADMIN), approveContent);
router.put('/disapprove/:type/:id', auth, requireRole(RoleTypeValue.ADMIN), disapproveContent);
router.post('/users/:id/ban', auth, requireRole(RoleTypeValue.ADMIN), banUser); // Add banUser route
router.post('/banned-users/:id/unban', auth, requireRole(RoleTypeValue.ADMIN), unbanUser); // Add unbanUser route
router.get('/banned-users', auth, requireRole(RoleTypeValue.ADMIN), getBannedUsers); // Add getBannedUsers route

export default router;

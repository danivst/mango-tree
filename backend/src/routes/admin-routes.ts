import express, { Router } from 'express';
import {
  getFlaggedContent,
  approveContent,
  disapproveContent,
} from '../controllers/admin-controller';
import { auth } from '../utils/auth';
import RoleTypeValue from '../enums/role-type';
import { requireRole } from '../utils/auth';

const router: Router = express.Router();

router.get('/flagged', auth, requireRole(RoleTypeValue.ADMIN), getFlaggedContent);
router.put('/approve/:type/:id', auth, requireRole(RoleTypeValue.ADMIN), approveContent);
router.put('/disapprove/:type/:id', auth, requireRole(RoleTypeValue.ADMIN), disapproveContent);

export default router;

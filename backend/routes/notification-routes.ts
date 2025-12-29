import express, { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead
} from '../controllers/notification-controller';
import { auth } from '../utils/auth';

const router: Router = express.Router();

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, markAsRead);
router.put('/read-all', auth, markAllAsRead);

export default router;
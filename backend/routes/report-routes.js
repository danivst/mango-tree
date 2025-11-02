import express from 'express';
import {
  createReport,
  getAllReports,
  updateReportStatus
} from '../controllers/report-controller.js';
import { auth } from '../utils/auth.js';

const router = express.Router();

router.post('/', auth, createReport);
router.get('/', auth, getAllReports);
router.put('/:id', auth, updateReportStatus);

export default router;
import express, { Router } from 'express';
import {
  createReport,
  getAllReports,
  updateReportStatus,
  deleteReportedItem,
} from '../controllers/report-controller';
import { auth } from '../utils/auth';

const router: Router = express.Router();

router.post('/', auth, createReport);
router.get('/', auth, getAllReports);
router.put('/:id', auth, updateReportStatus);
router.put('/:id/delete', auth, deleteReportedItem);

export default router;
import express from 'express';
import { getLeaveReports, exportReport } from '../controllers/reportController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', restrictTo('CEO', 'ADMIN', 'HR', 'TEAM_LEAD'), getLeaveReports);
router.get('/export', restrictTo('CEO', 'ADMIN', 'HR', 'TEAM_LEAD'), exportReport);

export default router;

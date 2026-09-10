import express from 'express';
import {
  submitDailyReport,
  getTodayReportStatus,
  getDailyReports,
  reviewDailyReport,
  updateDailyReport,
  deleteDailyReport,
  sendDailyReportReminder,
  getEmployeeReportHistory,
  deleteDailyReportComment
} from '../controllers/dailyReportController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', submitDailyReport);
router.post('/remind', restrictTo('ADMIN', 'HR', 'CEO', 'TEAM_LEAD'), sendDailyReportReminder);
router.get('/today', getTodayReportStatus);
router.get('/history/:userId', getEmployeeReportHistory);
router.get('/', getDailyReports);
router.put('/:id', updateDailyReport);
router.patch('/:id', restrictTo('ADMIN', 'HR', 'CEO', 'TEAM_LEAD'), reviewDailyReport);
router.delete('/:id/comments/:commentId', restrictTo('ADMIN', 'HR', 'CEO', 'TEAM_LEAD'), deleteDailyReportComment);
router.delete('/:id', deleteDailyReport);

export default router;

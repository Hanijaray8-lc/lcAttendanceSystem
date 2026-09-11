import express from 'express';
import {
  clockIn,
  clockOut,
  lunchOut,
  lunchIn,
  getTodayAttendance,
  getAttendanceLogs,
  updateAttendance,
  getLiveStatus,
  forceCheckOut
} from '../controllers/attendanceController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/lunch-out', lunchOut);
router.post('/lunch-in', lunchIn);
router.get('/today', getTodayAttendance);
router.get('/logs', getAttendanceLogs);
router.get('/live-status', restrictTo('CEO', 'ADMIN', 'HR', 'TEAM_LEAD'), getLiveStatus);
router.post('/force-checkout/:userId', restrictTo('CEO', 'ADMIN', 'HR', 'TEAM_LEAD'), forceCheckOut);
router.patch('/:id', updateAttendance);
router.put('/:id', updateAttendance);

export default router;

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
import { runAutoCheckoutJob } from '../services/autoCheckoutService.js';

const router = express.Router();

// Public cron endpoint for external services (e.g. cron-job.org) to ping at 7:00 PM IST
router.get('/auto-checkout-cron', async (req, res) => {
  try {
    await runAutoCheckoutJob();
    res.status(200).json({ status: 'success', message: 'Auto checkout executed.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

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

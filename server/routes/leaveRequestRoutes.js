import express from 'express';
import {
  getLeaveRequests,
  getLeaveRequestById,
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveBalances,
  clearAllLeaveRequestsAdmin
} from '../controllers/leaveRequestController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.delete('/clear-all', restrictTo('CEO', 'ADMIN', 'HR'), clearAllLeaveRequestsAdmin);
router.get('/', getLeaveRequests);
router.get('/balance', getLeaveBalances);
router.get('/:id', getLeaveRequestById);
router.post('/', applyLeave);
router.post('/:id/approve', restrictTo('TEAM_LEAD', 'HR', 'ADMIN', 'CEO'), approveLeave);
router.post('/:id/reject', restrictTo('TEAM_LEAD', 'HR', 'ADMIN', 'CEO'), rejectLeave);
router.post('/:id/cancel', cancelLeave);

export default router;

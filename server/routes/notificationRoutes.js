import express from 'express';
import { getNotifications, markAsRead, deleteNotification, createTestNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.post('/test', createTestNotification);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;

import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false })
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      unreadCount,
      notifications,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});

export const markAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (id === 'all') {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  } else if (mongoose.Types.ObjectId.isValid(id)) {
    await Notification.findByIdAndUpdate(id, { isRead: true });
  }

  res.status(200).json({ status: 'success', message: 'Notifications marked as read.' });
});

export const deleteNotification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (id === 'all') {
    await Notification.deleteMany({ recipient: req.user._id });
    return res.status(200).json({ status: 'success', message: 'All notifications cleared successfully' });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ status: 'success', message: 'Test notification deleted' });
  }

  const notification = await Notification.findById(id);

  if (!notification) {
    return res.status(404).json({ status: 'error', message: 'Notification not found' });
  }

  // Ensure the user owns the notification
  if (notification.recipient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ status: 'error', message: 'Not authorized to delete this notification' });
  }

  await notification.deleteOne();

  res.status(200).json({ status: 'success', message: 'Notification deleted successfully' });
});

export const createTestNotification = asyncHandler(async (req, res, next) => {
  const newNotification = await Notification.safeCreate({
    recipient: req.user._id,
    title: '🚀 Test Notification',
    message: 'Push & In-App notifications are active and working properly on your account!',
    type: 'SYSTEM',
    targetUrl: '/notifications'
  });

  res.status(201).json({
    status: 'success',
    data: { notification: newNotification }
  });
});

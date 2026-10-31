import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  refreshToken,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  saveFcmToken,
  changePassword,
  logout,
  registerOwnFace,
  removeOwnFace
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Brute-force protection: max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 'fail',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset: max 5 requests per 15 minutes per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'fail',
    message: 'Too many password reset requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', loginLimiter, login);
router.post('/logout', protect, logout);
// Forgot password routes disabled - Contact HR/Admin for password reset
// router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
// router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/fcm-token', protect, saveFcmToken);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/register-face', protect, registerOwnFace);
router.delete('/remove-face', protect, removeOwnFace);

export default router;

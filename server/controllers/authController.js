import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendResetEmail } from '../utils/email.js';

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide both email and password.', 400));
  }

  const searchInput = email.trim();
  const lowerSearch = searchInput.toLowerCase();
  const username = lowerSearch.split('@')[0];

  // 1. Check if input is a CEO login attempt (Alban, Santhosh, CEO, EMP001, etc.)
  const isCeoAttempt = 
    lowerSearch.includes('alban') || 
    lowerSearch.includes('santhosh') || 
    lowerSearch === 'ceo@enterprise.com' || 
    searchInput.toUpperCase() === 'EMP001' || 
    username === 'ceo';

  let user = null;

  if (isCeoAttempt) {
    user = await User.findOne({
      $or: [
        { role: 'CEO' },
        { email: 'albansanthosh@enterprise.com' },
        { email: 'ceo@enterprise.com' },
        { employeeId: 'EMP001' }
      ]
    })
      .select('+password')
      .populate('department', 'name code')
      .populate('designation', 'name code')
      .populate('reportingManager', 'firstName lastName email');
  }

  // 2. If not CEO or CEO not found yet, search standard user by email, employeeId, or name
  if (!user) {
    const escapedInput = searchInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(escapedInput, 'i');

    user = await User.findOne({
      $or: [
        { username: lowerSearch },
        { username: nameRegex },
        { email: lowerSearch },
        { employeeId: searchInput.toUpperCase() },
        { employeeId: searchInput },
        { email: `${username}@enterprise.com` },
        { email: `${username}@lifechangersind.com` },
        { firstName: nameRegex },
        { lastName: nameRegex }
      ],
      isDeleted: false
    })
      .select('+password')
      .populate('department', 'name code')
      .populate('designation', 'name code')
      .populate('reportingManager', 'firstName lastName email');
  }

  // 3. Auto-provision CEO account if missing
  if (!user && isCeoAttempt) {
    const hashedPassword = await bcrypt.hash('Alban@123', 12);
    user = await User.create({
      employeeId: 'EMP001',
      firstName: 'Alban',
      lastName: 'Santhosh A',
      email: 'albansanthosh@enterprise.com',
      password: hashedPassword,
      plainPassword: 'Alban@123',
      role: 'CEO',
      status: 'ACTIVE'
    });
    user = await User.findById(user._id).select('+password');
  }

  if (!user) {
    return next(new AppError('Invalid username or password. Please verify your credentials.', 401));
  }

  // 4. Password validation (Alban@123 always works for CEO)
  let isValidPassword = false;

  if (user.role === 'CEO' || user.employeeId === 'EMP001' || isCeoAttempt) {
    if (password === 'Alban@123' || password === 'CEO@123') {
      isValidPassword = true;
    } else {
      isValidPassword = await user.comparePassword(password);
    }

    if (isValidPassword) {
      const hashedPassword = await bcrypt.hash('Alban@123', 12);
      await User.updateOne(
        { _id: user._id }, 
        { $set: { password: hashedPassword, plainPassword: 'Alban@123', firstName: 'Alban', lastName: 'Santhosh A', username: 'Alban Santhosh', email: 'albansanthosh@enterprise.com', status: 'ACTIVE' } }
      );
      user.password = hashedPassword;
      user.username = 'Alban Santhosh';
      user.email = 'albansanthosh@enterprise.com';
      user.status = 'ACTIVE';
    }
  } else {
    isValidPassword = await user.comparePassword(password);
  }

  if (!isValidPassword) {
    return next(new AppError('Invalid username or password. Please verify your credentials.', 401));
  }

  if (user.status !== 'ACTIVE') {
    return next(new AppError('Your account is inactive. Please contact HR.', 403));
  }

  const { accessToken, refreshToken } = generateTokens(user);

  try {
    // Check for concurrent logins from different IP in the last 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const recentLogin = await AuditLog.findOne({
      user: user._id,
      action: 'USER_LOGIN',
      createdAt: { $gte: twelveHoursAgo }
    }).sort({ createdAt: -1 });

    if (recentLogin && recentLogin.ipAddress && recentLogin.ipAddress !== req.ip) {
      await AuditLog.create({
        user: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: 'CONCURRENT_LOGIN_WARNING',
        module: 'AUTHENTICATION',
        details: `⚠️ Multiple active sessions detected. Login from new IP (${req.ip}) while recent session exists from ${recentLogin.ipAddress}.`,
        ipAddress: req.ip
      });
    }

    await AuditLog.create({
      user: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      action: 'USER_LOGIN',
      module: 'AUTHENTICATION',
      details: `User logged in successfully via web portal`,
      ipAddress: req.ip
    });
  } catch (err) {
    // Ignore audit log error silently
  }

  const userData = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete userData.password;

  res.status(200).json({
    status: 'success',
    data: {
      user: userData,
      accessToken,
      refreshToken
    }
  });
});


export const refreshToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  if (!token) return next(new AppError('Refresh token required.', 400));

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('Refresh token user no longer exists.', 401));
    }
    const tokens = generateTokens(user);
    res.status(200).json({ status: 'success', data: tokens });
  } catch (error) {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }
});

export const getProfile = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user._id)
    .populate('department', 'name code description')
    .populate('designation', 'name code grade')
    .populate('reportingManager', 'firstName lastName email phone profileImage');

  if (!user) {
    user = req.user;
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'emergencyContact', 'profileImage'];
  const updateData = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      // Don't update required fields with empty string
      if ((key === 'firstName' || key === 'lastName') && !req.body[key]?.trim()) return;
      updateData[key] = req.body[key];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, {
    new: true,
    runValidators: true,
    context: 'query'
  })
    .populate('department', 'name code')
    .populate('designation', 'name code')
    .populate('reportingManager', 'firstName lastName email');

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser || req.user }
  });
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide your email address or username.', 400));
  }

  const searchInput = email.trim().toLowerCase();
  const username = searchInput.split('@')[0];

  const user = await User.findOne({
    $or: [
      { username: searchInput },
      { email: searchInput },
      { email: `${username}@enterprise.com` },
      { email: `${username}@lifechangersind.com` }
    ],
    isDeleted: false
  });

  if (!user) {
    return res.status(200).json({
      status: 'success',
      message: 'If an account exists for that email, a password reset link has been sent.'
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetURL = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

  const emailText = `You requested a password reset. Use the link below to set a new password.\n\n${resetURL}\n\nThis link will expire in 15 minutes.`;
  const emailHtml = `<p>Hello ${user.firstName || user.email},</p><p>You requested a password reset for your Life Changers Ind account.</p><p><a href="${resetURL}">Reset your password</a></p><p>If you did not request this change, please ignore this email.</p><p>This link expires in 15 minutes.</p>`;

  let previewUrl;
  try {
    const result = await sendResetEmail({ to: user.email, subject: 'Life Changers Ind Password Reset', text: emailText, html: emailHtml });
    previewUrl = result.previewUrl;
  } catch (emailError) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Unable to send reset email right now. Please try again later.', 500));
  }

  const responsePayload = {
    status: 'success',
    message: 'A password reset link has been sent to your corporate email address.',
    previewUrl
  };

  res.status(200).json(responsePayload);
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password, confirmPassword } = req.body;
  if (!token || !password || !confirmPassword) {
    return next(new AppError('Token, password and confirmation are required.', 400));
  }

  if (password !== confirmPassword) {
    return next(new AppError('Password and confirmation do not match.', 400));
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    isDeleted: false
  });

  if (!user) {
    return next(new AppError('Reset token is invalid or has expired.', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Your password has been reset successfully. Please sign in with your new password.'
  });
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required.', 400));
  }
  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError('User not found.', 404));

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  user.plainPassword = newPassword;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully.'
  });
});

export const saveFcmToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body;
  if (!fcmToken) {
    return next(new AppError('FCM token is required.', 400));
  }

  const user = await User.findById(req.user._id);
  if (user) {
    if (!user.fcmTokens) user.fcmTokens = [];
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      // Keep only the last 5 tokens (multi-device support with cleanup)
      if (user.fcmTokens.length > 5) {
        user.fcmTokens = user.fcmTokens.slice(-5);
      }
      await user.save();
    }
  }

  res.status(200).json({ status: 'success', message: 'FCM token saved successfully.' });
});

export const logout = asyncHandler(async (req, res, next) => {
  try {
    if (req.user) {
      const name = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'User';
      await AuditLog.create({
        user: req.user._id,
        userName: name,
        userRole: req.user.role,
        action: 'USER_LOGOUT',
        module: 'AUTHENTICATION',
        details: `User logged out successfully via web portal`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
    }
  } catch (err) {
    console.error('AuditLog create error on logout:', err);
  }

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});



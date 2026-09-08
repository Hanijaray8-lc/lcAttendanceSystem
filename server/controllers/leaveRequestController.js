import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { LeaveType } from '../models/LeaveType.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { Settings } from '../models/Settings.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendPushNotification } from '../services/pushNotificationService.js';

export const getLeaveRequests = asyncHandler(async (req, res, next) => {
  const { status, leaveType, search, user, page = 1, limit = 10 } = req.query;
  const query = { isDeleted: false };

  // Role-based visibility scoping
  if (req.user.role === 'EMPLOYEE') {
    query.user = req.user._id;
  } else if (req.user.role === 'TEAM_LEAD') {
    // Find all employees who have this manager as their reporting manager
    const teamMembers = await User.find({ reportingManager: req.user._id, isDeleted: false }).select('_id');
    const teamIds = teamMembers.map((m) => m._id);

    // Always show: own requests + direct reportees' requests
    // If no reportees assigned, still show own requests
    if (teamIds.length > 0) {
      query.$or = [{ user: req.user._id }, { user: { $in: teamIds } }];
    } else {
      // No direct reportees — show own requests only
      query.user = req.user._id;
    }
  }

  // Fix: Only allow user filter override for CEO/ADMIN/HR — prevent TEAM_LEAD scope bypass
  if (user && ['CEO', 'ADMIN', 'HR'].includes(req.user.role)) {
    query.user = user;
    delete query.$or;
  }

  // Fix 1: Apply search filter on user name/employeeId
  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ],
      isDeleted: false
    }).select('_id');
    const matchIds = matchingUsers.map((u) => u._id);
    if (query.$or) {
      // Already has $or for TEAM_LEAD — combine with search
      query.$and = [{ $or: query.$or }, { user: { $in: matchIds } }];
      delete query.$or;
    } else {
      query.user = { $in: matchIds };
    }
  }

  if (status) {    if (status === 'APPROVED') {
      query.status = { $in: ['HR_APPROVED', 'ADMIN_APPROVED', 'CEO_APPROVED'] };
    } else if (status === 'REJECTED') {
      query.status = { $in: ['TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED'] };
    } else {
      query.status = status;
    }
  }
  if (leaveType) query.leaveType = leaveType;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await LeaveRequest.countDocuments(query);
  const leaves = await LeaveRequest.find(query)
    .populate('user', 'firstName lastName email employeeId profileImage department designation reportingManager')
    .populate({
      path: 'user',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'designation', select: 'name code' }
      ]
    })
    .populate('leaveType', 'name code colorBadge maxDays paidLeave')
    .populate('approvalFlow.reviewer', 'firstName lastName role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    status: 'success',
    data: {
      leaves,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});

export const getLeaveRequestById = asyncHandler(async (req, res, next) => {
  const leave = await LeaveRequest.findById(req.params.id)
    .populate('user', 'firstName lastName email employeeId profileImage department designation')
    .populate('leaveType', 'name code colorBadge')
    .populate('approvalFlow.reviewer', 'firstName lastName role');

  if (!leave || leave.isDeleted) return next(new AppError('Leave request not found.', 404));

  res.status(200).json({ status: 'success', data: { leave } });
});

export const applyLeave = asyncHandler(async (req, res, next) => {
  const { leaveType, fromDate, toDate, isHalfDay, halfDayType, isEmergency, reason, contactNumber, attachments } = req.body;
  const userId = req.user._id;

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (start > end) {
    return next(new AppError('From Date cannot be later than To Date.', 400));
  }

  // Prevent past date leave applications
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    return next(new AppError('Leave cannot be applied for past dates.', 400));
  }

  // Calculate day count
  const diffTime = Math.abs(end - start);
  let daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  if (isHalfDay) daysCount = 0.5;

  // Fix 5: Prevent overlapping leave requests — exclude ALL rejected/cancelled statuses
  const overlapping = await LeaveRequest.findOne({
    user: userId,
    isDeleted: false,
    status: { $nin: ['CANCELLED', 'TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED'] },
    $or: [
      { fromDate: { $lte: end }, toDate: { $gte: start } }
    ]
  });

  if (overlapping) {
    return next(new AppError('You already have a pending or approved leave request during these dates.', 400));
  }

  // Check Leave Balance
  const currentYear = new Date().getFullYear();
  let userBalance = await LeaveBalance.findOne({ user: userId, year: currentYear });

  if (!userBalance) {
    // Auto-create balance entry if missing
    const activeLeaveTypes = await LeaveType.find({ status: 'ACTIVE', isDeleted: false });
    const allocations = activeLeaveTypes.map((lt) => ({
      leaveType: lt._id,
      leaveTypeName: lt.name,
      leaveTypeCode: lt.code,
      colorBadge: lt.colorBadge,
      total: lt.maxDays,
      used: 0,
      pending: 0,
      remaining: lt.maxDays
    }));

    userBalance = await LeaveBalance.create({ user: userId, year: currentYear, allocations });
  }

  const alloc = userBalance.allocations.find((a) => a.leaveType.toString() === leaveType);
  if (alloc && alloc.remaining < daysCount) {
    return next(new AppError(`Insufficient leave balance! You have ${alloc.remaining} days remaining for this leave type.`, 400));
  }

  // Fetch escalation timer settings
  const settings = await Settings.findOne() || { emergencyEscalationMinutes: 5 };
  const escalationMinutes = settings.emergencyEscalationMinutes || 5;

  const now = new Date();
  const escalationDeadline = isEmergency ? new Date(now.getTime() + escalationMinutes * 60000) : null;

  const newLeave = await LeaveRequest.create({
    user: userId,
    leaveType,
    fromDate: start,
    toDate: end,
    daysCount,
    isHalfDay: !!isHalfDay,
    halfDayType: halfDayType || 'NONE',
    isEmergency: !!isEmergency,
    reason,
    contactNumber,
    attachments: attachments || [],
    status: 'PENDING',
    escalationDeadline,
    approvalFlow: [
      {
        reviewer: userId,
        reviewerRole: req.user.role,
        action: 'APPLIED',
        comments: isEmergency ? 'Applied Urgent Emergency Leave' : 'Leave request submitted',
        timestamp: now
      }
    ]
  });

  // Update Pending Balance
  if (alloc) {
    alloc.pending += daysCount;
    alloc.remaining -= daysCount;
    await userBalance.save();
  }

  // 1. Notify Applicant
  const applicantTitle = isEmergency ? '🚨 Urgent Emergency Leave Submitted' : 'Leave Application Submitted';
  const applicantMsg = `Your leave request for ${daysCount} day(s) (${start.toLocaleDateString()} - ${end.toLocaleDateString()}) has been submitted successfully.`;
  await Notification.safeCreate({
    recipient: userId,
    title: applicantTitle,
    message: applicantMsg,
    type: 'LEAVE_APPLIED',
    targetUrl: '/leaves'
  });
  sendPushNotification(userId, applicantTitle, applicantMsg, '/leaves');

  // 2. Notify Reporting Manager if assigned
  const managerId = req.user.reportingManager;
  if (managerId && managerId.toString() !== userId.toString()) {
    const mgrTitle = isEmergency ? '🚨 Urgent Emergency Leave Request' : 'New Leave Request Received';
    const mgrMsg = `${req.user.firstName} ${req.user.lastName} applied for ${daysCount} day(s) leave.`;
    await Notification.safeCreate({
      recipient: managerId,
      title: mgrTitle,
      message: mgrMsg,
      type: 'LEAVE_APPLIED',
      targetUrl: '/leaves'
    });
    sendPushNotification(managerId, mgrTitle, mgrMsg, '/leaves');
  }

  // 3. Notify HR and Super Admin Managers
  try {
    const hrAdmins = await User.find({
      role: { $in: ['HR', 'ADMIN'] },
      status: 'ACTIVE',
      _id: { $ne: userId }
    });

    const hrTitle = isEmergency ? '🚨 Urgent Emergency Leave Alert' : 'New Leave Application Submitted';
    const hrMsg = `${req.user.firstName} ${req.user.lastName} (${req.user.employeeId}) applied for ${daysCount} day(s) leave.`;
    const hrIds = [];
    for (const adminUser of hrAdmins) {
      hrIds.push(adminUser._id);
      await Notification.safeCreate({
        recipient: adminUser._id,
        title: hrTitle,
        message: hrMsg,
        type: 'LEAVE_APPLIED',
        targetUrl: '/leaves'
      });
    }
    if (hrIds.length > 0) {
      sendPushNotification(hrIds, hrTitle, hrMsg, '/leaves');
    }
  } catch (err) {
    console.error('[Notification Dispatch Error]', err);
  }

  await AuditLog.create({
    user: userId,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    userRole: req.user.role,
    action: 'LEAVE_APPLY',
    module: 'LEAVE',
    details: `Applied ${isEmergency ? 'Emergency ' : ''}leave from ${fromDate} to ${toDate}`
  });

  res.status(201).json({
    status: 'success',
    data: { leave: newLeave }
  });
});

export const approveLeave = asyncHandler(async (req, res, next) => {
  const { comments } = req.body;
  const leave = await LeaveRequest.findById(req.params.id)
    .populate('user')
    .populate('leaveType');

  if (!leave || leave.isDeleted) return next(new AppError('Leave request not found.', 404));

  const reviewerRole = req.user.role;
  const applicantRole = leave.user?.role || 'EMPLOYEE';
  const isSelfRequest = leave.user?._id.toString() === req.user._id.toString();
  const previousStatus = leave.status;
  const now = new Date();

  // Rule: Users cannot approve their own leave request (except CEO)
  if (isSelfRequest && reviewerRole !== 'CEO') {
    return next(new AppError('You cannot approve your own leave request.', 403));
  }

  // Prevent approval if leave request is already finalized or rejected
  const isAlreadyFinalized = leave.status === 'CEO_APPROVED' || 
    (applicantRole === 'EMPLOYEE' && leave.status === 'ADMIN_APPROVED') ||
    ['TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED', 'CANCELLED'].includes(leave.status);

  if (isAlreadyFinalized) {
    return next(new AppError(`This leave request is already finalized or rejected (${leave.status.replace(/_/g, ' ')}).`, 400));
  }

  // CEO Direct Executive Override: CEO approval immediately grants final approval (bypassing remaining steps if Admin/HR is absent)
  if (reviewerRole === 'CEO') {
    leave.status = 'CEO_APPROVED';
    leave.approvalFlow.push({
      reviewer: req.user._id,
      reviewerRole: 'CEO',
      action: 'CEO_APPROVE',
      comments: comments || 'Direct final executive approval granted by CEO.',
      timestamp: now
    });
  } else if (applicantRole === 'EMPLOYEE') {
    // Sequential Flow: TL -> HR -> Admin (ADMIN) — Final for Employee, no CEO
    if (leave.status === 'PENDING' || leave.status === 'ESCALATED_TO_HR') {
      if (!['TEAM_LEAD', 'CEO'].includes(reviewerRole)) {
        return next(new AppError('Employee leave request requires TL (Manager) approval first.', 403));
      }
      leave.status = 'TEAM_LEAD_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: reviewerRole,
        action: 'TEAM_LEAD_APPROVE',
        comments: comments || 'Approved by Team Lead (Manager). Pending HR approval.',
        timestamp: now
      });
    } else if (leave.status === 'TEAM_LEAD_APPROVED') {
      if (!['HR', 'CEO'].includes(reviewerRole)) {
        return next(new AppError('Employee leave request requires HR approval next.', 403));
      }
      leave.status = 'HR_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: reviewerRole,
        action: 'HR_APPROVE',
        comments: comments || 'Approved by HR. Pending Admin approval.',
        timestamp: now
      });
    } else if (leave.status === 'HR_APPROVED') {
      if (!['ADMIN', 'CEO'].includes(reviewerRole)) {
        return next(new AppError('Employee leave request requires Admin (Super Admin) approval next.', 403));
      }
      leave.status = 'ADMIN_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: reviewerRole,
        action: 'ADMIN_APPROVE',
        comments: comments || 'Approved by Admin.',
        timestamp: now
      });
    }
  } else if (applicantRole === 'TEAM_LEAD') {
    // Sequential Flow for TL/Manager: HR -> Admin (ADMIN) -> CEO
    if (leave.status === 'PENDING' || leave.status === 'ESCALATED_TO_HR') {
      if (!['HR', 'CEO'].includes(reviewerRole)) {
        return next(new AppError('TL leave request requires HR approval first.', 403));
      }
      leave.status = 'HR_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: reviewerRole,
        action: 'HR_APPROVE',
        comments: comments || 'Approved by HR for TL leave. Pending Admin approval.',
        timestamp: now
      });
    } else if (leave.status === 'HR_APPROVED') {
      if (!['ADMIN', 'CEO'].includes(reviewerRole)) {
        return next(new AppError('TL leave request requires Admin (Super Admin) approval next.', 403));
      }
      leave.status = 'ADMIN_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: reviewerRole,
        action: 'ADMIN_APPROVE',
        comments: comments || 'Approved by Admin for TL leave. Pending CEO final confirmation.',
        timestamp: now
      });
    } else if (leave.status === 'ADMIN_APPROVED') {
      if (reviewerRole !== 'CEO') {
        return next(new AppError('TL leave request requires CEO final approval.', 403));
      }
      leave.status = 'CEO_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: 'CEO',
        action: 'CEO_APPROVE',
        comments: comments || 'Final executive approval granted by CEO for TL leave.',
        timestamp: now
      });
    }
  } else if (applicantRole === 'ADMIN') {
    // Sequential Flow for Admin: HR -> CEO
    if (leave.status === 'PENDING' || leave.status === 'ESCALATED_TO_HR') {
      if (!['HR', 'CEO'].includes(reviewerRole)) {
        return next(new AppError('Admin leave request requires HR approval first.', 403));
      }
      leave.status = 'HR_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: reviewerRole,
        action: 'HR_APPROVE',
        comments: comments || 'Approved by HR for Admin leave. Pending CEO final confirmation.',
        timestamp: now
      });
    } else if (leave.status === 'HR_APPROVED') {
      if (reviewerRole !== 'CEO') {
        return next(new AppError('Admin leave request requires CEO final approval.', 403));
      }
      leave.status = 'CEO_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: 'CEO',
        action: 'CEO_APPROVE',
        comments: comments || 'Final executive approval granted by CEO for Admin leave.',
        timestamp: now
      });
    }
  } else if (applicantRole === 'HR') {
    // Sequential Flow for HR: Admin (ADMIN) -> CEO
    if (leave.status === 'PENDING' || leave.status === 'ESCALATED_TO_HR') {
      if (!['ADMIN', 'CEO'].includes(reviewerRole)) {
        return next(new AppError('HR leave request requires Admin (Super Admin) approval first.', 403));
      }
      leave.status = 'ADMIN_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: reviewerRole,
        action: 'ADMIN_APPROVE',
        comments: comments || 'Approved by Admin for HR leave. Pending CEO final confirmation.',
        timestamp: now
      });
    } else if (leave.status === 'ADMIN_APPROVED') {
      if (reviewerRole !== 'CEO') {
        return next(new AppError('HR leave request requires CEO final approval.', 403));
      }
      leave.status = 'CEO_APPROVED';
      leave.approvalFlow.push({
        reviewer: req.user._id,
        reviewerRole: 'CEO',
        action: 'CEO_APPROVE',
        comments: comments || 'Final executive approval granted by CEO for HR leave.',
        timestamp: now
      });
    }
  } else if (applicantRole === 'CEO') {
    leave.status = 'CEO_APPROVED';
    leave.approvalFlow.push({
      reviewer: req.user._id,
      reviewerRole: 'CEO',
      action: 'CEO_APPROVE',
      comments: comments || 'CEO self leave confirmed.',
      timestamp: now
    });
  }

  // Deduct from Pending and add to Used ONLY when leave reaches final approved status
  const isFinalApproval = leave.status === 'CEO_APPROVED' || (applicantRole === 'EMPLOYEE' && leave.status === 'ADMIN_APPROVED');

  if (isFinalApproval) {
    const currentYear = new Date(leave.fromDate).getFullYear();
    const balance = await LeaveBalance.findOne({ user: leave.user._id, year: currentYear });
    if (balance) {
      const alloc = balance.allocations.find((a) => a.leaveType.toString() === leave.leaveType._id.toString());
      if (alloc) {
        alloc.pending = Math.max(0, alloc.pending - leave.daysCount);
        alloc.used += leave.daysCount;
        await balance.save();
      }
    }
  }

  await leave.save();

  // Notify Employee / Applicant
  const approveTitle = isFinalApproval ? `Leave Request Final Approved ✅` : `Leave Request Status Updated: ${leave.status.replace('_', ' ')}`;
  const approveMsg = `Your leave request for ${leave.daysCount} day(s) has been updated to ${leave.status.replace('_', ' ')}.`;
  const applicantId = leave.user?._id || leave.user;
  if (applicantId) {
    await Notification.safeCreate({
      recipient: applicantId,
      title: approveTitle,
      message: approveMsg,
      type: 'LEAVE_APPROVED',
      targetUrl: '/leaves'
    });
    sendPushNotification(applicantId, approveTitle, approveMsg, '/leaves');
  }

  // Level 1 -> Level 2 Notification Dispatch: Notify CEO if Level 1 approval was done and CEO final approval is pending
  const requiresCeoApproval = (applicantRole === 'TEAM_LEAD' && leave.status === 'ADMIN_APPROVED') || 
                              (applicantRole === 'HR' && leave.status === 'ADMIN_APPROVED') || 
                              (applicantRole === 'ADMIN' && leave.status === 'HR_APPROVED');

  if (requiresCeoApproval) {
    try {
      const ceoUsers = await User.find({ role: 'CEO', status: 'ACTIVE' });
      const ceoTitle = `🚨 CEO Level 2 Final Approval Required (${applicantRole} Leave)`;
      const ceoMsg = `${leave.user?.firstName} ${leave.user?.lastName} (${applicantRole}) leave request has passed Level 1 and requires your CEO final approval.`;
      const ceoIds = [];
      for (const ceo of ceoUsers) {
        ceoIds.push(ceo._id);
        await Notification.safeCreate({
          recipient: ceo._id,
          title: ceoTitle,
          message: ceoMsg,
          type: 'LEAVE_APPLIED',
          targetUrl: '/leaves'
        });
      }
      if (ceoIds.length > 0) {
        sendPushNotification(ceoIds, ceoTitle, ceoMsg, '/leaves');
      }
    } catch (err) {
      console.error('[Notification Dispatch Error]', err);
    }
  }

  res.status(200).json({ status: 'success', data: { leave } });
});

export const rejectLeave = asyncHandler(async (req, res, next) => {
  const { comments } = req.body;
  if (!comments) return next(new AppError('Rejection reason/comments are required.', 400));

  const leave = await LeaveRequest.findById(req.params.id).populate('user', 'role');
  if (!leave || leave.isDeleted) return next(new AppError('Leave request not found.', 404));

  const reviewerRole = req.user.role;
  const previousStatus = leave.status;
  const now = new Date();

  if (['TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED', 'CANCELLED'].includes(leave.status)) {
    return next(new AppError(`This leave request has already been rejected/cancelled (${leave.status.replace('_', ' ')}).`, 400));
  }

  let rejectStatus = 'TEAM_LEAD_REJECTED';
  let rejectAction = 'TEAM_LEAD_REJECT';

  if (reviewerRole === 'HR') {
    rejectStatus = 'HR_REJECTED';
    rejectAction = 'HR_REJECT';
  } else if (reviewerRole === 'ADMIN') {
    rejectStatus = 'ADMIN_REJECTED';
    rejectAction = 'ADMIN_REJECT';
  } else if (reviewerRole === 'CEO') {
    rejectStatus = 'CEO_REJECTED';
    rejectAction = 'CEO_REJECT';
  }

  leave.status = rejectStatus;
  leave.approvalFlow.push({
    reviewer: req.user._id,
    reviewerRole: reviewerRole,
    action: rejectAction,
    comments,
    timestamp: now
  });

  await leave.save();

  // Restore Leave Balance based on previous status
  const currentYear = new Date(leave.fromDate).getFullYear();
  const balance = await LeaveBalance.findOne({ user: leave.user._id || leave.user, year: currentYear });
  if (balance) {
    const alloc = balance.allocations.find((a) => a.leaveType.toString() === leave.leaveType.toString());
    if (alloc) {
      const applicantRole = leave.user.role || 'EMPLOYEE';
      const wasFinalApproved = previousStatus === 'CEO_APPROVED' || (applicantRole === 'EMPLOYEE' && previousStatus === 'ADMIN_APPROVED');

      if (wasFinalApproved) {
        alloc.used = Math.max(0, alloc.used - leave.daysCount);
        alloc.remaining += leave.daysCount;
      } else {
        alloc.pending = Math.max(0, alloc.pending - leave.daysCount);
        alloc.remaining += leave.daysCount;
      }
      await balance.save();
    }
  }

  // Notify Employee
  const rejectTitle = `Leave Request Rejected by ${reviewerRole} ❌`;
  const rejectMsg = `Your leave request has been rejected. Reason: ${comments}`;
  const recipientId = leave.user._id || leave.user;
  await Notification.safeCreate({
    recipient: recipientId,
    title: rejectTitle,
    message: rejectMsg,
    type: 'LEAVE_REJECTED',
    targetUrl: '/leaves'
  });
  sendPushNotification(recipientId, rejectTitle, rejectMsg, '/leaves');

  res.status(200).json({ status: 'success', data: { leave } });
});

export const cancelLeave = asyncHandler(async (req, res, next) => {
  const { cancellationReason } = req.body;
  const leave = await LeaveRequest.findById(req.params.id).populate('user', 'role firstName lastName employeeId');
  if (!leave || leave.isDeleted) return next(new AppError('Leave request not found.', 404));

  // Only the leave owner can cancel — managers/HR cannot cancel on behalf of employees
  if (leave.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only cancel your own leave requests.', 403));
  }

  // Check if already cancelled or rejected
  if (['CANCELLED', 'TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED'].includes(leave.status)) {
    return next(new AppError('This leave request is already cancelled or rejected.', 400));
  }

  // ✅ NEW: Allow cancellation even after approval, but notify HR
  const applicantRole = leave.user?.role || req.user.role;
  const isFinalApproved = leave.status === 'CEO_APPROVED' || (applicantRole === 'EMPLOYEE' && leave.status === 'ADMIN_APPROVED');
  const isPartiallyApproved = ['TEAM_LEAD_APPROVED', 'HR_APPROVED', 'ADMIN_APPROVED'].includes(leave.status);
  const previousStatus = leave.status;

  leave.status = 'CANCELLED';
  leave.approvalFlow.push({
    reviewer: req.user._id,
    reviewerRole: req.user.role,
    action: 'CANCELLED',
    comments: cancellationReason || 'Leave request cancelled by user',
    timestamp: new Date()
  });

  await leave.save();

  // Restore balance based on previous status
  const currentYear = new Date(leave.fromDate).getFullYear();
  const balance = await LeaveBalance.findOne({ user: leave.user._id, year: currentYear });
  if (balance) {
    const alloc = balance.allocations.find((a) => a.leaveType.toString() === leave.leaveType.toString());
    if (alloc) {
      if (isFinalApproved) {
        // Fully approved — restore from used
        alloc.used = Math.max(0, alloc.used - leave.daysCount);
        alloc.remaining += leave.daysCount;
      } else {
        // Still in pending / intermediate approval state — restore from pending
        alloc.pending = Math.max(0, alloc.pending - leave.daysCount);
        alloc.remaining += leave.daysCount;
      }
      await balance.save();
    }
  }

  // ✅ NEW: Notify HR/Admin if approved leave was cancelled
  if (isFinalApproved || isPartiallyApproved) {
    try {
      const hrAdmins = await User.find({ role: { $in: ['HR', 'ADMIN', 'CEO'] }, status: 'ACTIVE' });
      const title = `⚠️ Approved Leave Cancelled`;
      const message = `${leave.user.firstName} ${leave.user.lastName} (${leave.user.employeeId}) cancelled their ${previousStatus.replace('_', ' ')} leave from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()}. Reason: ${cancellationReason || 'Not specified'}`;
      
      const notifyIds = [];
      for (const admin of hrAdmins) {
        notifyIds.push(admin._id);
        await Notification.safeCreate({
          recipient: admin._id,
          title,
          message,
          type: 'LEAVE_APPROVED', // Using existing type
          targetUrl: '/leaves'
        });
      }
      
      if (notifyIds.length > 0) {
        sendPushNotification(notifyIds, title, message, '/leaves');
      }
    } catch (err) {
      console.error('[Cancellation Notification Error]', err);
    }
  }

  // Notify reporting manager if assigned
  if (req.user.reportingManager) {
    try {
      await Notification.safeCreate({
        recipient: req.user.reportingManager,
        title: '🚫 Leave Cancelled',
        message: `${req.user.firstName} ${req.user.lastName} cancelled their leave request (${leave.daysCount} days).`,
        type: 'LEAVE_APPLIED',
        targetUrl: '/leaves'
      });
      sendPushNotification(req.user.reportingManager, '🚫 Leave Cancelled', `${req.user.firstName} ${req.user.lastName} cancelled their leave.`, '/leaves');
    } catch (err) {
      console.error('[Manager Notification Error]', err);
    }
  }

  // Audit log
  await AuditLog.create({
    user: req.user._id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    userRole: req.user.role,
    action: 'LEAVE_CANCEL',
    module: 'LEAVE',
    details: `Cancelled ${previousStatus.replace('_', ' ')} leave from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()}`
  });

  res.status(200).json({ 
    status: 'success', 
    message: isFinalApproved ? 'Leave cancelled successfully. HR has been notified.' : 'Leave cancelled successfully.',
    data: { leave } 
  });
});

export const getLeaveBalances = asyncHandler(async (req, res, next) => {
  const targetUser = req.query.userId || req.user._id;
  const year = req.query.year || new Date().getFullYear();

  let balance = await LeaveBalance.findOne({ user: targetUser, year }).populate('allocations.leaveType');

  if (!balance) {
    const activeLeaveTypes = await LeaveType.find({ status: 'ACTIVE', isDeleted: false });
    const allocations = activeLeaveTypes.map((lt) => ({
      leaveType: lt._id,
      leaveTypeName: lt.name,
      leaveTypeCode: lt.code,
      colorBadge: lt.colorBadge,
      total: lt.maxDays,
      used: 0,
      pending: 0,
      remaining: lt.maxDays
    }));

    balance = await LeaveBalance.create({ user: targetUser, year, allocations });
    balance = balance.toObject();
  } else {
    balance = balance.toObject();
    balance.allocations = balance.allocations.filter(alloc => alloc.leaveType && alloc.leaveType.isDeleted !== true);
  }

  res.status(200).json({ status: 'success', data: { balance } });
});

export const clearAllLeaveRequestsAdmin = asyncHandler(async (req, res, next) => {
  if (!['CEO', 'ADMIN', 'HR'].includes(req.user.role)) {
    return next(new AppError('Only CEO, Admin, and HR can clear leave requests.', 403));
  }

  const result = await LeaveRequest.deleteMany({});
  await Notification.deleteMany({ type: { $regex: /^LEAVE_/i } });

  // Reset leave balances for all users
  const balances = await LeaveBalance.find();
  for (const bal of balances) {
    if (bal.allocations) {
      for (const alloc of bal.allocations) {
        alloc.used = 0;
        alloc.pending = 0;
        alloc.remaining = alloc.total || 12;
      }
      await bal.save();
    }
  }

  res.status(200).json({
    status: 'success',
    message: `Successfully cleared ${result.deletedCount || 0} test leave requests and reset balances.`
  });
});

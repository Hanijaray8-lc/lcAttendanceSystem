import { DailyReport } from '../models/DailyReport.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

// Get today's start and end date range in IST (Asia/Kolkata timezone)
const getTodayRange = () => {
  const now = new Date();
  const istDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  const start = new Date(`${istDateStr}T00:00:00.000+05:30`);
  const end = new Date(`${istDateStr}T23:59:59.999+05:30`);
  return { start, end };
};

// Submit Daily Report — always create a new report record for every submission
export const submitDailyReport = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { title, projectTitle, moduleName, tasksCompleted, pendingTasks, blockers, hoursWorked, workStatus, reportSlot } = req.body;

  if (!title || !title.trim()) {
    return next(new AppError('Please provide a report title.', 400));
  }
  if (!tasksCompleted || !tasksCompleted.trim()) {
    return next(new AppError('Please describe tasks completed today.', 400));
  }

  const now = new Date();

  // Create new report for today
  const report = await DailyReport.create({
    user: userId,
    date: now,
    title: title.trim(),
    projectTitle: (projectTitle || 'Attendance Project').trim(),
    moduleName: (moduleName || 'General').trim(),
    tasksCompleted: tasksCompleted.trim(),
    pendingTasks: (pendingTasks || '').trim(),
    blockers: (blockers || '').trim(),
    hoursWorked: Math.min(24, Math.max(0.5, Number(hoursWorked) || 8)),
    workStatus: workStatus || 'IN_PROGRESS',
    reportSlot: reportSlot || 'GENERAL',
    status: 'SUBMITTED'
  });

  await report.populate([
    {
      path: 'user',
      select: 'firstName lastName employeeId department role email profileImage designation',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'designation', select: 'title name' }
      ]
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { report }
  });
});

// Check if current user submitted today's reports
export const getTodayReportStatus = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { start, end } = getTodayRange();

  const reports = await DailyReport.find({
    user: userId,
    date: { $gte: start, $lte: end }
  })
    .populate({
      path: 'user',
      select: 'firstName lastName employeeId department role email profileImage designation',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'designation', select: 'title name' }
      ]
    })
    .populate('reviewedBy', 'firstName lastName role')
    .populate({
      path: 'comments.user',
      select: 'firstName lastName role profileImage'
    })
    .sort({ date: -1 });

  res.status(200).json({
    status: 'success',
    data: {
      hasSubmitted: reports.length > 0,
      submittedCount: reports.length,
      report: reports[0] || null,
      reports
    }
  });
});

// Send Reminder to Employee for Daily Report Submission
export const sendDailyReportReminder = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    return next(new AppError('Employee not found.', 404));
  }

  const roleLabels = { CEO: 'CEO', TEAM_LEAD: 'Team Lead', HR: 'HR', ADMIN: 'Admin', EMPLOYEE: 'Employee' };
  const senderRole = roleLabels[req.user.role] || req.user.role;
  await Notification.safeCreate({
    recipient: userId,
    title: 'Daily Report Reminder 🔔',
    message: `${senderRole} ${req.user.firstName || ''} ${req.user.lastName || ''} sent you a reminder: Please submit your Daily Work Report for today.`,
    type: 'DAILY_REPORT',
    targetUrl: '/daily-reports'
  });

  res.status(200).json({
    status: 'success',
    message: `Reminder sent to ${targetUser.firstName || 'employee'}.`
  });
});

// Get Daily Reports (Role-Based Access with Employee Status Tracking)
export const getDailyReports = asyncHandler(async (req, res, next) => {
  const role = req.user.role;
  const userId = req.user._id;
  const { date, status, search } = req.query;

  let reportDateQuery = {};

  if (date) {
    // Parse the date string as IST to avoid UTC offset issues
    // e.g. "2026-08-12" should be 2026-08-12 00:00:00 IST to 2026-08-12 23:59:59 IST
    const start = new Date(`${date}T00:00:00.000+05:30`);
    const end = new Date(`${date}T23:59:59.999+05:30`);
    reportDateQuery.date = { $gte: start, $lte: end };
  } else {
    // Default: today in IST
    const istDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const start = new Date(`${istDateStr}T00:00:00.000+05:30`);
    const end = new Date(`${istDateStr}T23:59:59.999+05:30`);
    reportDateQuery.date = { $gte: start, $lte: end };
  }

  // 1. Fetch relevant users to track
  let userQuery = { role: { $ne: 'CEO' }, isDeleted: false, status: 'ACTIVE' };
  if (role === 'EMPLOYEE') {
    userQuery._id = userId;
  } else if (role === 'TEAM_LEAD') {
    const teamMembers = await User.find({ reportingManager: userId, isDeleted: false, status: 'ACTIVE' }).select('_id');
    const teamIds = teamMembers.map((m) => m._id);
    teamIds.push(userId);
    userQuery._id = { $in: teamIds };
  }

  const trackingUsers = await User.find(userQuery)
    .select('firstName lastName employeeId department role email profileImage')
    .populate('department', 'name code')
    .sort({ firstName: 1 });

  // 2. Fetch existing daily reports for target date & users
  const userIds = trackingUsers.map((u) => u._id);
  const reports = await DailyReport.find({
    ...reportDateQuery,
    user: { $in: userIds }
  })
    .populate({
      path: 'user',
      select: 'firstName lastName employeeId department role email profileImage',
      populate: { path: 'department', select: 'name code' }
    })
    .populate('reviewedBy', 'firstName lastName role')
    .populate({
      path: 'comments.user',
      select: 'firstName lastName role profileImage'
    })
    .sort({ date: -1, createdAt: -1 });

  // Map user ID to their array of reports
  const reportMap = {};
  reports.forEach((r) => {
    if (r.user) {
      const uid = r.user._id.toString();
      if (!reportMap[uid]) reportMap[uid] = [];
      reportMap[uid].push(r);
    }
  });

  // 3. Build unified employee status list
  let employeeStatuses = trackingUsers.map((u) => {
    const userReports = reportMap[u._id.toString()] || [];
    const latestReport = userReports[0] || null;
    return {
      _id: latestReport ? latestReport._id : `pending_${u._id}`,
      user: u,
      hasSubmitted: userReports.length > 0,
      submittedCount: userReports.length,
      reportStatus: latestReport ? latestReport.status : 'NOT_SUBMITTED',
      report: latestReport,
      reports: userReports
    };
  });

  // 4. Apply status filter
  if (status) {
    if (status === 'NOT_SUBMITTED' || status === 'PENDING') {
      employeeStatuses = employeeStatuses.filter((item) => !item.hasSubmitted);
    } else {
      employeeStatuses = employeeStatuses.filter((item) => item.reportStatus === status);
    }
  }

  // 5. Apply search query filter
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    employeeStatuses = employeeStatuses.filter((item) => {
      const name = `${item.user.firstName || ''} ${item.user.lastName || ''}`.toLowerCase();
      const empId = (item.user.employeeId || '').toLowerCase();
      const dept = (item.user.department?.name || '').toLowerCase();
      const title = (item.report?.title || '').toLowerCase();
      return name.includes(q) || empId.includes(q) || dept.includes(q) || title.includes(q);
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      reports,
      employeeStatuses,
      totalTracked: trackingUsers.length,
      submittedCount: reports.length,
      pendingCount: trackingUsers.length - reports.length
    }
  });
});

// Get Full Report History for a Specific Employee
export const getEmployeeReportHistory = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId)
    .select('firstName lastName employeeId department role email profileImage designation')
    .populate('department', 'name code')
    .populate('designation', 'title name');

  if (!targetUser) {
    return next(new AppError('Employee not found.', 404));
  }

  const reports = await DailyReport.find({ user: userId })
    .populate({
      path: 'user',
      select: 'firstName lastName employeeId department role email profileImage designation',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'designation', select: 'title name' }
      ]
    })
    .populate('reviewedBy', 'firstName lastName role')
    .populate({
      path: 'comments.user',
      select: 'firstName lastName role profileImage'
    })
    .sort({ date: -1 });

  const totalSubmitted = reports.length;
  const totalHours = reports.reduce((sum, r) => sum + (r.hoursWorked || 8), 0);
  const approvedCount = reports.filter((r) => r.status === 'APPROVED' || r.status === 'REVIEWED').length;

  res.status(200).json({
    status: 'success',
    data: {
      user: targetUser,
      reports,
      stats: {
        totalSubmitted,
        totalHours,
        approvedCount
      }
    }
  });
});

// Review / Add Feedback / Approve Report
export const reviewDailyReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { feedback, status } = req.body;

  const report = await DailyReport.findById(id);
  if (!report) {
    return next(new AppError('Daily report not found.', 404));
  }

  // Append each reviewer's comment to the comments array (never overwrite old feedback)
  if (feedback && feedback.trim()) {
    if (!Array.isArray(report.comments)) report.comments = [];
    report.comments.push({
      user: req.user._id,
      comment: feedback.trim(),
      status: status || report.status || 'REVIEWED',
      createdAt: new Date()
    });
    // Do NOT overwrite report.feedback — keep comments[] as the source of truth
  }

  if (status) report.status = status;

  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();

  await report.save();

  // Populate user and comment authors to return updated data immediately
  const updatedReport = await DailyReport.findById(id)
    .populate({
      path: 'user',
      select: 'firstName lastName employeeId department role email profileImage',
      populate: { path: 'department', select: 'name code' }
    })
    .populate('reviewedBy', 'firstName lastName role')
    .populate({
      path: 'comments.user',
      select: 'firstName lastName role profileImage'
    });

  // Send real-time notification to the employee about the feedback
  try {
    const roleLabels = { CEO: 'CEO', TEAM_LEAD: 'Team Lead', HR: 'HR', ADMIN: 'Admin', EMPLOYEE: 'Employee' };
    const reviewerRole = roleLabels[req.user.role] || req.user.role;
    await Notification.safeCreate({
      recipient: report.user,
      title: `Daily Report ${status || 'Reviewed'}`,
      message: `${reviewerRole} ${req.user.firstName || ''} ${req.user.lastName || ''} reviewed your report "${report.title}": ${feedback ? `"${feedback}"` : 'Status updated.'}`,
      type: 'DAILY_REPORT',
      targetUrl: '/daily-reports'
    });
  } catch (notifErr) {
    console.error('[Notification Error]', notifErr);
  }

  res.status(200).json({
    status: 'success',
    data: { report: updatedReport }
  });
});

// Delete a specific comment on a Daily Report
export const deleteDailyReportComment = asyncHandler(async (req, res, next) => {
  const { id, commentId } = req.params;

  const report = await DailyReport.findById(id);
  if (!report) {
    return next(new AppError('Daily report not found.', 404));
  }

  const comment = report.comments.id(commentId);
  if (!comment) {
    return next(new AppError('Comment not found.', 404));
  }

  const isAuthor = comment.user.toString() === req.user._id.toString();
  const isAdminOrCEO = ['ADMIN', 'CEO'].includes(req.user.role);

  if (!isAuthor && !isAdminOrCEO) {
    return next(new AppError('You can only delete your own comments.', 403));
  }

  report.comments.pull(commentId);

  // Sync fallback feedback
  if (report.comments.length > 0) {
    const lastComment = report.comments[report.comments.length - 1];
    report.feedback = lastComment.comment;
    report.reviewedBy = lastComment.user;
  } else {
    report.feedback = '';
  }

  await report.save();

  const updatedReport = await DailyReport.findById(id)
    .populate({
      path: 'user',
      select: 'firstName lastName employeeId department role email profileImage',
      populate: { path: 'department', select: 'name code' }
    })
    .populate('reviewedBy', 'firstName lastName role')
    .populate({
      path: 'comments.user',
      select: 'firstName lastName role profileImage'
    });

  res.status(200).json({
    status: 'success',
    data: { report: updatedReport },
    message: 'Comment deleted successfully.'
  });
});

// Update / Edit Daily Report
export const updateDailyReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, projectTitle, moduleName, tasksCompleted, pendingTasks, blockers, hoursWorked, workStatus } = req.body;

  const report = await DailyReport.findById(id);
  if (!report) {
    return next(new AppError('Daily report not found.', 404));
  }

  // Strict Rule: ONLY the owner (creator) of the report can edit their own report!
  if (report.user.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only edit your own daily report.', 403));
  }

  if (title) report.title = title.trim();
  if (projectTitle !== undefined) report.projectTitle = projectTitle.trim();
  if (moduleName !== undefined) report.moduleName = moduleName.trim();
  if (tasksCompleted) report.tasksCompleted = tasksCompleted.trim();
  if (pendingTasks !== undefined) report.pendingTasks = pendingTasks.trim();
  if (blockers !== undefined) report.blockers = blockers.trim();
  if (hoursWorked !== undefined) report.hoursWorked = Math.min(24, Math.max(0.5, Number(hoursWorked) || 8));
  if (workStatus) report.workStatus = workStatus;

  await report.save();
  await report.populate([
    {
      path: 'user',
      select: 'firstName lastName employeeId department role email profileImage designation',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'designation', select: 'title name' }
      ]
    },
    { path: 'reviewedBy', select: 'firstName lastName role' },
    { path: 'comments.user', select: 'firstName lastName role profileImage' }
  ]);

  res.status(200).json({
    status: 'success',
    data: { report }
  });
});

// Delete Daily Report
export const deleteDailyReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const report = await DailyReport.findById(id);
  if (!report) {
    return next(new AppError('Daily report not found.', 404));
  }

  // Strict Rule: ONLY the owner (creator) of the report can delete their own report!
  if (report.user.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own daily report.', 403));
  }

  await DailyReport.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Daily report deleted successfully.'
  });
});

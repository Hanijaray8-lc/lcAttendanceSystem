import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getLeaveReports = asyncHandler(async (req, res, next) => {
  const { year = new Date().getFullYear(), month, department, leaveType, status, date } = req.query;

  const matchQuery = { isDeleted: false };
  if (status && status !== 'ALL') {
    if (status === 'APPROVED' || status === 'HR_APPROVED') {
      matchQuery.status = { $in: ['HR_APPROVED', 'ADMIN_APPROVED', 'CEO_APPROVED'] };
    } else if (status === 'REJECTED' || status === 'HR_REJECTED') {
      matchQuery.status = { $in: ['TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED'] };
    } else {
      matchQuery.status = status;
    }
  }
  if (leaveType) matchQuery.leaveType = leaveType;

  // Specific date or date range filter (IST-aware)
  if (date) {
    const startDate = new Date(`${date}T00:00:00.000+05:30`);
    const endDate = new Date(`${date}T23:59:59.999+05:30`);
    matchQuery.fromDate = { $lte: endDate };
    matchQuery.toDate = { $gte: startDate };
  } else if (month && year) {
    const monthStr = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = new Date(`${year}-${monthStr}-01T00:00:00.000+05:30`);
    const endDate = new Date(`${year}-${monthStr}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:30`);
    matchQuery.fromDate = { $lte: endDate };
    matchQuery.toDate = { $gte: startDate };
  } else if (year) {
    const startDate = new Date(`${year}-01-01T00:00:00.000+05:30`);
    const endDate = new Date(`${year}-12-31T23:59:59.999+05:30`);
    matchQuery.fromDate = { $lte: endDate };
    matchQuery.toDate = { $gte: startDate };
  }

  const leaves = await LeaveRequest.find(matchQuery)
    .populate('user', 'firstName lastName employeeId department designation')
    .populate({
      path: 'user',
      populate: { path: 'department', select: 'name code' }
    })
    .populate('leaveType', 'name code colorBadge')
    .sort({ fromDate: -1 });

  // Filter department in memory if populated
  let filtered = leaves;
  if (department) {
    filtered = leaves.filter((l) => l.user && l.user.department && l.user.department._id.toString() === department);
  }

  res.status(200).json({
    status: 'success',
    data: {
      totalRecords: filtered.length,
      reports: filtered
    }
  });
});

export const exportReport = asyncHandler(async (req, res, next) => {
  const { format = 'csv', year, status, date, department } = req.query;

  const matchQuery = { isDeleted: false };
  if (status && status !== 'ALL') {
    if (status === 'APPROVED' || status === 'HR_APPROVED') {
      matchQuery.status = { $in: ['HR_APPROVED', 'ADMIN_APPROVED', 'CEO_APPROVED'] };
    } else if (status === 'REJECTED' || status === 'HR_REJECTED') {
      matchQuery.status = { $in: ['TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED'] };
    } else {
      matchQuery.status = status;
    }
  }

  if (date) {
    const startDate = new Date(`${date}T00:00:00.000+05:30`);
    const endDate = new Date(`${date}T23:59:59.999+05:30`);
    matchQuery.fromDate = { $lte: endDate };
    matchQuery.toDate = { $gte: startDate };
  } else if (year) {
    const startDate = new Date(`${year}-01-01T00:00:00.000+05:30`);
    const endDate = new Date(`${year}-12-31T23:59:59.999+05:30`);
    matchQuery.fromDate = { $lte: endDate };
    matchQuery.toDate = { $gte: startDate };
  }

  let leaves = await LeaveRequest.find(matchQuery)
    .populate('user', 'firstName lastName employeeId department')
    .populate('leaveType', 'name')
    .sort({ createdAt: -1 });

  if (department) {
    leaves = leaves.filter((l) => l.user && l.user.department && l.user.department._id.toString() === department);
  }

  const exportData = leaves.map((l) => ({
    'Employee ID': l.user?.employeeId || 'N/A',
    'Employee Name': `${l.user?.firstName || ''} ${l.user?.lastName || ''}`.trim(),
    'Leave Type': l.leaveType?.name || 'N/A',
    'From Date': new Date(l.fromDate).toLocaleDateString(),
    'To Date': new Date(l.toDate).toLocaleDateString(),
    Days: l.daysCount,
    Status: l.status,
    Reason: l.reason || 'N/A'
  }));

  res.status(200).json({
    status: 'success',
    format,
    data: exportData
  });
});

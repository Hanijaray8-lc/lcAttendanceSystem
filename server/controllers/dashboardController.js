import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { Holiday } from '../models/Holiday.js';
import { AuditLog } from '../models/AuditLog.js';
import { Attendance } from '../models/Attendance.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Build real monthly leave trend for specified year
const buildMonthlyTrend = async (matchQuery = {}, trendYear) => {
  const year = trendYear || new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const results = await LeaveRequest.aggregate([
    {
      $match: {
        isDeleted: false,
        fromDate: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
        ...matchQuery
      }
    },
    {
      $group: {
        _id: { $month: '$fromDate' },
        count: { $sum: 1 }
      }
    }
  ]);

  const countMap = {};
  results.forEach((r) => { countMap[r._id] = r.count; });

  return months.map((month, idx) => ({
    month,
    leaves: countMap[idx + 1] || 0,
    count: countMap[idx + 1] || 0
  }));
};

const fetchRecentActivities = async (query = {}, limit = 5) => {
  try {
    const userQuery = query.user ? { user: query.user } : {};

    const [auditLogs, attendanceDocs, leaveDocs] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).limit(10).lean(),
      Attendance.find(userQuery)
        .populate('user', 'firstName lastName employeeId role email')
        .sort({ updatedAt: -1, clockIn: -1 })
        .limit(10)
        .lean(),
      LeaveRequest.find(userQuery)
        .populate('user', 'firstName lastName employeeId role email')
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    const realActivities = [];

    // 1. Real Audit Logs
    (auditLogs || []).forEach(log => {
      const titleStr = log.action ? log.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Activity Logged';
      realActivities.push({
        id: `audit-${log._id}`,
        title: titleStr,
        subtitle: log.userName ? `${log.userName} • ${log.details || log.module}` : (log.details || log.module || 'System Action'),
        module: log.module || 'SYSTEM',
        action: log.action || 'LOGGED',
        createdAt: log.createdAt || new Date()
      });
    });

    // 2. Real Attendance Timeline Events (Clock Ins, Force Checkouts, Lunch Events)
    (attendanceDocs || []).forEach(att => {
      const u = att.user || {};
      const name = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Employee';

      const timelineArr = Array.isArray(att.timeline) && att.timeline.length > 0
        ? att.timeline
        : [];

      if (timelineArr.length > 0) {
        timelineArr.forEach(t => {
          let actTitle = 'Clock In';
          if (t.type === 'CLOCK_OUT') actTitle = 'Clock Out';
          else if (t.type === 'FORCE_CHECKOUT') actTitle = 'Force Checkout';
          else if (t.type === 'LUNCH_OUT') actTitle = 'Lunch Out';
          else if (t.type === 'LUNCH_IN') actTitle = 'Lunch In';

          realActivities.push({
            id: `att-${att._id}-${t.type}-${new Date(t.timestamp).getTime()}`,
            title: actTitle,
            subtitle: `${name} • ${t.note || (t.workLocation === 'WFH' ? 'WFH' : 'Office')}`,
            module: 'ATTENDANCE',
            action: t.type,
            createdAt: t.timestamp || att.updatedAt || att.clockIn
          });
        });
      } else {
        if (att.clockIn) {
          realActivities.push({
            id: `att-${att._id}-in`,
            title: 'Clock In',
            subtitle: `${name} • ${att.workLocation === 'WFH' ? 'WFH' : 'Office'}`,
            module: 'ATTENDANCE',
            action: 'CLOCK_IN',
            createdAt: att.clockIn
          });
        }
        if (att.clockOut) {
          realActivities.push({
            id: `att-${att._id}-out`,
            title: 'Clock Out',
            subtitle: `${name} • Completed work session`,
            module: 'ATTENDANCE',
            action: 'CLOCK_OUT',
            createdAt: att.clockOut
          });
        }
      }
    });

    // 3. Real Leave Requests
    (leaveDocs || []).forEach(l => {
      const u = l.user || {};
      const name = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Employee';
      realActivities.push({
        id: `leave-${l._id}`,
        title: `Leave ${l.status ? l.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Request'}`,
        subtitle: `${name} • ${l.reason || 'Applied for leave'}`,
        module: 'LEAVE',
        action: l.status || 'SUBMITTED',
        createdAt: l.updatedAt || l.createdAt
      });
    });

    // Deduplicate identical timeline events
    const uniqueMap = new Map();
    realActivities.forEach(item => {
      const key = `${item.title}_${item.subtitle}_${new Date(item.createdAt).toISOString().substring(0, 16)}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    const sortedList = Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return sortedList;
  } catch (err) {
    console.error('[fetchRecentActivities Error]', err);
    return [];
  }
};

export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const role = req.user.role;
  const userId = req.user._id;
  const trendYear = req.query.trendYear ? parseInt(req.query.trendYear) : new Date().getFullYear();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch real upcoming active holidays from Holiday collection
  let upcomingHolidays = await Holiday.find({
    date: { $gte: today },
    isDeleted: false,
    status: 'ACTIVE'
  })
    .sort({ date: 1 })
    .limit(5);

  // Fallback: If no future holidays left in the year, show the upcoming/active holidays for this year
  if (upcomingHolidays.length === 0) {
    upcomingHolidays = await Holiday.find({
      isDeleted: false,
      status: 'ACTIVE'
    })
      .sort({ date: 1 })
      .limit(5);
  }

  if (['ADMIN', 'CEO'].includes(role)) {
    const [employeeDeptStats, leaveStats, leavesToday, monthlyTrend, recentActivities] = await Promise.all([
      Promise.all([
        User.countDocuments({ isDeleted: false, status: 'ACTIVE' }),
        Department.countDocuments({ isDeleted: false }),
        User.countDocuments({ role: 'TEAM_LEAD', isDeleted: false })
      ]),
      LeaveRequest.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            pending: {
              $sum: {
                $cond: [{ $in: ['$status', ['PENDING', 'ESCALATED_TO_HR']] }, 1, 0]
              }
            },
            approved: {
              $sum: {
                $cond: [{ $in: ['$status', ['HR_APPROVED', 'ADMIN_APPROVED', 'CEO_APPROVED']] }, 1, 0]
              }
            },
            rejected: {
              $sum: {
                $cond: [{ $in: ['$status', ['TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED']] }, 1, 0]
              }
            }
          }
        }
      ]),
      LeaveRequest.find({
        status: { $in: ['HR_APPROVED', 'ADMIN_APPROVED', 'CEO_APPROVED'] },
        fromDate: { $lte: today },
        toDate: { $gte: today },
        isDeleted: false
      }).populate('user', 'firstName lastName employeeId department profileImage'),
      buildMonthlyTrend({}, trendYear),
      fetchRecentActivities({}, 5)
    ]);

    const [totalEmployees, totalDepartments, totalManagers] = employeeDeptStats;
    const leaveCounts = leaveStats[0] || { pending: 0, approved: 0, rejected: 0 };

    res.status(200).json({
      status: 'success',
      data: {
        cards: {
          totalEmployees,
          totalDepartments,
          totalManagers,
          pendingLeaves: leaveCounts.pending,
          approvedLeaves: leaveCounts.approved,
          rejectedLeaves: leaveCounts.rejected,
          employeesOnLeaveToday: leavesToday.length
        },
        leavesToday,
        monthlyTrend,
        recentActivities,
        upcomingHolidays
      }
    });
  } else if (role === 'HR') {
    const [totalEmployees, pendingHrApprovals, holidayCount, newEmployees, recentRequests, monthlyTrend, recentActivities] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      LeaveRequest.countDocuments({ status: { $in: ['TEAM_LEAD_APPROVED', 'ESCALATED_TO_HR', 'PENDING'] }, isDeleted: false }),
      Holiday.countDocuments({ isDeleted: false, status: 'ACTIVE' }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, isDeleted: false }),
      LeaveRequest.find({ isDeleted: false })
        .populate('user', 'firstName lastName profileImage department')
        .populate('leaveType', 'name colorBadge')
        .sort({ createdAt: -1 })
        .limit(5),
      buildMonthlyTrend({}, trendYear),
      fetchRecentActivities({}, 5)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        cards: { totalEmployees, pendingHrApprovals, holidayCount, newEmployees },
        recentRequests,
        monthlyTrend,
        recentActivities,
        upcomingHolidays
      }
    });
  } else if (role === 'TEAM_LEAD') {
    const teamMembers = await User.find({ reportingManager: userId, isDeleted: false }).select('_id');
    const teamIds = teamMembers.map((m) => m._id);

    const teamQuery = teamIds.length > 0 ? { user: { $in: teamIds } } : { user: { $in: [userId] } };

    const [teamCount, pendingRequests, approvedRequests, teamOnLeaveToday, monthlyTrend, recentActivities] = await Promise.all([
      Promise.resolve(teamIds.length),
      LeaveRequest.countDocuments({ ...teamQuery, status: 'PENDING', isDeleted: false }),
      LeaveRequest.countDocuments({ ...teamQuery, status: { $in: ['HR_APPROVED', 'ADMIN_APPROVED', 'CEO_APPROVED'] }, isDeleted: false }),
      LeaveRequest.find({ ...teamQuery, status: { $in: ['HR_APPROVED', 'ADMIN_APPROVED', 'CEO_APPROVED'] }, fromDate: { $lte: today }, toDate: { $gte: today }, isDeleted: false })
        .populate('user', 'firstName lastName profileImage designation'),
      teamIds.length > 0 ? buildMonthlyTrend({ user: { $in: teamIds } }, trendYear) : buildMonthlyTrend({ user: userId }, trendYear),
      fetchRecentActivities({ $or: [{ user: userId }, { user: { $in: teamIds } }] }, 5)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        cards: { teamCount, pendingRequests, approvedRequests, teamOnLeaveTodayCount: teamOnLeaveToday.length },
        teamOnLeaveToday,
        monthlyTrend,
        recentActivities,
        upcomingHolidays
      }
    });
  } else {
    // EMPLOYEE DASHBOARD
    const [balance, pendingRequests, approvedLeaves, rejectedLeaves, recentLeaves, monthlyTrend, recentActivities] = await Promise.all([
      LeaveBalance.findOne({ user: userId, year: new Date().getFullYear() }).populate('allocations.leaveType'),
      LeaveRequest.countDocuments({ user: userId, status: { $in: ['PENDING', 'TEAM_LEAD_APPROVED', 'ESCALATED_TO_HR'] }, isDeleted: false }),
      LeaveRequest.countDocuments({ user: userId, status: { $in: ['HR_APPROVED', 'ADMIN_APPROVED', 'CEO_APPROVED'] }, isDeleted: false }),
      LeaveRequest.countDocuments({ user: userId, status: { $in: ['TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED'] }, isDeleted: false }),
      LeaveRequest.find({ user: userId, isDeleted: false }).populate('leaveType', 'name colorBadge').sort({ createdAt: -1 }).limit(5),
      buildMonthlyTrend({ user: userId }, trendYear),
      fetchRecentActivities({ user: userId }, 5)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        cards: { pendingRequests, approvedLeaves, rejectedLeaves },
        balance,
        upcomingHolidays,
        recentLeaves,
        monthlyTrend,
        recentActivities
      }
    });
  }
});

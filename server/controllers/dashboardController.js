import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { Holiday } from '../models/Holiday.js';
import { AuditLog } from '../models/AuditLog.js';
import { Attendance } from '../models/Attendance.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { runAutoCheckoutJob } from '../services/autoCheckoutService.js';

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

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  if (['ADMIN', 'CEO', 'HR'].includes(role)) {
    // Get CEO user IDs and active workforce IDs
    const [ceoUsers, validUsers, activeStaff] = await Promise.all([
      User.find({ role: 'CEO' }).select('_id'),
      User.find({ isDeleted: false }).select('_id'),
      User.find({ isDeleted: false, status: 'ACTIVE', role: { $ne: 'CEO' } }).select('_id')
    ]);
    const ceoIds = ceoUsers.map((u) => u._id.toString());
    const validUserIds = validUsers.map((u) => u._id);
    const activeStaffIds = new Set(activeStaff.map((u) => u._id.toString()));

    // Calculate today start and end in IST (Asia/Kolkata)
    const nowIST = new Date();
    const istDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(nowIST);
    const todayStart = new Date(`${istDateStr}T00:00:00.000+05:30`);
    const todayEnd = new Date(`${istDateStr}T23:59:59.999+05:30`);

    // Ensure auto check-out runs before fetching stats if past checkout time
    await runAutoCheckoutJob();

    const [employeeDeptStats, leaveStats, leavesToday, monthlyTrend, recentActivities, todayAttDocs, pendingTodayCount] = await Promise.all([
      Promise.all([
        User.countDocuments({ isDeleted: false, status: 'ACTIVE', role: { $ne: 'CEO' } }),
        Department.countDocuments({ isDeleted: false }),
        User.countDocuments({ role: 'TEAM_LEAD', isDeleted: false }),
        User.countDocuments({ createdAt: { $gte: startOfMonth }, isDeleted: false, role: { $ne: 'CEO' } })
      ]),
      LeaveRequest.aggregate([
        { $match: { isDeleted: false, user: { $in: validUserIds } } },
        {
          $group: {
            _id: null,
            pending: {
              $sum: {
                $cond: [{ $in: ['$status', ['PENDING', 'ESCALATED_TO_HR', 'TEAM_LEAD_APPROVED']] }, 1, 0]
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
        isDeleted: false,
        user: { $in: validUserIds }
      }).populate('user', 'firstName lastName employeeId department profileImage'),
      buildMonthlyTrend({}, trendYear),
      fetchRecentActivities({}, 5),
      Attendance.find({
        user: { $in: Array.from(activeStaffIds) },
        $or: [
          { date: { $gte: todayStart, $lte: todayEnd } },
          { clockIn: { $gte: todayStart, $lte: todayEnd } }
        ]
      }).select('user clockIn clockOut timeline date createdAt').sort({ date: -1, createdAt: -1 }),
      LeaveRequest.countDocuments({
        status: { $in: ['PENDING', 'ESCALATED_TO_HR', 'TEAM_LEAD_APPROVED'] },
        createdAt: { $gte: today },
        isDeleted: false,
        user: { $in: validUserIds }
      })
    ]);

    const [totalEmployees, totalDepartments, totalManagers, newEmployeesThisMonth] = employeeDeptStats;
    const leaveCounts = leaveStats[0] || { pending: 0, approved: 0, rejected: 0 };

    // Group attendances by user to get the latest state for each employee today
    const latestAttMap = new Map();
    (todayAttDocs || []).forEach(att => {
      const uId = att.user?.toString();
      if (uId && !latestAttMap.has(uId)) {
        latestAttMap.set(uId, att);
      }
    });

    let activeLoggedInCount = 0;
    const totalPresentCount = latestAttMap.size;

    latestAttMap.forEach(att => {
      let isActive = false;
      if (Array.isArray(att.timeline) && att.timeline.length > 0) {
        const lastTimeline = att.timeline[att.timeline.length - 1];
        if (lastTimeline) {
          if (['CLOCK_IN', 'LUNCH_IN'].includes(lastTimeline.type)) {
            isActive = true;
          } else if (['CLOCK_OUT', 'FORCE_CHECKOUT'].includes(lastTimeline.type)) {
            isActive = false;
          } else if (lastTimeline.type === 'LUNCH_OUT') {
            isActive = false;
          }
        }
      } else {
        isActive = Boolean(att.clockIn && !att.clockOut);
      }
      if (isActive) {
        activeLoggedInCount++;
      }
    });

    const todayLoggedIn = activeLoggedInCount;
    const empCount = totalEmployees || 1;
    const leavePct = Math.min(100, Math.round((leavesToday.length / empCount) * 100));

    const trends = {
      totalEmployees: newEmployeesThisMonth > 0 ? `+${newEmployeesThisMonth} New This Month` : `Active Workforce`,
      todayLoggedIn: `${activeLoggedInCount} Active Now • ${totalPresentCount} Present Today`,
      pendingLeaves: leaveCounts.pending > 0 ? (pendingTodayCount > 0 ? `+${pendingTodayCount} New Today` : `${leaveCounts.pending} Pending Review`) : `All Caught Up`,
      employeesOnLeaveToday: `${leavesToday.length} On Leave Today (${leavePct}%)`
    };

    res.status(200).json({
      status: 'success',
      data: {
        cards: {
          totalEmployees,
          totalDepartments,
          todayLoggedIn,
          activeLoggedIn: activeLoggedInCount,
          totalPresentToday: totalPresentCount,
          totalManagers,
          pendingLeaves: leaveCounts.pending,
          pendingHrApprovals: leaveCounts.pending,
          approvedLeaves: leaveCounts.approved,
          rejectedLeaves: leaveCounts.rejected,
          employeesOnLeaveToday: leavesToday.length,
          trends
        },
        leavesToday,
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

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import UiverseDropdown from '../components/UiverseDropdown';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { UiverseStarButton } from '../components/UiverseStarButton';
import { Modal } from '../components/Modal';
import { FaceCameraModal } from '../components/FaceCameraModal';
import { AttendanceTimelineModal } from '../components/AttendanceTimelineModal';
import blueBgCard from '../assets/ChatGPT Image Aug 4, 2026, 04_51_49 PM.webp';
import greenBgCard from '../assets/ChatGPT Image Aug 4, 2026, 04_51_43 PM.webp';
import purpleBgCard from '../assets/ChatGPT Image Aug 4, 2026, 04_51_54 PM.webp';
import orangeBgCard from '../assets/ChatGPT Image Aug 4, 2026, 04_51_34 PM.webp';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Home,
  Briefcase,
  Play,
  Square,
  TrendingUp,
  Filter,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  MoreVertical,
  CalendarCheck,
  UserCheck,
  Search,
  LogIn,
  LogOut,
  X,
  Download,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react';

const CARD_THEMES = [
  {
    cardBg: "from-[#eef4ff] via-[#f0f7ff] to-[#f8fafc] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-blue-200/80 hover:border-blue-400",
    avatarBg: "!bg-gradient-to-tr !from-blue-600 !via-indigo-500 !to-cyan-400",
    pillBg: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
    nameHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    btnBg: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 shadow-blue-500/20 group-hover:shadow-blue-500/35"
  },
  {
    cardBg: "from-[#f0fdf4] via-[#ecfdf5] to-[#f8fafc] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-emerald-200/80 hover:border-emerald-400",
    avatarBg: "!bg-gradient-to-tr !from-emerald-600 !via-teal-500 !to-green-400",
    pillBg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
    nameHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    btnBg: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-emerald-500/20 group-hover:shadow-emerald-500/35"
  },
  {
    cardBg: "from-[#faf5ff] via-[#f5f3ff] to-[#f8fafc] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-purple-200/80 hover:border-purple-400",
    avatarBg: "!bg-gradient-to-tr !from-purple-600 !via-violet-500 !to-indigo-400",
    pillBg: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300",
    nameHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    btnBg: "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-purple-500/20 group-hover:shadow-purple-500/35"
  },
  {
    cardBg: "from-[#fff1f2] via-[#fff5f5] to-[#f8fafc] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-rose-200/80 hover:border-rose-400",
    avatarBg: "!bg-gradient-to-tr !from-rose-600 !via-pink-500 !to-red-400",
    pillBg: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300",
    nameHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    btnBg: "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 shadow-rose-500/20 group-hover:shadow-rose-500/35"
  },
  {
    cardBg: "from-[#fffbe6] via-[#fff7ed] to-[#f8fafc] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-amber-200/80 hover:border-amber-400",
    avatarBg: "!bg-gradient-to-tr !from-amber-600 !via-orange-500 !to-yellow-400",
    pillBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
    nameHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    btnBg: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 shadow-amber-500/20 group-hover:shadow-amber-500/35"
  },
  {
    cardBg: "from-[#ecfeff] via-[#f0fdfa] to-[#f8fafc] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-cyan-200/80 hover:border-cyan-400",
    avatarBg: "!bg-gradient-to-tr !from-cyan-600 !via-teal-500 !to-sky-400",
    pillBg: "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300",
    nameHover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
    btnBg: "bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 shadow-cyan-500/20 group-hover:shadow-cyan-500/35"
  }
];

const LIVE_CARD_PALETTES = [
  {
    leftBorder: 'border-l-[5px] border-l-purple-500',
    cardBg: 'bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 dark:from-purple-950/30 dark:to-slate-900 border-purple-200/80 dark:border-purple-800/80',
    avatarBg: '!bg-gradient-to-tr !from-purple-600 !to-indigo-500 text-white',
    badge: 'bg-purple-100/90 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/90 dark:border-purple-800/80 font-black'
  },
  {
    leftBorder: 'border-l-[5px] border-l-blue-500',
    cardBg: 'bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 dark:from-blue-950/30 dark:to-slate-900 border-blue-200/80 dark:border-blue-800/80',
    avatarBg: '!bg-gradient-to-tr !from-blue-600 !to-cyan-500 text-white',
    badge: 'bg-blue-100/90 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/80 font-black'
  },
  {
    leftBorder: 'border-l-[5px] border-l-teal-500',
    cardBg: 'bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 dark:from-teal-950/30 dark:to-slate-900 border-teal-200/80 dark:border-teal-800/80',
    avatarBg: '!bg-gradient-to-tr !from-teal-600 !to-emerald-500 text-white',
    badge: 'bg-teal-100/90 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/90 dark:border-teal-800/80 font-black'
  },
  {
    leftBorder: 'border-l-[5px] border-l-amber-500',
    cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:from-amber-950/30 dark:to-slate-900 border-amber-200/80 dark:border-amber-800/80',
    avatarBg: '!bg-gradient-to-tr !from-amber-500 !to-orange-500 text-white',
    badge: 'bg-amber-100/90 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/80 font-black'
  },
  {
    leftBorder: 'border-l-[5px] border-l-rose-500',
    cardBg: 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40 dark:from-rose-950/30 dark:to-slate-900 border-rose-200/80 dark:border-rose-800/80',
    avatarBg: '!bg-gradient-to-tr !from-rose-500 !to-pink-500 text-white',
    badge: 'bg-rose-100/90 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/90 dark:border-rose-800/80 font-black'
  },
  {
    leftBorder: 'border-l-[5px] border-l-purple-500',
    cardBg: 'bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 dark:from-purple-950/30 dark:to-slate-900 border-purple-200/80 dark:border-purple-800/80',
    avatarBg: '!bg-gradient-to-tr !from-purple-600 !to-indigo-500 text-white',
    badge: 'bg-purple-100/90 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/90 dark:border-purple-800/80 font-black'
  },
  {
    leftBorder: 'border-l-[5px] border-l-cyan-500',
    cardBg: 'bg-gradient-to-br from-cyan-50/70 via-white to-sky-50/40 dark:from-cyan-950/30 dark:to-slate-900 border-cyan-200/80 dark:border-cyan-800/80',
    avatarBg: '!bg-gradient-to-tr !from-cyan-600 !to-blue-500 text-white',
    badge: 'bg-cyan-100/90 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200/90 dark:border-cyan-800/80 font-black'
  }
];

export const Attendance = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [logs, setLogs] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'live'
  const [liveStatus, setLiveStatus] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [forceCheckoutUserId, setForceCheckoutUserId] = useState(null);
  const [forceCheckoutReason, setForceCheckoutReason] = useState('');
  const [forceCheckoutLoading, setForceCheckoutLoading] = useState(false);
  const [forceCheckoutSuccess, setForceCheckoutSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [workLocation, setWorkLocation] = useState('WFH');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Face Verification Camera Modal State
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [pendingClockAction, setPendingClockAction] = useState(null); // 'clockIn' | 'clockOut'

  // Daily Activity Timeline Modal State
  const [timelineModalItem, setTimelineModalItem] = useState(null);

  // Modal State for Image 2 Design
  const [historyModalEmp, setHistoryModalEmp] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('');
  const [modalDatePreset, setModalDatePreset] = useState('all');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);
  const [showModalSearchInput, setShowModalSearchInput] = useState(false);
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [selectedDetailLog, setSelectedDetailLog] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth()); // 0=Jan
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  const itemsPerPage = 7;
  const modalTopRef = useRef(null);

  const handleModalPageChange = (newPage) => {
    setModalPage(newPage);
    setTimeout(() => {
      if (modalTopRef.current) {
        const scrollContainer = modalTopRef.current.closest('[class*="overflow-y"]') 
          || modalTopRef.current.closest('.overflow-y-auto')
          || modalTopRef.current.closest('.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        } else {
          modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 50);
  };

  const getVisiblePages = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, 5];
    if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  const getEmpDisplayName = (u) => {
    if (!u || typeof u !== 'object') return 'Employee Member';
    if (u.role === 'CEO') return 'CEO Executive';

    const first = (u.firstName || '').trim();
    const last = (u.lastName || '').trim();
    let name = `${first} ${last}`.trim();

    if (first && first !== 'User' && first !== 'Employee') {
      return name;
    }

    if (u.email) {
      const emailName = u.email.split('@')[0];
      const parts = emailName.split(/[\._-]/);
      const formatted = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      if (formatted && formatted.toLowerCase() !== 'user' && formatted.toLowerCase() !== 'employee') {
        return formatted;
      }
    }

    if (u.role === 'TEAM_LEAD') return 'Team Lead';
    if (u.role === 'HR') return 'HR';
    if (u.role === 'ADMIN') return 'Admin';

    return 'Employee Member';
  };

  const getEmpDept = (u) => {
    if (u && typeof u === 'object') {
      if (u.department?.name) return u.department.name;
      if (typeof u.department === 'string' && u.department) return u.department;
    }
    return '—';
  };

  const getEmpId = (u) => {
    if (u && typeof u === 'object' && u.employeeId) return u.employeeId;
    return '—';
  };

  const parseTimeFromNote = (noteStr, defaultDateStr) => {
    if (!noteStr) return defaultDateStr;
    const match = noteStr.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm))/i);
    if (match) {
      const timeStr = match[1];
      const baseDate = new Date(defaultDateStr || Date.now());
      const datePart = baseDate.toISOString().split('T')[0];
      const parsed = new Date(`${datePart} ${timeStr}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return defaultDateStr;
  };

  const getDetailLogTimeline = (log) => {
    if (!log) return [];
    let events = [];
    if (Array.isArray(log.timeline) && log.timeline.length > 0) {
      events = [...log.timeline];
    } else {
      if (log.clockIn) {
        events.push({ type: 'CLOCK_IN', timestamp: log.clockIn, note: 'First Clock In of the day' });
      }
      if (log.lunchOut) {
        events.push({ type: 'LUNCH_OUT', timestamp: log.lunchOut });
      }
      if (log.lunchIn) {
        events.push({ type: 'LUNCH_IN', timestamp: log.lunchIn });
      }
      if (log.notes && typeof log.notes === 'string') {
        const parts = log.notes.split('|');
        parts.forEach((part) => {
          const trimmed = part.trim();
          if (trimmed.includes('Force checked out')) {
            const parsedTime = parseTimeFromNote(trimmed, log.clockOut || log.updatedAt);
            events.push({ type: 'FORCE_CHECKOUT', timestamp: parsedTime, note: trimmed });
          } else if (trimmed.includes('Re-clocked in')) {
            const parsedTime = parseTimeFromNote(trimmed, log.updatedAt);
            events.push({ type: 'CLOCK_IN', timestamp: parsedTime, note: trimmed });
          }
        });
      }
      if (log.clockOut && !events.some((e) => e.type === 'CLOCK_OUT' || e.type === 'FORCE_CHECKOUT')) {
        events.push({ type: 'CLOCK_OUT', timestamp: log.clockOut });
      }
    }

    const typeOrder = { 'CLOCK_IN': 1, 'LUNCH_OUT': 2, 'LUNCH_IN': 3, 'FORCE_CHECKOUT': 4, 'CLOCK_OUT': 5 };
    return events.sort((a, b) => {
      const diff = new Date(a.timestamp) - new Date(b.timestamp);
      if (diff !== 0) return diff;
      
      const aIsReclock = a.note?.includes('Re-clocked in');
      const bIsReclock = b.note?.includes('Re-clocked in');
      if (aIsReclock && !bIsReclock) return 1;
      if (bIsReclock && !aIsReclock) return -1;

      return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
    });
  };

  const getLatestClockInTimestamp = (item) => {
    if (!item) return null;
    const logObj = item.attendance || item;
    const timeline = getDetailLogTimeline(logObj);
    const loginEvents = timeline.filter((e) => e.type === 'CLOCK_IN');
    if (loginEvents.length > 0) {
      return loginEvents[loginEvents.length - 1].timestamp;
    }
    return item.clockInTime || item.lastClockInTime || logObj.clockIn || null;
  };

  const isLogActiveSession = (log) => {
    if (!log || !log.clockIn || log.isSyntheticAbsent || log.status === 'ABSENT' || log.status === 'WEEK_OFF') return false;
    
    // Check if the log belongs to today
    const logDateStr = getLocalDateString(log.clockIn || log.date);
    const todayStr = getLocalDateString(new Date());
    const isTodayDoc = logDateStr === todayStr;

    // If clockOut is missing or undefined for today's record, it is definitely an active session!
    if (isTodayDoc && !log.clockOut) return true;

    // Otherwise check timeline's latest event
    const timeline = getDetailLogTimeline(log);
    if (timeline.length > 0) {
      const lastEvent = timeline[timeline.length - 1];
      if (lastEvent.type === 'CLOCK_IN' || lastEvent.type === 'LUNCH_IN') {
        return true;
      }
    }
    return false;
  };

  const getEffectiveLogoutTime = (log) => {
    if (!log) return null;
    if (isLogActiveSession(log)) return null;
    const timeline = getDetailLogTimeline(log);
    const lastCheckout = [...timeline].reverse().find((e) => e.type === 'CLOCK_OUT' || e.type === 'FORCE_CHECKOUT');
    return lastCheckout?.timestamp || log.clockOut || null;
  };

  const getAllLoginTimes = (log) => {
    if (!log) return '--';
    const timeline = getDetailLogTimeline(log);
    const loginEvents = timeline.filter((e) => e.type === 'CLOCK_IN');
    if (loginEvents.length === 0) return log.clockIn ? formatClockTime(log.clockIn) : '--';
    const formatted = loginEvents.map((e) => formatClockTime(e.timestamp));
    return Array.from(new Set(formatted)).join(', ');
  };

  const getAllLogoutTimes = (log) => {
    if (!log) return '--';
    if (isLogActiveSession(log)) return '--';
    const timeline = getDetailLogTimeline(log);
    const logoutEvents = timeline.filter((e) => e.type === 'CLOCK_OUT' || e.type === 'FORCE_CHECKOUT');
    if (logoutEvents.length === 0) return log.clockOut ? formatClockTime(log.clockOut) : '--';
    const formatted = logoutEvents.map((e) => formatClockTime(e.timestamp));
    return Array.from(new Set(formatted)).join(', ');
  };

  const formatWorkDuration = (log) => {
    if (!log || !log.clockIn) return '--';
    if (isLogActiveSession(log)) return 'In Progress ⏱️';
    const effectiveLogout = getEffectiveLogoutTime(log);
    if (!effectiveLogout && !log.clockOut) return 'In Progress ⏱️';

    const start = new Date(log.clockIn);
    const end = new Date(effectiveLogout || log.clockOut);
    let totalMins = Math.max(0, Math.round((end - start) / (1000 * 60)));

    if (log.lunchOut && log.lunchIn) {
      const lunchMins = Math.max(0, Math.round((new Date(log.lunchIn) - new Date(log.lunchOut)) / (1000 * 60)));
      totalMins = Math.max(0, totalMins - lunchMins);
    }

    if (log.extraBreakMs) {
      const extraMins = Math.max(0, Math.round(log.extraBreakMs / (1000 * 60)));
      totalMins = Math.max(0, totalMins - extraMins);
    }

    if (totalMins < 1) return '00h 00m';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
  };

  const formatClockTime = (timeStr) => {
    if (!timeStr) return '--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Group attendance logs by Employee & include directory employees according to role permissions
  const groupedEmployeeMap = {};

  const currentUserId = user?._id || user?.id;
  const userRole = user?.role;

  // Role based employee filtering:
  // - EMPLOYEE: Only show self
  // - TEAM_LEAD: Only show self and direct reports
  // - HR / ADMIN / ADMIN / CEO: Show all non-CEO employees
  let roleFilteredEmployees = allEmployees;

  if (userRole === 'EMPLOYEE') {
    roleFilteredEmployees = allEmployees.filter(
      (emp) => emp._id === currentUserId || emp.id === currentUserId
    );
    if (roleFilteredEmployees.length === 0 && user) {
      roleFilteredEmployees = [user];
    }
  } else if (userRole === 'TEAM_LEAD') {
    roleFilteredEmployees = allEmployees.filter((emp) => {
      const isSelf = emp._id === currentUserId || emp.id === currentUserId;
      const rMgr = emp.reportingManager?._id || emp.reportingManager;
      const isDirectReport = rMgr === currentUserId;
      return isSelf || isDirectReport;
    });
    
    // Ensure the Team Lead's own card is always included
    const hasSelf = roleFilteredEmployees.some(emp => emp._id === currentUserId || emp.id === currentUserId);
    if (!hasSelf && user) {
      roleFilteredEmployees.unshift(user);
    }
  } else {
    // For HR/ADMIN, if they are not in allEmployees, add them
    const hasSelf = roleFilteredEmployees.some(emp => emp._id === currentUserId || emp.id === currentUserId);
    if (!hasSelf && user && user.role !== 'CEO') {
      roleFilteredEmployees.unshift(user);
    }
  }

  // 1. Pre-fill allowed directory employees (excluding CEO)
  roleFilteredEmployees.forEach((emp) => {
    if (emp && emp.role !== 'CEO') {
      const empId = emp._id || emp.id;
      groupedEmployeeMap[empId] = {
        empId,
        user: emp,
        logs: [],
        totalDays: 0,
        presentCount: 0,
        wfhCount: 0,
        lateCount: 0,
        halfDayCount: 0,
        absentCount: 0
      };
    }
  });

  // 2. Attach actual attendance logs to employee cards
  logs.forEach((log) => {
    const empId = log.user?._id || log.user || 'unknown';
    if (!groupedEmployeeMap[empId]) {
      const logUserId = typeof log.user === 'object' ? log.user?._id : log.user;
      const isSelf = logUserId === currentUserId;

      let isAllowed = true;
      if (userRole === 'EMPLOYEE') {
        isAllowed = isSelf;
      }

      if (isAllowed && log.user && log.user.role !== 'CEO') {
        groupedEmployeeMap[empId] = {
          empId,
          user: log.user,
          logs: [],
          totalDays: 0,
          presentCount: 0,
          wfhCount: 0,
          lateCount: 0,
          halfDayCount: 0,
          absentCount: 0
        };
      }
    }

    if (groupedEmployeeMap[empId]) {
      groupedEmployeeMap[empId].logs.push(log);
      groupedEmployeeMap[empId].totalDays += 1;
      if (log.workLocation === 'WFH') groupedEmployeeMap[empId].wfhCount += 1;
      if (log.status === 'LATE') {
        groupedEmployeeMap[empId].lateCount += 1;
        groupedEmployeeMap[empId].presentCount += 1; // LATE = present with late arrival
      } else if (log.status === 'HALF_DAY') {
        groupedEmployeeMap[empId].halfDayCount += 1;
        groupedEmployeeMap[empId].presentCount += 1; // HALF_DAY = still came in
      } else if (log.status === 'ABSENT') {
        groupedEmployeeMap[empId].absentCount += 1;
      } else {
        // PRESENT, OVER_DUTY, OD — all count as present
        groupedEmployeeMap[empId].presentCount += 1;
      }
    }
  });

  const employeeGroupList = Object.values(groupedEmployeeMap);

  const filteredEmployeeGroupList = employeeGroupList.filter((empGroup) => {
    if (empGroup.user?.role === 'CEO' || getEmpDisplayName(empGroup.user) === 'CEO Executive') {
      return false;
    }

    if (searchQuery.trim()) {
      const name = getEmpDisplayName(empGroup.user).toLowerCase();
      const empId = getEmpId(empGroup.user).toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      if (!name.includes(query) && !empId.includes(query)) return false;
    }

    if (statusFilter) {
      if (statusFilter === 'PRESENT') return empGroup.presentCount > 0 || empGroup.logs.some((l) => l.status === 'PRESENT');
      if (statusFilter === 'LATE') return empGroup.lateCount > 0 || empGroup.logs.some((l) => l.status === 'LATE');
      if (statusFilter === 'HALF_DAY') return empGroup.halfDayCount > 0 || empGroup.logs.some((l) => l.status === 'HALF_DAY');
      if (statusFilter === 'WFH') return empGroup.wfhCount > 0 || empGroup.logs.some((l) => l.workLocation === 'WFH');
      if (statusFilter === 'ABSENT') return empGroup.absentCount > 0 || empGroup.logs.some((l) => l.status === 'ABSENT');
      if (statusFilter === 'OVER_DUTY') return empGroup.logs.some((l) => ['OVER_DUTY', 'OD'].includes(l.status));
    }

    return true;
  });

  const getLocalDateString = (dateVal) => {
    if (!dateVal) return '';
    const dateStr = typeof dateVal === 'string' ? dateVal : (dateVal instanceof Date ? dateVal.toISOString() : String(dateVal));
    if (dateStr.endsWith('T00:00:00.000Z')) {
      const d = new Date(dateVal);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    const d = new Date(dateVal);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to generate history records (all days of current month + past 90 days)
  const getEmployeeFullHistory = (empGroup) => {
    if (!empGroup) return [];

    const existingMap = {};
    (empGroup.logs || []).forEach((log) => {
      const logDateVal = log.clockIn || log.date;
      if (logDateVal) {
        const dStr = getLocalDateString(logDateVal);
        existingMap[dStr] = log;
      }
    });

    const fullHistory = [];
    const today = new Date();
    const todayStr = getLocalDateString(today);

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);

    // Timeline from last day of current month down to 90 days ago
    const currDate = new Date(lastDayOfCurrentMonth);
    const minPastDate = new Date(today);
    minPastDate.setDate(today.getDate() - 90);

    while (currDate >= minPastDate) {
      const dStr = getLocalDateString(currDate);

      if (existingMap[dStr]) {
        fullHistory.push(existingMap[dStr]);
      } else {
        const isPastDay = dStr < todayStr;
        const isToday = dStr === todayStr;
        const isSunday = currDate.getDay() === 0;

        if (isSunday) {
          fullHistory.push({
            _id: `weekoff-${empGroup.empId}-${dStr}`,
            date: new Date(currDate).toISOString(),
            user: empGroup.user,
            clockIn: null,
            clockOut: null,
            workLocation: 'IN_OFFICE',
            status: 'WEEK_OFF',
            isSyntheticAbsent: true
          });
        } else if (isPastDay || isToday) {
          fullHistory.push({
            _id: `absent-${empGroup.empId}-${dStr}`,
            date: new Date(currDate).toISOString(),
            user: empGroup.user,
            clockIn: null,
            clockOut: null,
            workLocation: 'IN_OFFICE',
            status: 'ABSENT',
            isSyntheticAbsent: true
          });
        } else if (currDate.getMonth() === currentMonth) {
          // Future days of the current month
          fullHistory.push({
            _id: `future-${empGroup.empId}-${dStr}`,
            date: new Date(currDate).toISOString(),
            user: empGroup.user,
            clockIn: null,
            clockOut: null,
            workLocation: 'IN_OFFICE',
            status: 'UPCOMING',
            isSyntheticAbsent: true
          });
        }
      }
      currDate.setDate(currDate.getDate() - 1);
    }
    return fullHistory.sort((a, b) => new Date(a.clockIn || a.date) - new Date(b.clockIn || b.date));
  };

  // ===== EXCEL REPORT FUNCTIONS =====
  // Get month-filtered stats for a single employee group
  const getMonthFilteredStats = (emp) => {
    const filtered = (emp.logs || []).filter(log => {
      const d = new Date(log.clockIn || log.date);
      return d.getMonth() === reportMonth && d.getFullYear() === reportYear;
    });
    const stats = { totalDays: filtered.length, presentCount: 0, wfhCount: 0, lateCount: 0, halfDayCount: 0, absentCount: 0 };
    filtered.forEach(log => {
      if (log.workLocation === 'WFH') stats.wfhCount++;
      if (log.status === 'LATE') { stats.lateCount++; stats.presentCount++; }
      else if (log.status === 'HALF_DAY') { stats.halfDayCount++; stats.presentCount++; }
      else if (log.status === 'ABSENT') { stats.absentCount++; }
      else { stats.presentCount++; }
    });
    return stats;
  };

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const handleDownloadExcel = () => {
    const headers = ['#', 'Employee Name', 'Employee ID', 'Department', 'Month', 'Total Days', 'Present Days', 'WFH Days', 'Late Logins', 'Half Days', 'Absent Days'];
    const rows = filteredEmployeeGroupList.map((emp, idx) => {
      const s = getMonthFilteredStats(emp);
      return [
        idx + 1,
        getEmpDisplayName(emp.user),
        getEmpId(emp.user),
        getEmpDept(emp.user),
        `${MONTH_NAMES[reportMonth]} ${reportYear}`,
        s.totalDays,
        s.presentCount,
        s.wfhCount,
        s.lateCount,
        s.halfDayCount,
        s.absentCount
      ];
    });

    // Build CSV content with BOM for Excel to read UTF-8 properly
    const bom = '\uFEFF';
    const csvContent = bom + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    const filterLabel = statusFilter ? `_${statusFilter}` : '_All';
    link.download = `Attendance_Report_${MONTH_NAMES[reportMonth]}_${reportYear}${filterLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenHistoryModal = (empGroup) => {
    setHistoryModalEmp(empGroup);
    setModalSearch('');
    setModalStatusFilter('');
    setModalDatePreset('this_month');
    setShowCustomDateInputs(false);
    setModalStartDate('');
    setModalEndDate('');
    setModalPage(1);
    setIsHistoryModalOpen(true);
  };

  const getComputedDateRange = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    if (modalDatePreset === 'this_month') {
      const start = getLocalDateString(new Date(year, month, 1, 12, 0, 0));
      const end = getLocalDateString(new Date(year, month + 1, 0, 12, 0, 0));
      return { start, end };
    }

    if (modalDatePreset === 'last_month') {
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonth = month === 0 ? 11 : month - 1;
      const start = getLocalDateString(new Date(prevYear, prevMonth, 1, 12, 0, 0));
      const end = getLocalDateString(new Date(prevYear, prevMonth + 1, 0, 12, 0, 0));
      return { start, end };
    }

    if (modalDatePreset === 'last_30_days') {
      const d = new Date(year, month, today.getDate() - 30, 12, 0, 0);
      return {
        start: getLocalDateString(d),
        end: getLocalDateString(today)
      };
    }

    if (modalDatePreset === 'all') {
      return { start: '', end: '' };
    }

    return { start: modalStartDate, end: modalEndDate };
  };

  const currentEmpFullHistory = getEmployeeFullHistory(historyModalEmp);

  const modalFilteredLogs = currentEmpFullHistory.filter((log) => {
    const logDateVal = log.clockIn || log.date;
    const logDate = new Date(logDateVal);
    const logDateStr = getLocalDateString(logDateVal);
    const computedRange = getComputedDateRange();

    if (computedRange.start && logDateStr < computedRange.start) return false;
    if (computedRange.end && logDateStr > computedRange.end) return false;

    if (modalStatusFilter) {
      if (log.status !== modalStatusFilter) return false;
    }

    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      const dateFormatted = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
      const dayFormatted = logDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      const statusStr = (log.status || '').toLowerCase();
      if (!dateFormatted.includes(q) && !dayFormatted.includes(q) && !statusStr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalModalPages = Math.ceil(modalFilteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = modalFilteredLogs.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      setTodayAttendance(res.data.data.attendance);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLocationChange = async (logId, newLocation) => {
    try {
      await api.patch(`/attendance/${logId}`, { workLocation: newLocation });
      fetchAttendanceLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update work location');
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [logsRes, empRes] = await Promise.all([
        api.get('/attendance/logs', { params }),
        api.get('/employees')
      ]);

      setLogs(logsRes.data.data.logs || []);
      setSummary(logsRes.data.data.summary);
      setAllEmployees(empRes.data.data.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStatus = async () => {
    try {
      setLiveLoading(true);
      const res = await api.get('/attendance/live-status');
      setLiveStatus(res.data.data.liveStatus || []);
    } catch (err) {
      console.error('[Live Status Error]', err);
    } finally {
      setLiveLoading(false);
    }
  };

  const handleForceCheckout = async (userId) => {
    setForceCheckoutLoading(true);
    try {
      const res = await api.post(`/attendance/force-checkout/${userId}`, { reason: forceCheckoutReason });
      setForceCheckoutSuccess(res.data.message);
      setForceCheckoutUserId(null);
      setForceCheckoutReason('');
      fetchLiveStatus();
      setTimeout(() => setForceCheckoutSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Force checkout failed.');
    } finally {
      setForceCheckoutLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchAttendanceLogs();
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'live' && ['CEO', 'ADMIN', 'HR', 'TEAM_LEAD'].includes(user?.role)) {
      fetchLiveStatus();
      // Auto-refresh every 30s
      const interval = setInterval(fetchLiveStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleInitiateClockIn = () => {
    setPendingClockAction('clockIn');
    setIsFaceModalOpen(true);
  };

  const handleInitiateClockOut = () => {
    setPendingClockAction('clockOut');
    setIsFaceModalOpen(true);
  };

  const handleInitiateLunchOut = () => {
    setPendingClockAction('lunchOut');
    setIsFaceModalOpen(true);
  };

  const handleInitiateLunchIn = () => {
    setPendingClockAction('lunchIn');
    setIsFaceModalOpen(true);
  };

  const handleFaceVerificationSuccess = async (faceDescriptor) => {
    setActionLoading(true);
    try {
      if (pendingClockAction === 'clockIn') {
        await api.post('/attendance/clock-in', { workLocation, faceDescriptor });
      } else if (pendingClockAction === 'clockOut') {
        await api.post('/attendance/clock-out', { faceDescriptor });
      } else if (pendingClockAction === 'lunchOut') {
        await api.post('/attendance/lunch-out', { faceDescriptor });
      } else if (pendingClockAction === 'lunchIn') {
        await api.post('/attendance/lunch-in', { faceDescriptor });
      }
      setIsFaceModalOpen(false);
      setPendingClockAction(null);
      await fetchTodayStatus();
      await fetchAttendanceLogs();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to perform action.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-8">
      {/* Compact Header + Tabs */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 p-3.5 sm:p-4 shadow-2xs">
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Attendance & Daily Punch
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time attendance tracking and employee workforce logs
          </p>
        </div>

        {/* Tab Switcher — only for managers */}
        {['CEO', 'ADMIN', 'HR', 'TEAM_LEAD'].includes(user?.role) && (
          <div className="relative inline-grid grid-cols-2 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-full shadow-inner isolate border border-slate-300/50 dark:border-slate-700/50 mt-3 w-max">
            {/* Sliding Pill */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-500 ${
                activeTab === 'logs' 
                  ? 'bg-blue-600 border border-blue-500' 
                  : 'bg-emerald-600 border border-emerald-500'
              }`}
              style={{
                left: activeTab === 'logs' ? '4px' : '50%',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            />
            
            <button
              onClick={() => setActiveTab('logs')}
              className={`relative z-10 px-4 sm:px-6 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black transition-colors duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full ${
                activeTab === 'logs' ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              📋 Attendance Logs
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`relative z-10 px-4 sm:px-6 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black transition-colors duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full ${
                activeTab === 'live' ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === 'live' ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              Live Status
            </button>
          </div>
        )}
      </div>

      {/* Daily Punch Widget Banner */}
      {user?.role !== 'CEO' && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-blue-600/10 via-sky-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs relative z-[60]">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="p-3 rounded-2xl bg-primary text-white shadow-md shadow-primary/20 shrink-0 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  TODAY
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] font-black text-primary uppercase whitespace-nowrap">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5 truncate">
                {getLatestClockInTimestamp(todayAttendance)
                  ? `Logged In at ${new Date(getLatestClockInTimestamp(todayAttendance)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Not Logged In Yet'}
              </h3>

              {todayAttendance?.clockOut && (
                <p className="text-xs font-semibold text-emerald-500 mt-0.5 truncate">
                  Logged Out at {new Date(todayAttendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({formatWorkDuration(todayAttendance)} worked)
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
            {!todayAttendance?.clockIn ? (
              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
                <UiverseDropdown
                  options={[
                    { value: "WFH", label: "🏡 Remote / WFH" },
                    { value: "IN_OFFICE", label: "🏢 In-Office" },
                  ]}
                  value={workLocation}
                  onChange={(val) => setWorkLocation(val)}
                />

                <UiverseStarButton
                  disabled={actionLoading}
                  onClick={handleInitiateClockIn}
                  variant="emerald"
                  icon={Play}
                >
                  Login
                </UiverseStarButton>
              </div>
            ) : !todayAttendance?.clockOut ? (
              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
                {!todayAttendance.lunchOut ? (
                  <>
                    <UiverseStarButton
                      disabled={actionLoading}
                      onClick={handleInitiateLunchOut}
                      variant="amber"
                      icon={Square}
                    >
                      Lunch Out
                    </UiverseStarButton>
                    <UiverseStarButton
                      disabled={actionLoading}
                      onClick={handleInitiateClockOut}
                      variant="checkout"
                      icon={Square}
                    >
                      Logout
                    </UiverseStarButton>
                  </>
                ) : !todayAttendance.lunchIn ? (
                  <UiverseStarButton
                    disabled={actionLoading}
                    onClick={handleInitiateLunchIn}
                    variant="emerald"
                    icon={Play}
                  >
                    Lunch In
                  </UiverseStarButton>
                ) : (
                  <UiverseStarButton
                    disabled={actionLoading}
                    onClick={handleInitiateClockOut}
                    variant="checkout"
                    icon={Square}
                  >
                    Logout
                  </UiverseStarButton>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-2 w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-nowrap">
                  <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Logged Out
                  </div>

                  <div className="min-w-0 flex-1 sm:flex-initial flex justify-end">
                    <UiverseDropdown
                      options={[
                        { value: "WFH", label: "🏡 Remote / WFH" },
                        { value: "IN_OFFICE", label: "🏢 In-Office" },
                      ]}
                      value={workLocation}
                      onChange={(val) => setWorkLocation(val)}
                    />
                  </div>
                </div>

                <div className="w-full sm:w-auto flex justify-center sm:block mt-1 sm:mt-0">
                  <UiverseStarButton
                    disabled={actionLoading}
                    onClick={handleInitiateClockIn}
                    variant="emerald"
                    icon={Play}
                  >
                    Login Again
                  </UiverseStarButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIVE STATUS TAB ── */}
      {activeTab === 'live' && ['CEO', 'ADMIN', 'HR', 'TEAM_LEAD'].includes(user?.role) && (
        <div className="space-y-4">
          {/* Success toast */}
          {forceCheckoutSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {forceCheckoutSuccess}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Employee Live Status</h2>
              <p className="text-xs text-slate-400 font-medium">Real-time login status — auto refreshes every 30s</p>
            </div>
            <button
              onClick={fetchLiveStatus}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
            >
              🔄 Refresh
            </button>
          </div>

          {liveLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium animate-pulse">Loading live status...</div>
          ) : liveStatus.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">No employee data found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStatus.map((item, idx) => {
                const emp = item.employee;
                const palette = LIVE_CARD_PALETTES[idx % LIVE_CARD_PALETTES.length];

                const isCheckedOut = item.statusLabel === 'CHECKED_OUT';
                const isCheckedIn = item.statusLabel === 'CHECKED_IN';
                const isOnLunch = item.statusLabel === 'ON_LUNCH';

                const canForceCheckout = isCheckedIn || isOnLunch;

                const displayClockIn = getLatestClockInTimestamp(item);

                // Card background & border style matching Image 1
                let cardStyle = `${palette.cardBg} ${palette.leftBorder}`;
                let badgeStyle = palette.badge;
                let badgeText = 'Not Logged In';
                let dotClass = 'bg-slate-400';

                if (isCheckedOut) {
                  cardStyle = 'bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-emerald-100/50 dark:from-emerald-950/40 dark:to-slate-900 border-emerald-300/80 dark:border-emerald-800 border-l-[4px] border-l-emerald-500 relative overflow-hidden';
                  badgeStyle = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800';
                  badgeText = 'Logged Out';
                  dotClass = 'bg-emerald-500';
                } else if (isCheckedIn) {
                  cardStyle = 'bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-sky-100/50 dark:from-blue-950/40 dark:to-slate-900 border-blue-300/80 dark:border-blue-800 border-l-[4px] border-l-blue-600 relative overflow-hidden';
                  badgeStyle = 'bg-emerald-500 text-white font-extrabold shadow-xs';
                  badgeText = 'Login';
                  dotClass = 'bg-white animate-pulse';
                } else if (isOnLunch) {
                  cardStyle = 'bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-amber-100/50 dark:from-amber-950/40 dark:to-slate-900 border-amber-300/80 dark:border-amber-800 border-l-[4px] border-l-amber-500 relative overflow-hidden';
                  badgeStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/80';
                  badgeText = 'On Lunch Break';
                  dotClass = 'bg-amber-500 animate-pulse';
                }

                return (
                  <div
                    key={emp._id}
                    onClick={() => setTimelineModalItem(item)}
                    className={`rounded-3xl border p-4 sm:p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4 cursor-pointer ${cardStyle}`}
                  >
                    {/* Background watermark illustration for Logged Out / Logged In cards */}
                    {(isCheckedOut || isCheckedIn) && (
                      <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 dark:opacity-10 text-emerald-600 dark:text-emerald-400">
                        <svg className="w-32 h-32" viewBox="0 0 200 200" fill="currentColor">
                          <path d="M40 180 L40 100 L80 60 L120 100 L120 180 Z M130 180 L130 120 L160 100 L190 120 L190 180 Z" opacity="0.6"/>
                          <circle cx="160" cy="60" r="15" opacity="0.4"/>
                        </svg>
                      </div>
                    )}

                    {/* Employee Info Header */}
                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          user={emp}
                          size="w-10 h-10 text-xs font-black shrink-0"
                          customBg={palette.avatarBg}
                          className="ring-2 ring-white dark:ring-slate-800 shadow-md"
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate leading-tight">
                            {getEmpDisplayName(emp)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                            {getEmpId(emp)} • {getEmpDept(emp)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black shrink-0 shadow-2xs tracking-wide ${badgeStyle}`}>
                          {(!isCheckedOut) && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
                          <span>{badgeText}</span>
                        </span>
                      </div>
                    </div>

                    {/* 4 Metric Widget Tiles (Clock In, Clock Out, Location, Hours) */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1 relative z-10">
                      {/* Clock In Tile */}
                      <div className="p-2.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/40 flex items-center gap-2.5 min-w-0 shadow-2xs">
                        <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-purple-600/80 dark:text-purple-300/80 uppercase tracking-wider block leading-none">Clock In</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                            {displayClockIn ? new Date(displayClockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Clock Out Tile */}
                      <div className="p-2.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-100/80 dark:border-orange-900/40 flex items-center gap-2.5 min-w-0 shadow-2xs">
                        <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-orange-600/80 dark:text-orange-300/80 uppercase tracking-wider block leading-none">Clock Out</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                            {item.clockOutTime ? new Date(item.clockOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Location Tile */}
                      <div className="p-2.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/40 flex items-center gap-2.5 min-w-0 shadow-2xs">
                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-blue-600/80 dark:text-blue-300/80 uppercase tracking-wider block leading-none">Location</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                            {item.workLocation === 'WFH' ? '🏡 WFH' : item.workLocation === 'IN_OFFICE' ? '🏢 Office' : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Hours Tile */}
                      <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/80 dark:border-emerald-900/40 flex items-center gap-2.5 min-w-0 shadow-2xs">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-emerald-600/80 dark:text-emerald-300/80 uppercase tracking-wider block leading-none">Hours</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                            {(isCheckedIn || isOnLunch) ? '⏱ Active' : (item.totalHours ? (
                              (() => {
                                const h = Math.floor(item.totalHours);
                                const m = Math.round((item.totalHours - h) * 60);
                                if (h === 0) return `${m}m`;
                                if (m === 0) return `${h}h`;
                                return `${h}h ${m}m`;
                              })()
                            ) : (item.clockInTime && !item.clockOutTime ? '⏱ Active' : '—'))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Force Checkout Action Bar */}
                    {canForceCheckout && (
                      <div className="pt-2.5 border-t border-slate-100/80 dark:border-slate-800/80 relative z-10" onClick={(e) => e.stopPropagation()}>
                        {forceCheckoutUserId === emp._id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={forceCheckoutReason}
                              onChange={(e) => setForceCheckoutReason(e.target.value)}
                              placeholder="Reason (optional)..."
                              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleForceCheckout(emp._id)}
                                disabled={forceCheckoutLoading}
                                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black transition-all disabled:opacity-50 shadow-xs"
                              >
                                {forceCheckoutLoading ? 'Processing...' : '✓ Confirm Force Check-Out'}
                              </button>
                              <button
                                onClick={() => { setForceCheckoutUserId(null); setForceCheckoutReason(''); }}
                                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold hover:bg-slate-200 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setForceCheckoutUserId(emp._id)}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 border border-rose-200/90 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 text-[11px] font-black hover:from-rose-100 hover:to-pink-100 transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:scale-[1.01] active:scale-[0.99]"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Force Check-Out
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Show rest of page only when logs tab is active */}
      {activeTab === 'logs' && (
      <>



      {/* Filter Bar */}
      {user?.role !== 'EMPLOYEE' && (
        <div className="glass-card p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs relative z-50">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="relative w-full max-w-[260px] sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee name or ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-row items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto mt-1 sm:mt-0">
            <div className="hidden lg:block text-[11px] sm:text-xs font-extrabold text-slate-400 mr-2">
              Showing {filteredEmployeeGroupList.length} Card{filteredEmployeeGroupList.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
              <UiverseDropdown
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "PRESENT", label: "Present Only" },
                  { value: "LATE", label: "Late Only" },
                  { value: "HALF_DAY", label: "Half Day Only" },
                  { value: "WFH", label: "WFH / Remote" },
                  { value: "ABSENT", label: "Absent Only" },
                  { value: "OVER_DUTY", label: "Over Duty (OD)" },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
              />

              {user?.role !== 'EMPLOYEE' && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer shadow-xs hover:scale-105 whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  View Report
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center justify-center p-1.5 px-2.5 sm:px-3.5 sm:py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer shadow-xs hover:scale-105 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline ml-1.5">Download</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Grouped Employee Attendance Cards (Every Directory Employee Has A Card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full glass-card p-8 text-center text-slate-400 font-medium rounded-2xl">Loading attendance logs...</div>
        ) : filteredEmployeeGroupList.length > 0 ? (
          filteredEmployeeGroupList.map((empGroup, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            return (
              <div
                key={empGroup.empId}
                onClick={() => handleOpenHistoryModal(empGroup)}
                className={`relative overflow-hidden rounded-[26px] border bg-gradient-to-b ${theme.cardBg} p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-xl transition-all cursor-pointer group`}
              >
                {/* Top Section: Avatar, Info & Options icon */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      user={empGroup.user}
                      size="w-12 h-12 text-sm"
                      className={`${theme.avatarBg} shadow-md ring-2 ring-white/80 shrink-0`}
                    />
                    <div className="min-w-0">
                      <h3 className={`font-extrabold text-slate-900 dark:text-white text-base truncate capitalize tracking-tight ${theme.nameHover} transition-colors`}>
                        {getEmpDisplayName(empGroup.user)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                        {getEmpId(empGroup.user)} • {getEmpDept(empGroup.user)}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0">
                    <MoreVertical className="w-4.5 h-4.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Pill Tag: This Month */}
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold ${theme.pillBg}`}>
                    This Month
                  </span>
                </div>

                {/* 3 Stat Mini Cards Grid (Present, Late, On Leave/Absent) */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Present Stat */}
                  <div className="bg-[#ecfdf5] dark:bg-emerald-950/30 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between space-y-2">
                    <CalendarCheck className="w-5 h-5 text-[#059669] dark:text-emerald-400 stroke-[2.2]" />
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-[#059669] dark:text-emerald-400 block leading-none">
                        {empGroup.presentCount}
                      </span>
                      <span className="text-[11px] font-bold text-[#059669] dark:text-emerald-400/90 block mt-1">
                        Present
                      </span>
                    </div>
                  </div>

                  {/* Late Stat */}
                  <div className="bg-[#fff7ed] dark:bg-amber-950/30 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between space-y-2">
                    <Clock className="w-5 h-5 text-[#ea580c] dark:text-amber-400 stroke-[2.2]" />
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-[#ea580c] dark:text-amber-400 block leading-none">
                        {empGroup.lateCount}
                      </span>
                      <span className="text-[11px] font-bold text-[#ea580c] dark:text-amber-400/90 block mt-1">
                        Late
                      </span>
                    </div>
                  </div>

                  {/* On Leave / Absent Stat */}
                  <div className="bg-[#eff6ff] dark:bg-blue-950/30 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between space-y-2">
                    <UserCheck className="w-5 h-5 text-[#2563eb] dark:text-blue-400 stroke-[2.2]" />
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-[#2563eb] dark:text-blue-400 block leading-none">
                        {empGroup.wfhCount || 0}
                      </span>
                      <span className="text-[11px] font-bold text-[#2563eb] dark:text-blue-400/90 block mt-1">
                        On Leave
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Full-width View Details Gradient Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenHistoryModal(empGroup);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl ${theme.btnBg} hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all group-hover:shadow-lg`}
                >
                  <Eye className="w-4.5 h-4.5 stroke-[2.2]" />
                  <span>View Details</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full glass-card p-12 text-center text-slate-400 font-medium rounded-2xl">
            No attendance records found.
          </div>
        )}
      </div>

      {/* Full Attendance History Popup Modal (Matching Image 1 Phone Design) */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title=""
        maxWidth="max-w-4xl"
        hideCloseButton={true}
      >
        {historyModalEmp && (
          <div className="space-y-3.5 sm:space-y-4">
            {/* Sticky Top Header & Filter Controls Container */}
            <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 -mt-3 sm:-mt-4 pt-3 sm:pt-4 pb-3 space-y-3 border-b border-slate-100 dark:border-slate-800 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 shadow-2xs">
              {/* Navigation & Header Title Bar */}
              <div ref={modalTopRef} className="flex items-center justify-between min-h-[48px]">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
                  title="Back"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="flex flex-col items-center justify-center text-center flex-1 mx-2 min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight text-center">
                    Attendance History
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap leading-tight mt-0.5 text-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{getEmpDisplayName(historyModalEmp.user)}</span>
                    <span className="inline-flex items-center gap-1 sm:gap-1.5">
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-mono text-slate-400">{getEmpId(historyModalEmp.user)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 sm:gap-1.5">
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>{getEmpDept(historyModalEmp.user)}</span>
                    </span>
                  </p>
                </div>

                {/* Both Search & X Close buttons in the same flex row for 100% perfect vertical alignment */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModalSearchInput(!showModalSearchInput)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all shrink-0 shadow-2xs hover:scale-105 ${
                      showModalSearchInput || modalSearch
                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                    title="Search History"
                  >
                    <Search className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shrink-0 hover:scale-105 shadow-2xs"
                    title="Close Modal"
                  >
                    <X className="w-4.5 h-4.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Toggleable Search Bar Input */}
              {showModalSearchInput && (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by date, day, status..."
                    value={modalSearch}
                    onChange={(e) => {
                      setModalSearch(e.target.value);
                      setModalPage(1);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {modalSearch && (
                    <button
                      type="button"
                      onClick={() => setModalSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Top Filter Controls Bar */}
              <div className="flex items-center justify-between gap-2 flex-nowrap">
                {/* Date Range Selector Dropdown */}
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-2xs flex-1 min-w-0 max-w-xs">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <select
                    value={modalDatePreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModalDatePreset(val);
                      setModalPage(1);
                      if (val === 'custom') {
                        setShowCustomDateInputs(true);
                      } else {
                        setShowCustomDateInputs(false);
                      }
                    }}
                    className="bg-transparent text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 outline-none cursor-pointer w-full pr-1 truncate"
                  >
                    <option value="this_month" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">This Month</option>
                    <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All History (Last 90 Days)</option>
                    <option value="last_30_days" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Last 30 Days</option>
                    <option value="last_month" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Last Month</option>
                    <option value="custom" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Custom Date Range...</option>
                  </select>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-2xs shrink-0">
                  <select
                    value={modalStatusFilter}
                    onChange={(e) => {
                      setModalStatusFilter(e.target.value);
                      setModalPage(1);
                    }}
                    className="bg-transparent text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Status</option>
                    <option value="PRESENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Present</option>
                    <option value="LATE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Late</option>
                    <option value="ABSENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Absent</option>
                    <option value="WEEK_OFF" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Week Off</option>
                    <option value="HALF_DAY" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Half Day</option>
                  </select>
                </div>
              </div>

              {showCustomDateInputs && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 sm:px-3 sm:py-1.5 rounded-xl shadow-2xs text-xs font-bold text-slate-700 dark:text-slate-200 w-full max-w-full">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
                    <span className="text-[11px] sm:text-xs shrink-0 text-slate-500">From:</span>
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={(e) => {
                        setModalStartDate(e.target.value);
                        setModalPage(1);
                      }}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none text-[11px] sm:text-xs w-full min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
                    <span className="text-[11px] sm:text-xs shrink-0 text-slate-500">To:</span>
                    <input
                      type="date"
                      value={modalEndDate}
                      onChange={(e) => {
                        setModalEndDate(e.target.value);
                        setModalPage(1);
                      }}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none text-[11px] sm:text-xs w-full min-w-0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Container with outer soft background card container (Matching Image 1) */}
            <div className="overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden">
              <div className="w-full sm:min-w-[450px] bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl sm:rounded-3xl p-1.5 sm:p-3.5 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-2">
                {/* Header Column Labels Bar */}
                <div className="grid grid-cols-[1.1fr_1fr_1fr_0.9fr] sm:grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr] gap-1 sm:gap-2 px-2 sm:px-3.5 py-1 text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <div className="text-left">
                    DATE<br />
                    <span className="text-[9px] text-slate-400 font-bold">DAY</span>
                  </div>
                  <div className="text-left">
                    LOGIN<br />
                    <span className="text-[9px] text-slate-400 font-bold">LOGOUT</span>
                  </div>
                  <div className="text-center hidden sm:block">DURATION</div>
                  <div className="text-center">STATUS</div>
                  <div className="text-center">ACTION</div>
                </div>

                {/* Attendance Logs Cards Stack (Each Row as a distinct Card Box) */}
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => {
                    const dateObj = new Date(log.clockIn || log.date);
                    const isActiveSession = isLogActiveSession(log) || (log.clockIn && !log.clockOut);
                    const displayStatus = (isActiveSession && log.status === 'HALF_DAY') ? 'PRESENT' : log.status;
                    const isPresent = displayStatus === 'PRESENT';
                    const isLate = displayStatus === 'LATE';
                    const isAbsent = displayStatus === 'ABSENT';

                    return (
                      <div
                        key={log._id}
                        className="bg-white dark:bg-slate-800/90 rounded-2xl px-2 py-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs hover:shadow-md transition-all grid grid-cols-[1.1fr_1fr_1fr_0.9fr] sm:grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr] gap-1 sm:gap-2 items-center"
                      >
                        {/* DATE / DAY Column */}
                        <div className="flex items-center gap-2.5">
                          <div className="hidden sm:block p-2 rounded-xl shrink-0 bg-amber-100/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                            <Calendar className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight whitespace-nowrap">
                              <span className="hidden sm:inline">
                                {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="sm:hidden">
                                {`${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear().toString().slice(-2)}`}
                              </span>
                            </span>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-400 leading-tight mt-0.5 whitespace-nowrap">
                              {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                        </div>

                        {/* LOGIN / LOGOUT Column */}
                        <div className="flex flex-col font-extrabold text-left">
                          <span className={`text-xs sm:text-sm ${isPresent ? 'text-emerald-600 dark:text-emerald-400' : isLate ? 'text-amber-600 dark:text-amber-400' : log.clockIn ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 font-normal'}`}>
                            {log.clockIn ? formatClockTime(getLatestClockInTimestamp(log) || log.clockIn) : '--'}
                          </span>
                          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                            {log.clockOut ? formatClockTime(log.clockOut) : '--'}
                          </span>
                        </div>

                        {/* DURATION Column */}
                        <div className="font-extrabold text-slate-700 dark:text-slate-300 text-xs sm:text-sm whitespace-nowrap text-center hidden sm:block">
                          {log.clockIn ? formatWorkDuration(log) : <span className="text-slate-400 font-normal">--</span>}
                        </div>

                        {/* STATUS Column */}
                        <div className="text-center whitespace-nowrap">
                          {['OVER_DUTY', 'OD'].includes(log.status) ? (
                            <span className="px-1.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-extrabold text-[9.5px] sm:text-xs inline-block shadow-2xs border border-purple-200/80">
                              ⚡ Over Duty
                            </span>
                          ) : log.status === 'WEEK_OFF' ? (
                            <span className="px-1.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-purple-50 text-[#7c3aed] dark:bg-purple-950/60 dark:text-purple-300 font-extrabold text-[9.5px] sm:text-xs inline-block shadow-2xs border border-purple-100 dark:border-purple-900/40">
                              Week Off
                            </span>
                          ) : isPresent ? (
                            <span className="px-1.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-[#dcfce7] text-[#166534] dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-[9.5px] sm:text-xs inline-block shadow-2xs">
                              Present
                            </span>
                          ) : isLate ? (
                            <span className="px-1.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-[#ffedd5] text-[#9a3412] dark:bg-amber-950/60 dark:text-amber-300 font-extrabold text-[9.5px] sm:text-xs inline-block shadow-2xs">
                              Late
                            </span>
                          ) : isAbsent ? (
                            <span className="px-1.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-[#ffe4e6] text-[#9f1239] dark:bg-rose-950/60 dark:text-rose-300 font-extrabold text-[9.5px] sm:text-xs inline-block shadow-2xs">
                              Absent
                            </span>
                          ) : log.status === 'UPCOMING' ? (
                            <span className="px-1.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-extrabold text-[9.5px] sm:text-xs inline-block shadow-2xs">
                              Upcoming
                            </span>
                          ) : (
                            <span className="px-1.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-extrabold text-[9.5px] sm:text-xs inline-block shadow-2xs">
                              {log.status || 'Half Day'}
                            </span>
                          )}
                        </div>

                        {/* ACTION Column */}
                        <div className="text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailLog(log)}
                            className="px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-300 font-bold text-[10px] sm:text-xs inline-flex items-center gap-0.5 sm:gap-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 font-semibold bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    No attendance history records match the selected filter criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Pagination Footer Bar (Matching Image 1) */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
              <div className="text-xs font-semibold text-slate-500">
                Showing {modalFilteredLogs.length > 0 ? (modalPage - 1) * itemsPerPage + 1 : 0} to {Math.min(modalPage * itemsPerPage, modalFilteredLogs.length)} of {modalFilteredLogs.length} entries
              </div>

              <div className="flex items-center gap-1.5 max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden py-0.5">
                <button
                  type="button"
                  disabled={modalPage <= 1}
                  onClick={() => handleModalPageChange(Math.max(1, modalPage - 1))}
                  className="w-9 h-9 rounded-full border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-slate-700 transition-all text-xs cursor-pointer shadow-2xs shrink-0"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getVisiblePages(modalPage, totalModalPages).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => handleModalPageChange(pg)}
                    className={`w-9 h-9 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      modalPage === pg
                        ? 'bg-blue-600 text-white shadow-md border-2 border-slate-900 dark:border-white ring-2 ring-blue-500/20'
                        : 'border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={modalPage >= totalModalPages}
                  onClick={() => handleModalPageChange(Math.min(totalModalPages, modalPage + 1))}
                  className="w-9 h-9 rounded-full border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-slate-700 transition-all text-xs cursor-pointer shadow-2xs shrink-0"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Row Action View Detail Modal (Matching Image 1 Design) */}
      <Modal
        isOpen={Boolean(selectedDetailLog)}
        onClose={() => setSelectedDetailLog(null)}
        title=""
        maxWidth="max-w-lg"
      >
        {selectedDetailLog && (
          <div className="space-y-2.5 sm:space-y-3.5 font-sans text-slate-800 dark:text-slate-100">
            {/* Header Title with Subtext */}
            <div className="flex items-start justify-between pr-8">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-[#7c3aed] dark:text-purple-300">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span>Attendance Record Detail</span>
                </h3>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-0.5">
                  Detailed attendance information for the selected date
                </p>
              </div>
            </div>

            {/* Top Date & Status Banner Card */}
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#f5f3ff] dark:bg-indigo-950/40 border border-purple-100/80 dark:border-purple-900/40 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#ede9fe] dark:bg-purple-900/60 text-[#7c3aed] dark:text-purple-300 shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Date
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block">
                    {new Date(selectedDetailLog.clockIn || selectedDetailLog.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {['OVER_DUTY', 'OD'].includes(selectedDetailLog.status) && (
                  <span className="px-2.5 sm:px-3.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-black text-[11px] sm:text-xs inline-flex items-center gap-1.5 border border-purple-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                    <span>⚡ OVER DUTY (OD)</span>
                  </span>
                )}
                {selectedDetailLog.status === 'WEEK_OFF' && (
                  <span className="px-2.5 sm:px-3.5 py-1 rounded-full bg-[#f5f3ff] text-[#7c3aed] dark:bg-purple-950/70 dark:text-purple-300 font-black text-[11px] sm:text-xs inline-flex items-center gap-1.5 border border-purple-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]"></span>
                    <span>WEEK OFF</span>
                  </span>
                )}
                {selectedDetailLog.status === 'PRESENT' && (
                  <span className="px-2.5 sm:px-3.5 py-1 rounded-full bg-[#dcfce7] text-[#15803d] dark:bg-emerald-950/70 dark:text-emerald-300 font-black text-[11px] sm:text-xs inline-flex items-center gap-1.5 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>PRESENT</span>
                  </span>
                )}
                {selectedDetailLog.status === 'LATE' && (
                  <span className="px-2.5 sm:px-3.5 py-1 rounded-full bg-[#ffedd5] text-[#c2410c] dark:bg-amber-950/70 dark:text-amber-300 font-black text-[11px] sm:text-xs inline-flex items-center gap-1.5 border border-amber-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>LATE</span>
                  </span>
                )}
                {selectedDetailLog.status === 'ABSENT' && (
                  <span className="px-2.5 sm:px-3.5 py-1 rounded-full bg-[#ffe4e6] text-[#e11d48] dark:bg-rose-950/70 dark:text-rose-300 font-black text-[11px] sm:text-xs inline-flex items-center gap-1.5 border border-rose-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>ABSENT</span>
                  </span>
                )}
                {selectedDetailLog.status === 'UPCOMING' && (
                  <span className="px-2.5 sm:px-3.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-black text-[11px] sm:text-xs inline-flex items-center gap-1.5 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>UPCOMING</span>
                  </span>
                )}
                {!['PRESENT', 'LATE', 'ABSENT', 'UPCOMING', 'WEEK_OFF'].includes(selectedDetailLog.status) && (
                  <span className="px-2.5 sm:px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-black text-[11px] sm:text-xs border border-slate-200">
                    {selectedDetailLog.status || 'Half Day'}
                  </span>
                )}
              </div>
            </div>

            {/* Attendance Details Card */}
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 sm:space-y-2.5 shadow-2xs">
              {/* Login */}
              <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#7c3aed] dark:text-purple-400">
                    <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Login
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono text-right max-w-[200px] truncate">
                  {getAllLoginTimes(selectedDetailLog)}
                </span>
              </div>

              {/* Lunch Out */}
              <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-500 dark:text-orange-400">
                    <span className="text-sm">🍽️</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Lunch Out
                  </span>
                </div>
                <span className={`text-xs font-black font-mono ${selectedDetailLog.lunchOut ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                  {selectedDetailLog.lunchOut ? formatClockTime(selectedDetailLog.lunchOut) : '—'}
                </span>
              </div>

              {/* Lunch In */}
              <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400">
                    <span className="text-sm">🥗</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Lunch In
                  </span>
                </div>
                <span className={`text-xs font-black font-mono ${selectedDetailLog.lunchIn ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                  {selectedDetailLog.lunchIn ? formatClockTime(selectedDetailLog.lunchIn) : '—'}
                </span>
              </div>

              {/* Logout */}
              <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Logout
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono text-right max-w-[200px] truncate">
                  {getAllLogoutTimes(selectedDetailLog)}
                </span>
              </div>

              {/* Work Duration */}
              <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Work Duration
                  </span>
                </div>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                  {formatWorkDuration(selectedDetailLog)}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Location
                  </span>
                </div>
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-[11px] inline-flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
                  {selectedDetailLog.workLocation === 'WFH' ? '🏡 Home / WFH' : '🏢 In-Office'}
                </span>
              </div>
            </div>

            {/* Daily Activity Timeline Section for Selected Record */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs">
              <h5 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Daily Activity Log</span>
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                  {getDetailLogTimeline(selectedDetailLog).length} Event{getDetailLogTimeline(selectedDetailLog).length !== 1 ? 's' : ''}
                </span>
              </h5>

              {getDetailLogTimeline(selectedDetailLog).length === 0 ? (
                <div className="text-center py-3 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No activity log entries recorded for this date.
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-2.5 my-1">
                  {getDetailLogTimeline(selectedDetailLog).map((item, idx) => {
                    let badgeBg = 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
                    let dotBg = 'border-purple-600 bg-purple-500';
                    let label = 'Clock In';

                    if (item.type === 'CLOCK_OUT') {
                      badgeBg = 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
                      dotBg = 'border-orange-500 bg-orange-500';
                      label = 'Clock Out';
                    } else if (item.type === 'LUNCH_OUT') {
                      badgeBg = 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
                      dotBg = 'border-amber-500 bg-amber-500';
                      label = 'Lunch Out';
                    } else if (item.type === 'LUNCH_IN') {
                      badgeBg = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
                      dotBg = 'border-emerald-500 bg-emerald-500';
                      label = 'Lunch In';
                    } else if (item.type === 'FORCE_CHECKOUT') {
                      badgeBg = 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
                      dotBg = 'border-rose-600 bg-rose-600';
                      label = 'Force Checkout';
                    }

                    return (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-white dark:bg-slate-900 ${dotBg}`} />
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${badgeBg}`}>
                              {label}
                            </span>
                            {item.note && (
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                {item.note}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white font-mono shrink-0">
                            {formatClockTime(item.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Face Verification Modal for Login & Logout */}
      <FaceCameraModal
        isOpen={isFaceModalOpen}
        onClose={() => {
          setIsFaceModalOpen(false);
          setPendingClockAction(null);
        }}
        mode="verify"
        employeeName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''}
        employeeId={user?.email}
        onCaptureSuccess={handleFaceVerificationSuccess}
        isSubmitting={actionLoading}
      />

      {/* ===== ATTENDANCE REPORT MODAL via Portal ===== */}
      {isReportModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-6 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 sm:rounded-3xl border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl w-full h-full sm:h-auto sm:max-w-5xl flex flex-col sm:max-h-[92vh] overflow-y-auto sm:overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sm:bg-gradient-to-r sm:from-indigo-50/80 sm:via-blue-50/40 sm:to-white sm:dark:from-slate-800/80 sm:dark:to-slate-900 shrink-0 gap-4 sm:gap-0">
              <div className="flex items-start sm:items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl sm:rounded-2xl bg-blue-600 sm:bg-gradient-to-br sm:from-indigo-600 sm:to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 sm:shadow-indigo-500/25 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      Attendance Report
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 sm:text-slate-400 font-medium mt-0.5">
                      {filteredEmployeeGroupList.length} employee{filteredEmployeeGroupList.length !== 1 ? 's' : ''}
                      {' '}· {MONTH_NAMES[reportMonth]} {reportYear}
                      {statusFilter ? ` · ${statusFilter}` : ' · All Statuses'}
                    </p>
                  </div>
                </div>
                {/* Mobile Close Icon (Top Right) */}
                <button onClick={() => setIsReportModalOpen(false)} className="sm:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all">
                  <X className="w-6 h-6" strokeWidth={2.5} />
                </button>
              </div>

              {/* Action & Filters Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
                {/* Mobile Filters (Side-by-side) */}
                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:gap-2">
                  <select
                    value={reportMonth}
                    onChange={e => setReportMonth(Number(e.target.value))}
                    className="px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs w-full sm:w-auto"
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={reportYear}
                    onChange={e => setReportYear(Number(e.target.value))}
                    min="2000"
                    max="2050"
                    className="px-3 py-2 sm:py-1.5 w-24 rounded-xl sm:rounded-full bg-white dark:bg-slate-800 border border-blue-400 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs text-center"
                  />
                </div>
                
                {/* Download Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={handleDownloadExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-1.5 px-3.5 py-3 sm:py-2 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-emerald-500/25 hover:scale-105">
                    <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> Download Excel
                  </button>
                  {/* Filter Icon button (from reference image - hidden on desktop as it's already there) */}
                  <div className="sm:hidden w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs text-rose-500">
                    <Filter className="w-4 h-4" />
                  </div>
                </div>

                {/* Desktop Close Icon */}
                <button onClick={() => setIsReportModalOpen(false)} className="hidden sm:flex w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white items-center justify-center transition-all cursor-pointer shadow-md shadow-red-500/25 hover:scale-105 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Summary Stats Grid (Responsive) */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 px-4 py-4 sm:px-5 sm:py-3 bg-white sm:bg-slate-50/80 dark:bg-slate-900 sm:dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto">
              {(() => {
                const allStats = filteredEmployeeGroupList.map(e => getMonthFilteredStats(e));
                return [
                  { label: 'Employees', value: filteredEmployeeGroupList.length, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', icon: <UserCheck className="w-4 h-4 text-indigo-500" /> },
                  { label: 'Total Present', value: allStats.reduce((s, e) => s + e.presentCount, 0), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
                  { label: 'Total WFH', value: allStats.reduce((s, e) => s + e.wfhCount, 0), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', icon: <Home className="w-4 h-4 text-purple-500" /> },
                  { label: 'Total Late', value: allStats.reduce((s, e) => s + e.lateCount, 0), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', icon: <Clock className="w-4 h-4 text-amber-500" /> },
                  { label: 'Total Halfday', value: allStats.reduce((s, e) => s + e.halfDayCount, 0), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', icon: <Clock className="w-4 h-4 text-blue-500" /> },
                  { label: 'Total Absent', value: allStats.reduce((s, e) => s + e.absentCount, 0), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30', icon: <X className="w-4 h-4 text-rose-500" /> },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-1 sm:gap-2 shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-2xl sm:rounded-xl bg-white dark:bg-slate-800 border border-slate-100 sm:border-slate-200/80 dark:border-slate-700 shadow-sm sm:shadow-xs">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-0">
                      <div className={`w-6 h-6 sm:hidden rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                        {stat.icon}
                      </div>
                      <span className="text-[9px] font-black text-slate-500 sm:text-slate-400 uppercase tracking-wider whitespace-nowrap">{stat.label}</span>
                    </div>
                    <span className={`text-xl sm:text-base font-black leading-none mt-0.5 sm:mt-0 ${stat.color}`}>{stat.value}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Mobile List View (Hidden on Desktop) */}
            <div className="sm:hidden flex-1 overflow-visible sm:overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tight">Employee Attendance</h3>
              <div className="flex flex-col gap-3">
                {filteredEmployeeGroupList.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 font-semibold text-xs bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">No attendance data found.</div>
                ) : (
                  filteredEmployeeGroupList.map((emp) => {
                    const s = getMonthFilteredStats(emp);
                    const displayParts = getEmpDisplayName(emp.user).split(' ');
                    const initials = (displayParts[0]?.[0] || '') + (displayParts[1]?.[0] || '');
                    return (
                      <div key={emp.empId} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm border border-indigo-100 dark:border-indigo-800 shrink-0">
                              {initials.toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">{getEmpDisplayName(emp.user)}</span>
                              <span className="text-[10px] font-bold text-indigo-500 mt-0.5">{getEmpId(emp.user)}</span>
                              <span className="text-[10px] text-slate-500">{getEmpDept(emp.user)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end border-l border-slate-100 dark:border-slate-700 pl-3">
                            <span className="text-[9px] font-extrabold text-slate-400">Total Days</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">{s.totalDays}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Stat Pills */}
                        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-50 dark:border-slate-700 overflow-x-auto pb-1 hide-scrollbar">
                          <div className="shrink-0 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black px-2 py-1.5 rounded-lg flex items-center justify-center gap-1">
                            P {s.presentCount}
                          </div>
                          <div className="shrink-0 bg-purple-50/80 dark:bg-purple-900/20 text-purple-600 text-[10px] font-black px-2 py-1.5 rounded-lg flex items-center justify-center gap-1">
                            WFH {s.wfhCount}
                          </div>
                          <div className={`shrink-0 text-[10px] font-black px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 ${s.lateCount > 0 ? 'bg-amber-50/80 dark:bg-amber-900/20 text-amber-600' : 'bg-slate-50/80 dark:bg-slate-800/50 text-slate-400'}`}>
                            Late {s.lateCount}
                          </div>
                          <div className={`shrink-0 text-[10px] font-black px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 ${s.halfDayCount > 0 ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600' : 'bg-slate-50/80 dark:bg-slate-800/50 text-slate-400'}`}>
                            Half {s.halfDayCount}
                          </div>
                          <div className={`shrink-0 text-[10px] font-black px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 ${s.absentCount > 0 ? 'bg-rose-50/80 dark:bg-rose-900/20 text-rose-600' : 'bg-slate-50/80 dark:bg-slate-800/50 text-slate-400'}`}>
                            Absent {s.absentCount}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Desktop Excel-like Table (Hidden on Mobile) */}
            <div className="hidden sm:block overflow-auto flex-1">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                    {['#', 'Employee Name', 'Employee ID', 'Department', 'Total Days', 'Present', 'WFH Days', 'Late', 'Half Day', 'Absent'].map((col, i) => (
                      <th key={i} className="px-3 py-2.5 text-left font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap border-b-2 border-slate-200 dark:border-slate-700 border-r border-slate-200 dark:border-slate-700">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployeeGroupList.length === 0 ? (
                    <tr><td colSpan={10} className="py-16 text-center text-slate-400 font-semibold text-sm">No attendance data found.</td></tr>
                  ) : (
                    filteredEmployeeGroupList.map((emp, idx) => {
                      const s = getMonthFilteredStats(emp);
                      return (
                      <tr key={emp.empId} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-900/60'}`}>
                        <td className="px-3 py-2.5 font-bold text-slate-400 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-extrabold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">{getEmpDisplayName(emp.user)}</td>
                        <td className="px-3 py-2.5 font-bold text-indigo-600 dark:text-indigo-400 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono">{getEmpId(emp.user)}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">{getEmpDept(emp.user)}</td>
                        <td className="px-3 py-2.5 font-black text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800 text-center whitespace-nowrap">{s.totalDays}</td>
                        <td className="px-3 py-2.5 font-black text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap"><span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-black">{s.presentCount}</span></td>
                        <td className="px-3 py-2.5 font-black text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap"><span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 font-black">{s.wfhCount}</span></td>
                        <td className="px-3 py-2.5 font-black text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-md font-black ${s.lateCount > 0 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}>{s.lateCount}</span></td>
                        <td className="px-3 py-2.5 font-black text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-md font-black ${s.halfDayCount > 0 ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400' : 'text-slate-400'}`}>{s.halfDayCount}</span></td>
                        <td className="px-3 py-2.5 font-black text-center whitespace-nowrap"><span className={`px-2 py-0.5 rounded-md font-black ${s.absentCount > 0 ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' : 'text-slate-400'}`}>{s.absentCount}</span></td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="p-4 sm:px-5 sm:py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0 text-center sm:text-left">
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">Life Changers Ind LCM · Attendance Report · {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
    )}
      {/* Attendance Activity Timeline Modal */}
      <AttendanceTimelineModal
        isOpen={!!timelineModalItem}
        onClose={() => setTimelineModalItem(null)}
        liveItem={timelineModalItem}
      />
    </div>
  );
};


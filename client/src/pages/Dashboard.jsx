import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ASSETS } from '../assets';
import { MetricCard } from '../components/Card';
import blueBgCard from '../assets/ChatGPT Image Aug 4, 2026, 04_51_49 PM.webp';
import greenBgCard from '../assets/ChatGPT Image Aug 4, 2026, 04_51_43 PM.webp';
import purpleBgCard from '../assets/ChatGPT Image Aug 4, 2026, 04_51_54 PM.webp';
import orangeBgCard from '../assets/ChatGPT Image Aug 4, 2026, 04_51_34 PM.webp';
import UiverseDropdown from '../components/UiverseDropdown';
import { Modal } from '../components/Modal';
import { LeaveApplyModal } from '../components/LeaveApplyModal';
import { FaceCameraModal } from '../components/FaceCameraModal';
import { UiverseStarButton } from '../components/UiverseStarButton';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  FileCheck2,
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  CalendarPlus,
  FileText,
  ArrowUpRight,
  ShieldAlert,
  PieChart as PieChartIcon,
  Search,
  SlidersHorizontal,
  Edit3,
  Activity,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const CircularProgress = ({ value, max, color }) => {
  const percentage = Math.round((value / max) * 100);
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 44 44" className="w-11 h-11 sm:w-12 sm:h-12 transform -rotate-90">
        <circle cx="22" cy="22" r={radius} stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" fill="transparent" />
        <circle cx="22" cy="22" r={radius} stroke={color} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute text-[9px] sm:text-[10px] font-black tracking-tight text-slate-800 dark:text-white">{percentage}%</span>
    </div>
  );
};

const getActivityIcon = (module, action) => {
  const modUpper = (module || '').toUpperCase();
  const actUpper = (action || '').toUpperCase();

  if (modUpper.includes('AUTH') || actUpper.includes('LOGIN')) {
    return { icon: Clock, bg: 'bg-blue-600' };
  }
  if (modUpper.includes('LEAVE') || actUpper.includes('LEAVE')) {
    if (actUpper.includes('APPROV')) return { icon: CheckCircle2, bg: 'bg-emerald-500' };
    if (actUpper.includes('REJECT')) return { icon: AlertCircle, bg: 'bg-rose-500' };
    return { icon: CalendarPlus, bg: 'bg-blue-600' };
  }
  if (modUpper.includes('EMPLOYEE') || actUpper.includes('EMPLOYEE') || actUpper.includes('USER')) {
    return { icon: Users, bg: 'bg-purple-600' };
  }
  if (modUpper.includes('HOLIDAY') || actUpper.includes('HOLIDAY')) {
    return { icon: CalendarIcon, bg: 'bg-amber-500' };
  }
  if (modUpper.includes('REPORT') || actUpper.includes('REPORT')) {
    return { icon: FileText, bg: 'bg-indigo-600' };
  }
  return { icon: Activity, bg: 'bg-slate-600' };
};

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balance, setBalance] = useState(null);
  const [attendanceChartData, setAttendanceChartData] = useState([]);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); // update every 30s
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedBalanceYear, setSelectedBalanceYear] = useState(new Date().getFullYear());
  const [selectedTrendYear, setSelectedTrendYear] = useState(new Date().getFullYear());

  // Face Camera Verification Modal State for Dashboard Check-In / Check-Out
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [pendingClockAction, setPendingClockAction] = useState(null); // 'clockIn' | 'clockOut'
  const [dashWorkLocation, setDashWorkLocation] = useState('WFH');

  // Leave Distribution Edit Modal State (CEO & ADMIN Exclusive)
  const [isEditDistributionModalOpen, setIsEditDistributionModalOpen] = useState(false);
  const [editDistributionData, setEditDistributionData] = useState([]);
  const [savingDistribution, setSavingDistribution] = useState(false);

  const fetchDashboard = async (balanceYear) => {
    try {
      const year = balanceYear || selectedBalanceYear;
      const [statsRes, leaveTypesRes, balanceRes, attendanceRes] = await Promise.all([
        api.get('/dashboard/stats', { params: { trendYear: selectedTrendYear } }),
        api.get('/leave-types'),
        api.get('/leaves/balance', { params: { year } }),
        api.get('/attendance/today')
      ]);
      setStats(statsRes.data.data);
      setLeaveTypes(leaveTypesRes.data.data.leaveTypes || []);
      setBalance(balanceRes.data.data.balance);
      setTodayAttendance(attendanceRes.data.data.attendance);
    } catch (err) {
      console.error('[Dashboard Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedTrendYear]);

  // Re-fetch balance when year changes
  const handleBalanceYearChange = async (year) => {
    setSelectedBalanceYear(year);
    try {
      const res = await api.get('/leaves/balance', { params: { year } });
      setBalance(res.data.data.balance);
    } catch (err) {
      console.error('[Balance Year Change Error]', err);
    }
  };

  const triggerClockAction = (actionType) => {
    if (user?.role === 'CEO') {
      // CEO is exempt from face verification camera requirement
      setPendingClockAction(actionType);
      handleFaceVerificationSuccess(null, actionType);
    } else {
      setPendingClockAction(actionType);
      setIsFaceModalOpen(true);
    }
  };

  const handleQuickClockIn = () => triggerClockAction('clockIn');
  const handleQuickClockOut = () => triggerClockAction('clockOut');
  const handleQuickLunchOut = () => triggerClockAction('lunchOut');
  const handleQuickLunchIn = () => triggerClockAction('lunchIn');

  const [clockErrorMsg, setClockErrorMsg] = useState('');

  const handleFaceVerificationSuccess = async (faceDescriptor, directAction = null) => {
    const actionToPerform = directAction || pendingClockAction;
    setActionLoading(true);
    setClockErrorMsg('');
    try {
      if (actionToPerform === 'clockIn') {
        await api.post('/attendance/clock-in', { workLocation: dashWorkLocation, faceDescriptor });
      } else if (actionToPerform === 'clockOut') {
        await api.post('/attendance/clock-out', { faceDescriptor });
      } else if (actionToPerform === 'lunchOut') {
        await api.post('/attendance/lunch-out', { faceDescriptor });
      } else if (actionToPerform === 'lunchIn') {
        await api.post('/attendance/lunch-in', { faceDescriptor });
      }
      setIsFaceModalOpen(false);
      setPendingClockAction(null);
      await fetchDashboard();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${actionToPerform?.replace(/([A-Z])/g, ' $1').toLowerCase() || 'complete action'}.`;
      setClockErrorMsg(msg);
      setIsFaceModalOpen(false); // close camera modal on error
      setTimeout(() => setClockErrorMsg(''), 6000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditDistribution = () => {
    if (leaveTypes && leaveTypes.length > 0) {
      setEditDistributionData(
        leaveTypes.map((lt) => ({
          id: lt._id,
          name: lt.name?.toLowerCase().includes('earned') ? 'Paid Leave' : lt.name,
          code: lt.code === 'EL' ? 'PL' : lt.code,
          maxDays: lt.maxDays || 0,
          colorBadge: lt.colorBadge || '#2563EB'
        }))
      );
    } else {
      setEditDistributionData([
        { id: 'cl', name: 'Casual Leave', code: 'CL', maxDays: 18, colorBadge: '#2563EB' },
        { id: 'sl', name: 'Sick Leave', code: 'SL', maxDays: 12, colorBadge: '#EF4444' },
        { id: 'pl', name: 'Paid Leave', code: 'PL', maxDays: 30, colorBadge: '#22C55E' },
        { id: 'eml', name: 'Emergency Leave', code: 'EML', maxDays: 10, colorBadge: '#F59E0B' }
      ]);
    }
    setIsEditDistributionModalOpen(true);
  };

  const handleSaveDistribution = async (e) => {
    e.preventDefault();
    setSavingDistribution(true);
    try {
      for (const item of editDistributionData) {
        if (item.id && !['cl', 'sl', 'pl', 'eml'].includes(item.id)) {
          await api.put(`/leave-types/${item.id}`, { maxDays: Number(item.maxDays) });
        }
      }
      setIsEditDistributionModalOpen(false);
      await fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update leave distribution settings.');
    } finally {
      setSavingDistribution(false);
    }
  };

  const defaultTrend = [
    { month: 'Jan', leaves: 12 },
    { month: 'Feb', leaves: 18 },
    { month: 'Mar', leaves: 24 },
    { month: 'Apr', leaves: 15 },
    { month: 'May', leaves: 42 },
    { month: 'Jun', leaves: 32 },
    { month: 'Jul', leaves: 22 },
    { month: 'Aug', leaves: 19 },
    { month: 'Sep', leaves: 25 },
    { month: 'Oct', leaves: 30 },
    { month: 'Nov', leaves: 20 },
    { month: 'Dec', leaves: 15 }
  ];

  const rawTrend = stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? stats.monthlyTrend : defaultTrend;

  const chartData = rawTrend.map((item) => ({
    month: item.month,
    leaves: item.leaves !== undefined ? item.leaves : (item.count !== undefined ? item.count : 10)
  }));

  const totalDaysAllTypes = leaveTypes.length > 0
    ? leaveTypes.reduce((sum, lt) => sum + (lt.maxDays || 0), 0)
    : 42;

  const pieData = leaveTypes.length > 0
    ? leaveTypes.map((lt) => {
        const cleanName = lt.name?.toLowerCase().includes('earned') ? 'Paid Leave' : lt.name;
        const cleanCode = lt.code === 'EL' ? 'PL' : lt.code;
        return {
          name: cleanName,
          code: cleanCode,
          value: totalDaysAllTypes > 0 ? Math.round(((lt.maxDays || 0) / totalDaysAllTypes) * 100) : 0,
          maxDays: lt.maxDays,
          color: lt.colorBadge || (cleanCode === 'CL' ? '#2563EB' : cleanCode === 'SL' ? '#EF4444' : (cleanCode === 'PL') ? '#22C55E' : '#F59E0B')
        };
      })
    : [
        { name: 'Casual Leave', value: 29, maxDays: 12, color: '#2563EB' },
        { name: 'Paid Leave', value: 36, maxDays: 15, color: '#22C55E' },
        { name: 'Emergency Leave', value: 12, maxDays: 5, color: '#F59E0B' },
        { name: 'Sick Leave', value: 24, maxDays: 10, color: '#EF4444' }
      ];

  const entitlements = balance?.allocations && balance.allocations.length > 0
    ? balance.allocations.map((alloc) => ({
        id: alloc._id,
        name: alloc.leaveTypeName?.toLowerCase().includes('earned') ? 'Paid Leave' : alloc.leaveTypeName,
        code: alloc.leaveTypeCode === 'EL' ? 'PL' : alloc.leaveTypeCode,
        remaining: alloc.remaining,
        total: alloc.total,
        color: alloc.colorBadge || (alloc.leaveTypeCode === 'CL' ? '#2563EB' : alloc.leaveTypeCode === 'SL' ? '#EF4444' : (alloc.leaveTypeCode === 'PL' || alloc.leaveTypeCode === 'EL') ? '#22C55E' : '#F59E0B')
      }))
    : [];

  const getUserDisplayName = () => {
    if (user?.role === 'CEO') return 'CEO';
    let first = user?.firstName || '';
    let last = user?.lastName || '';
    let full = `${first} ${last}`.trim();
    if (!full && user?.email) {
      full = user.email.split('@')[0];
    }
    // Clean email digits/numbers if any (e.g. Yuvasrikutty2005 -> Yuvasri)
    let cleaned = full.replace(/\d+/g, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    if (cleaned.toLowerCase().includes('yuvasri')) {
      cleaned = 'Yuvasri';
    }
    return cleaned || user?.firstName || 'Employee';
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-8">
      {/* Error Toast for face verification / clock-in failures */}
      {clockErrorMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-rose-600 text-white text-xs font-extrabold shadow-2xl flex items-center gap-2 border border-rose-700 animate-bounce max-w-xs">
          <span>⚠️</span>
          <span>{clockErrorMsg}</span>
        </div>
      )}
      {/* Mobile Top Search Bar Widget — hidden for EMPLOYEE role */}
      {user?.role !== 'EMPLOYEE' && (
      <div className="md:hidden w-full mb-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate(`/employees?search=${encodeURIComponent(searchQuery)}`);
              setSearchQuery('');
            }
          }}
          className="relative w-full"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees, leaves, departments..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl outline-none shadow-2xs focus:border-blue-500 transition-all"
          />
        </form>
      </div>
      )}

      {/* ================= ROW 1: WELCOME BANNER + QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Welcome Banner matching Original Design with Distinct Border (8 Cols) */}
        <div className="lg:col-span-8 relative rounded-3xl bg-[#EEF4FF] dark:bg-slate-900/90 border-2 border-blue-200 dark:border-slate-700 p-6 sm:p-7 flex flex-col justify-between overflow-hidden shadow-md shadow-blue-500/10 min-h-[220px]">
          
          {/* Seamless Original Background Image (Always Visible on Phone Size & Desktop) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-3xl">
            <img
              src={ASSETS.bannerIllustration}
              alt="Workspace Illustration"
              className="w-full h-full object-cover object-center mix-blend-multiply dark:mix-blend-normal opacity-40 sm:opacity-70 md:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#EEF4FF] via-[#EEF4FF]/80 to-transparent dark:from-slate-900 dark:via-slate-900/80" />
          </div>

          {/* Left Content */}
          <div className="relative z-[60] flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-wrap">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                    {user?.role === 'TEAM_LEAD' ? 'Team Lead' : user?.role === 'ADMIN' ? 'Admin' : user?.role?.replace('_', ' ')}
                  </span>
                </div>

                {/* Action Check In / Check Out Button (Hidden for CEO) */}
                {user?.role !== 'CEO' && (
                  <div className="shrink-0 flex justify-center sm:justify-end w-full sm:w-auto">
                    {!todayAttendance?.clockIn ? (
                      <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
                        <UiverseDropdown
                          options={[
                            { value: "WFH", label: "🏡 WFH" },
                            { value: "IN_OFFICE", label: "🏢 In-Office" },
                          ]}
                          value={dashWorkLocation}
                          onChange={(val) => setDashWorkLocation(val)}
                        />
                        <UiverseStarButton
                          disabled={actionLoading}
                          onClick={handleQuickClockIn}
                          variant="checkin"
                        >
                          Login
                        </UiverseStarButton>
                      </div>
                    ) : !todayAttendance?.clockOut ? (
                      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                        {!todayAttendance?.lunchOut ? (
                          <>
                              <UiverseStarButton disabled={actionLoading} onClick={handleQuickLunchOut} variant="checkout">
                                Lunch Out
                              </UiverseStarButton>
                            <UiverseStarButton disabled={actionLoading} onClick={handleQuickClockOut} variant="checkout">
                              Logout
                            </UiverseStarButton>
                          </>
                        ) : !todayAttendance?.lunchIn ? (
                          <UiverseStarButton disabled={actionLoading} onClick={handleQuickLunchIn} variant="checkin">
                            Lunch In
                          </UiverseStarButton>
                        ) : (
                          <UiverseStarButton disabled={actionLoading} onClick={handleQuickClockOut} variant="checkout">
                            Logout
                          </UiverseStarButton>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                        <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-black rounded-xl flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Logged Out
                        </span>
                        <UiverseDropdown
                          options={[
                            { value: "WFH", label: "🏡 WFH" },
                            { value: "IN_OFFICE", label: "🏢 In-Office" },
                          ]}
                          value={dashWorkLocation}
                          onChange={(val) => setDashWorkLocation(val)}
                        />
                        <UiverseStarButton
                          disabled={actionLoading}
                          onClick={handleQuickClockIn}
                          variant="checkin"
                        >
                          Login Again
                        </UiverseStarButton>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
                Welcome back, {getUserDisplayName()}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed max-w-md">
                Here is your enterprise leave management overview for today.
              </p>
            </div>

            {/* Date & Working Day Status Card Widget matching Image */}
            <div className="bg-white dark:bg-slate-800/95 backdrop-blur-sm border-2 border-blue-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2 shadow-md shadow-blue-500/10 inline-flex items-center gap-3 w-max">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
              </div>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

              <div className="flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-500/20 shrink-0" />
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">Working Day</span>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Actions Card Widget matching Image (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Quick Actions</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Action 1: Apply Leave (Hidden for CEO role) */}
            {user?.role !== 'CEO' && (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="w-full p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <CalendarPlus className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                    Apply Leave
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Action 2: Add Employee (Management: CEO, Admin, HR) */}
            {(user?.role === 'CEO' || user?.role === 'ADMIN' || user?.role === 'HR') && (
              <button
                onClick={() => navigate('/employees?action=add')}
                className="w-full p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-purple-50/60 dark:hover:bg-purple-950/40 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <UserPlus className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors">
                    Add Employee
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Action 3: Add Holiday (Management Only) */}
            {(user?.role === 'CEO' || user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'TEAM_LEAD') && (
              <button
                onClick={() => navigate('/holidays')}
                className="w-full p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Plus className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors">
                    Add Holiday
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Action 4: Generate Report (Management Only) */}
            {(user?.role === 'CEO' || user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'TEAM_LEAD') && (
              <button
                onClick={() => navigate('/reports')}
                className="w-full p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <FileText className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                    Generate Report
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Action for Regular Employee: My Attendance */}
            {user?.role === 'EMPLOYEE' && (
              <button
                onClick={() => navigate('/attendance')}
                className="w-full p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Clock className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                    My Attendance Log
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ================= ROW 2: OVERVIEW 4 KPI METRIC CARDS (CEO, HR, ADMIN, TEAM_LEAD ONLY) ================= */}
      {(user?.role === 'CEO' || user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'TEAM_LEAD') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Overview</h3>
            <button onClick={() => navigate('/reports')} className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline">View all</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard title="TOTAL EMPLOYEES" value={stats?.cards?.totalEmployees ?? 0} icon={Users} color="primary" trend="+8.2% This Month" bgImage={blueBgCard} onClick={() => navigate('/employees')} />
            <MetricCard title="DEPARTMENTS" value={stats?.cards?.totalDepartments ?? 0} icon={Building2} color="secondary" trend="+2 New This Month" bgImage={purpleBgCard} onClick={() => navigate('/departments')} />
            <MetricCard title="PENDING APPROVALS" value={stats?.cards?.pendingLeaves ?? stats?.cards?.pendingHrApprovals ?? stats?.cards?.pendingRequests ?? 0} icon={Clock} color="warning" trend="+2 Since Yesterday" bgImage={orangeBgCard} onClick={() => navigate('/leaves?status=PENDING')} />
            <MetricCard title="EMPLOYEES ON LEAVE" value={stats?.cards?.employeesOnLeaveToday ?? stats?.cards?.teamOnLeaveTodayCount ?? 0} icon={CalendarCheck} color="success" trend="+5.4% This Month" bgImage={greenBgCard} onClick={() => navigate('/leaves?status=APPROVED')} />
          </div>
        </div>
      )}

      {/* ================= ROW 3: LEAVE ENTITLEMENTS (NON-CEO ONLY) ================= */}
      {user?.role !== 'CEO' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Your Leave Entitlements</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider hidden sm:block">Year</span>
              <input
                type="number"
                value={selectedBalanceYear}
                onChange={(e) => handleBalanceYearChange(Number(e.target.value))}
                min="2000"
                max="2050"
                className="px-3 py-1.5 w-24 rounded-full bg-white dark:bg-slate-800 border border-blue-400 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {loading ? (
              [1,2,3,4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 min-h-[155px] animate-pulse">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                </div>
              ))
            ) : entitlements.length === 0 ? (
              <div className="col-span-4 text-center text-slate-400 text-sm font-semibold py-8">
                No leave balance found for {selectedBalanceYear}. Contact HR to allocate leave.
              </div>
            ) : (
            entitlements.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 relative overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between min-h-[155px]"
              >
                {/* Subtle Background Accent Gradient Tint */}
                <div
                  className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none"
                  style={{ backgroundColor: item.color }}
                />

                {/* Top Header: Full Name (No truncation!) & Colored Pill Code */}
                <div className="flex items-start justify-between gap-2 relative z-10">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight min-w-0 pr-1">
                    {item.name}
                  </span>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${item.color}15`,
                      color: item.color,
                      border: `1px solid ${item.color}30`
                    }}
                  >
                    {item.code}
                  </span>
                </div>

                {/* Body: Big Number Count & Glowing Circular Gauge */}
                <div className="flex items-center justify-between gap-2 my-2 relative z-10">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {item.remaining}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 leading-none">
                      Remaining
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      of <strong className="font-bold text-slate-700 dark:text-slate-300">{item.total}</strong> days
                    </p>
                  </div>

                  {/* Circular Progress Gauge */}
                  <div className="shrink-0 drop-shadow-xs group-hover:scale-105 transition-transform">
                    <CircularProgress value={item.remaining} max={item.total} color={item.color} />
                  </div>
                </div>

                {/* Bottom Accent Gradient Progress Bar */}
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative z-10 mt-1">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                    style={{
                      width: `${Math.min(100, Math.max(0, (item.remaining / item.total) * 100))}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 10px ${item.color}80`
                    }}
                  />
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}

      {/* ================= ROW 4: MONTHLY TREND + LEAVE DISTRIBUTION (CEO, HR, ADMIN, TEAM_LEAD ONLY) + UPCOMING HOLIDAYS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: 2 Analytics Charts Grid (CEO, ADMIN, HR, TEAM_LEAD ONLY) */}
        {(user?.role === 'CEO' || user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'TEAM_LEAD') && (
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Monthly Leave Trend Area Chart matching Image (7 Cols) */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Monthly Leave Trend</h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={selectedTrendYear}
                    onChange={(e) => setSelectedTrendYear(Number(e.target.value))}
                    min="2000"
                    max="2050"
                    className="px-3 py-1.5 w-24 rounded-full bg-white dark:bg-slate-800 border border-blue-400 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs text-center"
                  />
                </div>
              </div>

              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#1E293B',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                    />
                    <Area type="monotone" dataKey="leaves" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorLeaves)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leave Distribution Donut Chart matching Image (5 Cols) */}
            <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Leave Distribution</h3>
                {(user?.role === 'CEO' || user?.role === 'ADMIN') && (
                  <button
                    onClick={handleOpenEditDistribution}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                    title="Edit Leave Distribution (CEO & Admin Only)"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>

              <div className="relative w-full h-36 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={42} outerRadius={60} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{totalDaysAllTypes}</span>
                  <span className="text-[9px] font-bold text-slate-400">Leaves</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white shrink-0">{item.maxDays} Days</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Upcoming Holidays Widget matching Image */}
        <div className={`${(user?.role === 'CEO' || user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'TEAM_LEAD') ? 'lg:col-span-4' : 'lg:col-span-12'} bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Upcoming Holidays</h3>
              <button onClick={() => navigate('/holidays')} className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                View calendar
              </button>
            </div>

            <div className="space-y-3">
              {/* Holiday 1 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-2xs">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">15</p>
                    <p className="text-[9px] font-bold text-blue-600 uppercase">AUG</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Independence Day</p>
                    <p className="text-[10px] text-slate-400 font-medium">Friday</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Upcoming
                </span>
              </div>

              {/* Holiday 2 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-2xs">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">05</p>
                    <p className="text-[9px] font-bold text-blue-600 uppercase">SEP</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Teachers' Day</p>
                    <p className="text-[10px] text-slate-400 font-medium">Friday</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Upcoming
                </span>
              </div>

              {/* Holiday 3 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-2xs">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">02</p>
                    <p className="text-[9px] font-bold text-blue-600 uppercase">OCT</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Gandhi Jayanti</p>
                    <p className="text-[10px] text-slate-400 font-medium">Thursday</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Upcoming
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/holidays')}
            className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between"
          >
            <span>View all holidays</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Leave Application Modal */}
      <LeaveApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={fetchDashboard}
        leaveTypes={leaveTypes}
        balance={balance}
      />

      {/* Face Verification Modal for Dashboard Quick Check-In / Check-Out */}
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
      {/* Leave Distribution Edit Modal (CEO & ADMIN Only) */}
      <Modal
        isOpen={isEditDistributionModalOpen}
        onClose={() => setIsEditDistributionModalOpen(false)}
        title="Edit Leave Distribution Quotas"
      >
        <form onSubmit={handleSaveDistribution} className="space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Update maximum yearly leave day allocations per policy. Only CEO and Super Admin can modify these quotas.
          </p>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {editDistributionData.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: item.colorBadge }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400">({item.code})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={item.maxDays}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditDistributionData((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, maxDays: val } : it))
                      );
                    }}
                    className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 text-center"
                    required
                  />
                  <span className="text-xs font-semibold text-slate-500">Days/Yr</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditDistributionModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingDistribution}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              {savingDistribution ? 'Saving Changes...' : 'Save Distribution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

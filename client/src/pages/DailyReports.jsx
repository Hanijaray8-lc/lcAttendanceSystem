import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { DailyReportSubmitModal } from '../components/DailyReportSubmitModal';
import { DailyReportDetailsModal } from '../components/DailyReportDetailsModal';
import { EmployeeReportHistoryModal } from '../components/EmployeeReportHistoryModal';
import noteImg from '../assets/note.webp';
import notesImg from '../assets/notes.webp';
import winImg from '../assets/win.webp';
import growthImg from '../assets/growth.webp';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  UserCheck,
  Award,
  Trophy,
  Sparkles,
  Eye,
  CalendarDays,
  Bell,
  Users,
  AlertTriangle,
  Mail,
  Building2,
  History
} from 'lucide-react';

const CARD_PALETTES = [
  {
    avatarBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
    empIdText: 'text-rose-500 dark:text-rose-400',
    boxBg: 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40',
    iconColor: 'text-rose-500',
    btnBg: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/25',
    cardBorder: 'hover:border-rose-300 dark:hover:border-rose-800'
  },
  {
    avatarBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    empIdText: 'text-amber-600 dark:text-amber-400',
    boxBg: 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40',
    iconColor: 'text-amber-500',
    btnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25',
    cardBorder: 'hover:border-amber-300 dark:hover:border-amber-800'
  },
  {
    avatarBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    empIdText: 'text-cyan-600 dark:text-cyan-400',
    boxBg: 'bg-cyan-50/60 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900/40',
    iconColor: 'text-cyan-500',
    btnBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-cyan-500/25',
    cardBorder: 'hover:border-cyan-300 dark:hover:border-cyan-800'
  },
  {
    avatarBg: 'bg-gradient-to-br from-blue-600 to-indigo-600',
    empIdText: 'text-blue-600 dark:text-blue-400',
    boxBg: 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40',
    iconColor: 'text-blue-500',
    btnBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25',
    cardBorder: 'hover:border-blue-300 dark:hover:border-blue-800'
  },
  {
    avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    empIdText: 'text-emerald-600 dark:text-emerald-400',
    boxBg: 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
    iconColor: 'text-emerald-500',
    btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25',
    cardBorder: 'hover:border-emerald-300 dark:hover:border-emerald-800'
  },
  {
    avatarBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    empIdText: 'text-purple-600 dark:text-purple-400',
    boxBg: 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40',
    iconColor: 'text-purple-500',
    btnBg: 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-purple-500/25',
    cardBorder: 'hover:border-purple-300 dark:hover:border-purple-800'
  }
];

const formatEmpId = (empId, fallback = 'EMP001') => {
  if (!empId) return fallback;
  if (typeof empId === 'string' && empId.match(/^[0-9a-fA-F]{24}$/)) {
    return 'EMP' + empId.slice(-3).toUpperCase();
  }
  return empId;
};

const formatDepartmentName = (dept, fallback = 'Engineering') => {
  if (!dept) return fallback;
  if (typeof dept === 'object' && dept.name) return dept.name;
  if (typeof dept === 'string' && !dept.match(/^[0-9a-fA-F]{24}$/)) return dept;
  return fallback;
};

export const DailyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [employeeStatuses, setEmployeeStatuses] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTracked: 0,
    submittedCount: 0,
    pendingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [remindingUserId, setRemindingUserId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateFilter, setDateFilter] = useState(getTodayString());

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReportsGroup, setSelectedReportsGroup] = useState([]);
  const [editingReport, setEditingReport] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // History Modal
  const [historyModalUserId, setHistoryModalUserId] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Called after any review/comment is saved — refreshes both main list and history modal
  const handleUpdateSuccess = () => {
    fetchReportsData();
    setHistoryRefreshKey((k) => k + 1);
  };

  const handleOpenHistory = (targetUserId) => {
    if (targetUserId) {
      setHistoryModalUserId(targetUserId);
      setIsHistoryModalOpen(true);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateNewReport = () => {
    setEditingReport(null);
    setIsSubmitModalOpen(true);
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setIsSubmitModalOpen(true);
  };

  const handleSendReminder = async (targetUserId) => {
    try {
      setRemindingUserId(targetUserId);
      const res = await api.post('/daily-reports/remind', { userId: targetUserId });
      showToast(res.data.message || 'Reminder sent to employee! ??');
    } catch (err) {
      console.error('[Reminder Error]', err);
      showToast(err.response?.data?.message || 'Failed to send reminder.');
    } finally {
      setRemindingUserId(null);
    }
  };

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [reportsRes, todayRes] = await Promise.all([
        api.get('/daily-reports', { params }),
        api.get('/daily-reports/today')
      ]);

      const data = reportsRes.data.data;
      setReports(data.reports || []);
      setEmployeeStatuses(data.employeeStatuses || []);
      setMetrics({
        totalTracked: data.totalTracked || 0,
        submittedCount: data.submittedCount || 0,
        pendingCount: data.pendingCount || 0
      });
      setTodayStatus(todayRes.data.data);
    } catch (err) {
      console.error('[Daily Reports Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReportsData();
  };

  const handleOpenDetails = (r, reportsGroup = [], itemUser = null) => {
    const enrichedReport = (r && (!r.user || typeof r.user !== 'object' || !r.user.firstName) && itemUser)
      ? { ...r, user: itemUser }
      : r;
    const enrichedGroup = (reportsGroup && reportsGroup.length > 0)
      ? reportsGroup.map(grpRep => {
          if (grpRep && (!grpRep.user || typeof grpRep.user !== 'object' || !grpRep.user.firstName) && itemUser) {
            return { ...grpRep, user: itemUser };
          }
          return grpRep;
        })
      : (enrichedReport ? [enrichedReport] : []);

    setSelectedReport(enrichedReport);
    setSelectedReportsGroup(enrichedGroup);
    setIsDetailsModalOpen(true);
  };

  // Metrics Calculations (Counting unique employees, not report documents)
  const userRole = (user?.role || '').toUpperCase();
  const isEmployee = userRole === 'EMPLOYEE' || (!['ADMIN', 'HR', 'TEAM_LEAD', 'CEO'].includes(userRole));
  const totalTrackedCount = employeeStatuses.length > 0 ? employeeStatuses.length : (metrics.totalTracked || 0);
  const reviewedCount = reports.filter((r) => r.status === 'REVIEWED' || r.status === 'APPROVED').length;
  const pendingSubmissionCount = Math.max(0, employeeStatuses.length > 0
    ? employeeStatuses.filter((e) => !e.hasSubmitted).length
    : (metrics.pendingCount ?? 0));

  return (
    <div className="space-y-6 pb-28 sm:pb-8 relative">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-extrabold shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <FileText className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Daily Work Reports (DWR)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Track daily employee accomplishments, task updates, and manager reviews.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <img
            src={notesImg}
            alt="Daily Work Reports Illustration"
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain shrink-0 hidden md:block rounded-2xl sm:rounded-3xl drop-shadow-md hover:scale-105 transition-transform duration-300"
          />

          {user?.role !== 'CEO' && (
            <button
              onClick={handleCreateNewReport}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-full shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center shrink-0 hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Submit Daily Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Today Report Status Banner */}
      {user?.role !== 'CEO' && (
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 uppercase whitespace-nowrap">
                  TODAY'S REPORT
                </span>
                <span className="text-slate-300 dark:text-slate-700"></span>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase whitespace-nowrap">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug mt-0.5">
                {todayStatus?.hasSubmitted
                  ? `Submitted ${todayStatus.submittedCount || 1} Report${(todayStatus.submittedCount || 1) > 1 ? 's' : ''} Today  Latest: "${todayStatus.report?.title}"`
                  : "You haven't submitted your daily work report for today yet."}
              </h3>
            </div>
          </div>

          <button
            onClick={handleCreateNewReport}
            className="px-4 py-2 rounded-full border border-emerald-500/40 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105"
          >
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{todayStatus?.hasSubmitted ? '+ Submit Another Report' : 'Submit Daily Report'}</span>
          </button>
        </div>
      )}

      {/* 3 Metric Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isEmployee ? (
          <>
            {/* Employee Card 1: My Submissions */}
            <div className="relative overflow-hidden glass-card p-6 sm:p-7 rounded-3xl border border-blue-100/80 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-800 hover:-translate-y-1 transition-all duration-300 group min-h-[148px]">
              <div className="flex items-center gap-5 z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/40 group-hover:rotate-3 transition-transform duration-300">
                  <FileText className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    MY REPORTS TODAY
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {reports.length}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                    {reports.length === 1 ? '1 Report Submitted' : `${reports.length} Reports Submitted`}
                  </span>
                </div>
              </div>

              <div className="self-start z-10 hidden sm:block">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  reports.length > 0
                    ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80'
                    : 'bg-amber-100/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/80'
                } shadow-2xs flex items-center gap-1.5`}>
                  <span className={`w-2 h-2 rounded-full ${reports.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  {reports.length > 0 ? 'Submitted' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Employee Card 2: Approved Reports */}
            <div className="relative overflow-hidden glass-card p-6 sm:p-7 rounded-3xl border border-emerald-100/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-800 hover:-translate-y-1 transition-all duration-300 group min-h-[148px]">
              <div className="flex items-center gap-5 z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-50 dark:ring-emerald-950/40 group-hover:rotate-3 transition-transform duration-300">
                  <UserCheck className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    REVIEWED & APPROVED
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {reviewedCount}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                    Approved by Manager
                  </span>
                </div>
              </div>

              <div className="self-start z-10 hidden sm:block">
                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  {reports.length > 0 ? Math.round((reviewedCount / reports.length) * 100) : 0}% Approved
                </span>
              </div>
            </div>

            {/* Employee Card 3: Hours Logged */}
            <div className="relative overflow-hidden glass-card p-6 sm:p-7 rounded-3xl border border-amber-100/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-300 dark:hover:border-amber-800 hover:-translate-y-1 transition-all duration-300 group min-h-[148px]">
              <div className="flex items-center gap-5 z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25 ring-4 ring-amber-50 dark:ring-amber-950/40 group-hover:rotate-3 transition-transform duration-300">
                  <Clock className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    TOTAL HOURS LOGGED
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {reports.reduce((sum, r) => sum + (Number(r.hoursWorked) || 0), 0)} <span className="text-lg font-bold text-slate-400">hrs</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                    Work Logged Today
                  </span>
                </div>
              </div>

              <div className="self-start z-10 hidden sm:block">
                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                  Logged
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Manager/Admin Card 1: Total Tracked Employees */}
            <div className="relative overflow-hidden glass-card p-6 sm:p-7 rounded-3xl border border-blue-100/80 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-800 hover:-translate-y-1 transition-all duration-300 group min-h-[148px]">
              <div className="flex items-center gap-5 z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/40 group-hover:rotate-3 transition-transform duration-300">
                  <Users className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    TOTAL EMPLOYEES
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {totalTrackedCount}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                    Tracked Team Members
                  </span>
                </div>
              </div>

              <div className="self-start z-10 hidden sm:block">
                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* Manager/Admin Card 2: Reviewed / Approved */}
            <div className="relative overflow-hidden glass-card p-6 sm:p-7 rounded-3xl border border-emerald-100/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-800 hover:-translate-y-1 transition-all duration-300 group min-h-[148px]">
              <div className="flex items-center gap-5 z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-50 dark:ring-emerald-950/40 group-hover:rotate-3 transition-transform duration-300">
                  <UserCheck className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    REVIEWED / APPROVED
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {reviewedCount}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                    Reports Approved
                  </span>
                </div>
              </div>

              <div className="self-start z-10 hidden sm:block">
                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  {totalTrackedCount > 0 ? Math.round((reviewedCount / totalTrackedCount) * 100) : 0}% Done
                </span>
              </div>
            </div>

            {/* Manager/Admin Card 3: Pending Submission */}
            <div className="relative overflow-hidden glass-card p-6 sm:p-7 rounded-3xl border border-amber-100/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-300 dark:hover:border-amber-800 hover:-translate-y-1 transition-all duration-300 group min-h-[148px]">
              <div className="flex items-center gap-5 z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25 ring-4 ring-amber-50 dark:ring-amber-950/40 group-hover:rotate-3 transition-transform duration-300">
                  <AlertTriangle className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    PENDING SUBMISSION
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {pendingSubmissionCount}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                    Awaiting Submission
                  </span>
                </div>
              </div>

              <div className="self-start z-10 hidden sm:block">
                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                  {totalTrackedCount > 0 ? Math.round((pendingSubmissionCount / totalTrackedCount) * 100) : 0}% Pending
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        {user?.role !== 'EMPLOYEE' ? (
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name, ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl outline-none focus:border-primary"
            />
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">Filter Reports by Date:</span>
          </div>
        )}

        {/* Date + Status Row */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex items-center flex-1 sm:w-44">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white rounded-2xl outline-none cursor-pointer"
            />
          </div>

          {user?.role !== 'EMPLOYEE' && (
            <div className="relative flex items-center flex-1 sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 pr-7 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white rounded-2xl outline-none cursor-pointer appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="APPROVED">Approved</option>
                <option value="NOT_SUBMITTED">Not Submitted</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Employee Report Status Cards Grid */}
      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400 font-medium rounded-3xl">
          Loading employee report status cards...
        </div>
      ) : employeeStatuses.length === 0 ? (
        <div className="glass-card p-6 sm:p-10 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-2xs">
          <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl py-10 sm:py-14 px-4 flex flex-col items-center justify-center">
            <img
              src={noteImg}
              alt="No employee cards found"
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain mb-4 drop-shadow-sm"
            />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              No employee cards match the selected filters.
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Try adjusting your search or status filter to see results.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employeeStatuses.map((item, idx) => {
            const palette = CARD_PALETTES[idx % CARD_PALETTES.length];

            return (
              <div
                key={item._id}
                onClick={() => {
                  if (item.hasSubmitted && item.report) {
                    handleOpenDetails(item.report, item.reports, item.user);
                  } else {
                    handleOpenHistory(item.user?._id);
                  }
                }}
                className={`glass-card p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex flex-col justify-between space-y-4 ${palette.cardBorder} hover:shadow-xl transition-all duration-300 group shadow-xs cursor-pointer`}
              >
                {/* Top Row: Avatar, Name, EMP ID, Status Badge (Clicking Header opens Employee History) */}
                <div className="flex items-center justify-between gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenHistory(item.user?._id);
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group/user hover:opacity-90 transition-opacity"
                    title="Click to view employee report history"
                  >
                    <UserAvatar
                      user={item.user}
                      size="w-12 h-12 text-sm font-black"
                      customBg={palette.avatarBg}
                      className="ring-2 ring-slate-100 dark:ring-slate-800 shadow-md group-hover/user:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate group-hover/user:text-blue-600 dark:group-hover/user:text-blue-400 transition-colors">
                        {item.user?.firstName || 'Employee'} {item.user?.lastName || ''}
                      </h3>
                      <p className={`text-xs font-black tracking-wide ${palette.empIdText} uppercase truncate mt-0.5 flex items-center gap-1`}>
                        <span>{formatEmpId(item.user?.employeeId)}</span>
                        <History className="w-3 h-3 text-slate-400" />
                      </p>
                    </div>
                  </div>

                  {/* Status Pill Badge */}
                  {item.hasSubmitted ? (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                      item.reportStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' :
                      item.reportStatus === 'REVIEWED' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.reportStatus === 'APPROVED' ? 'bg-emerald-500' :
                        item.reportStatus === 'REVIEWED' ? 'bg-blue-500' : 'bg-indigo-500'
                      } animate-pulse`} />
                      {item.reportStatus}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      NOT SUBMITTED
                    </span>
                  )}
                </div>

                {/* Middle Information Box - 100% Focused on Daily Work Report */}
                <div className={`rounded-2xl p-4 border ${palette.boxBg} space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 min-h-[145px] flex flex-col justify-between`}>
                  {/* Row 1: Department & Date */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />
                      <span className="truncate font-extrabold text-slate-900 dark:text-white">
                        {formatDepartmentName(item.user?.department)}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold shrink-0">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(dateFilter).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Row 2: Hours Logged & Multiple Reports Badge */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />
                      {item.hasSubmitted ? (
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {(item.reports || [item.report]).reduce((sum, r) => sum + (r?.hoursWorked || 8), 0)} Hours Logged
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                          0 Hours Logged (Awaiting Submission)
                        </span>
                      )}
                    </div>

                    {item.hasSubmitted && (item.submittedCount || 1) > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        {item.submittedCount} Reports Today
                      </span>
                    )}
                  </div>

                  {/* Row 3: Daily Work Report Content with Project Title, Module Name & Work Status */}
                  {item.hasSubmitted ? (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.report?.reportSlot && item.report.reportSlot !== 'GENERAL' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-200 dark:border-amber-800">
                            {item.report.reportSlot === 'MORNING' ? ' Morning' : item.report.reportSlot === 'AFTERNOON' ? ' Afternoon' : ' Evening'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800 truncate max-w-[150px]">
                           {item.report?.projectTitle || 'Attendance Project'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black border border-purple-200 dark:border-purple-800 truncate max-w-[150px]">
                           {item.report?.moduleName || 'Employee Management'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          item.report?.workStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : item.report?.workStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        }`}>
                          {item.report?.workStatus === 'PENDING' ? ' Pending' : item.report?.workStatus === 'COMPLETED' ? ' Completed' : ' On Progress'}
                        </span>
                      </div>

                      <div className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 mt-1">
                         {item.report?.title || 'Daily Work Report'}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold line-clamp-2 leading-relaxed">
                        {item.report?.tasksCompleted}
                      </div>
                      {item.report?.blockers && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold truncate">
                           Blocker: {item.report.blockers}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      <span>No report submitted for this date yet. Click to view history.</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center gap-2">
                  {item.hasSubmitted ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.report) handleOpenDetails(item.report, item.reports, item.user);
                        }}
                        className={`flex-1 py-3 px-4 rounded-full ${palette.btnBg} text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02]`}
                      >
                        <span>View Report</span>
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                      </button>

                      <button
                        type="button"
                        title="View Full Report History"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenHistory(item.user?._id);
                        }}
                        className={`p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 ${palette.iconColor} transition-all cursor-pointer shadow-2xs hover:scale-105 shrink-0 flex items-center justify-center`}
                      >
                        <History className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenHistory(item.user?._id);
                        }}
                        className={`flex-1 py-3 px-4 rounded-full ${palette.btnBg} text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02]`}
                      >
                        <History className="w-4 h-4 stroke-[2.5]" />
                        <span>View Report History</span>
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                      </button>

                      {user?.role !== 'EMPLOYEE' && (
                        <button
                          type="button"
                          title="Send Submission Reminder"
                          disabled={remindingUserId === item.user?._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendReminder(item.user?._id);
                          }}
                          className="p-3 rounded-full bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer shadow-2xs hover:scale-105 shrink-0 flex items-center justify-center disabled:opacity-50"
                        >
                          <Bell className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Motivation Banner */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-indigo-200/30 bg-gradient-to-r from-slate-50/90 via-blue-50/30 to-indigo-50/40 dark:from-slate-100 dark:via-blue-50 dark:to-indigo-50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs overflow-hidden relative">
        <div className="flex items-center gap-4 z-10">
          <img
            src={winImg}
            alt="Achievement Trophy"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-md mix-blend-multiply"
          />
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-900 flex items-center gap-2">
              Great job, {user?.firstName || 'Alexander'}! 🏆
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-600 font-medium mt-0.5">
              Keep up the consistency and keep achieving your goals.
            </p>
          </div>
        </div>

        <div className="shrink-0 z-10 hidden sm:block">
          <img
            src={growthImg}
            alt="Growth Progress"
            className="w-52 sm:w-72 h-auto object-contain shrink-0 mix-blend-multiply"
          />
        </div>
      </div>

      {/* Submit / Edit Report Modal */}
      <DailyReportSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={fetchReportsData}
        existingReport={editingReport}
      />

      {/* Details / Review Modal */}
      <DailyReportDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        report={selectedReport}
        reportsList={selectedReportsGroup}
        currentUser={user}
        onUpdateSuccess={handleUpdateSuccess}
        onEditReport={handleEditReport}
        onOpenHistory={handleOpenHistory}
      />

      {/* Employee Full Report History Modal */}
      <EmployeeReportHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        userId={historyModalUserId}
        refreshKey={historyRefreshKey}
        onSelectReport={(report) => {
          setIsHistoryModalOpen(false);
          handleOpenDetails(report);
        }}
      />
    </div>
  );
};

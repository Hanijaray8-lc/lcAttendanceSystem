import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '../context/AuthContext';
import {
  FileEdit,
  Target,
  Clock,
  CheckCircle2,
  CalendarDays,
  CalendarClock,
  AlertTriangle,
  Info,
  X,
  Send,
  AlertCircle,
  ClipboardCheck
} from 'lucide-react';
import api from '../services/api';

const hoursToTimeString = (hours) => {
  if (hours === undefined || hours === null || isNaN(hours)) return '08:00';
  const num = Number(hours);
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
};

const timeStringToHours = (timeStr) => {
  if (!timeStr) return 8;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  if (isNaN(h) || isNaN(m)) return 8;
  const total = h + (m / 60);
  return Number(total.toFixed(2));
};

export const DailyReportSubmitModal = ({ isOpen, onClose, onSuccess, existingReport }) => {
  const { user } = useAuth();
  const isAdminOrHr = user?.role === 'ADMIN' || user?.role === 'HR';
  const [title, setTitle] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [workStatus, setWorkStatus] = useState('IN_PROGRESS'); // IN_PROGRESS | PENDING | COMPLETED
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');
  const [blockers, setBlockers] = useState('');
  const [reportSlot, setReportSlot] = useState('GENERAL');
  const [workTime, setWorkTime] = useState('08:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const autoDetectSlot = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'MORNING';
    if (hour < 16) return 'AFTERNOON';
    if (hour < 20) return 'EVENING';
    return 'GENERAL';
  };

  useEffect(() => {
    if (isOpen) {
      if (existingReport) {
        setTitle(existingReport.title || '');
        setProjectTitle(existingReport.projectTitle || '');
        setModuleName(existingReport.moduleName || '');
        setWorkStatus(existingReport.workStatus || 'IN_PROGRESS');
        setReportSlot(existingReport.reportSlot || 'GENERAL');
        setTasksCompleted(existingReport.tasksCompleted || '');
        setPendingTasks(existingReport.pendingTasks || '');
        setBlockers(existingReport.blockers || '');
        setWorkTime(hoursToTimeString(existingReport.hoursWorked || 8));
      } else {
        setTitle('');
        setProjectTitle('');
        setModuleName('');
        setWorkStatus('IN_PROGRESS');
        setReportSlot(autoDetectSlot());
        setTasksCompleted('');
        setPendingTasks('');
        setBlockers('');
        setWorkTime('08:00');
      }
      setError('');
    }
  }, [isOpen, existingReport]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !tasksCompleted.trim()) {
      setError('Please provide a report title and task description.');
      return;
    }

    const calculatedHours = timeStringToHours(workTime);

    const payload = {
      title: title.trim(),
      projectTitle: projectTitle.trim() || '',
      moduleName: moduleName.trim() || '',
      workStatus,
      reportSlot,
      tasksCompleted: tasksCompleted.trim(),
      pendingTasks: pendingTasks.trim(),
      blockers: blockers.trim(),
      hoursWorked: calculatedHours > 0 ? calculatedHours : 8
    };

    try {
      setSubmitting(true);
      if (existingReport && existingReport._id) {
        await api.put(`/daily-reports/${existingReport._id}`, payload);
      } else {
        await api.post('/daily-reports', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save daily report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        {/* Custom Header Matching Image 1 */}
        <div className="flex items-center justify-between pb-1 pr-8 sm:pr-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
              <FileEdit className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                {existingReport ? 'Edit Daily Work Report' : 'Submit Daily Work Report'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium truncate">
                {existingReport ? 'Update your report details below.' : 'Add a new work report entry for today.'}
              </p>
            </div>
          </div>
        </div>

        {/* Info banner: Editing an existing report */}
        {existingReport && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-[11px] font-bold">
              <p>Editing report submitted at <span className="font-black">{new Date(existingReport.date || existingReport.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>.</p>
            </div>
          </div>
        )}

        {/* Info: New report entry */}
        {!existingReport && (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 shrink-0" />
              <p className="text-[11px] font-bold">
                New entry for <span className="font-black">{new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span> at <span className="font-black">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[10px] font-black text-blue-700 dark:text-blue-300">
              Multiple Reports Allowed
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Employee & Date Profile Card Matching Image 1 */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-indigo-100/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar user={user} size="w-10 h-10 sm:w-11 sm:h-11 text-xs sm:text-sm shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                {user?.firstName || 'Employee'} {user?.lastName || ''}
              </h3>
              <p className="text-[11px] sm:text-xs text-indigo-600/90 dark:text-indigo-400 font-extrabold mt-0.5 truncate">
                {user?.employeeId || 'EMP-4889'} • {user?.department?.name || 'Engineering'}
              </p>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center gap-2 sm:gap-2.5 shadow-2xs shrink-0 self-start sm:self-auto max-w-full">
            <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0">
              <CalendarDays className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block leading-none">Date</span>
              <span className="text-[11px] sm:text-xs font-extrabold text-purple-700 dark:text-purple-300 block mt-0.5 whitespace-nowrap">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Row 1: Section 1 - Project Title & Section 2 - Module Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Target className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Section 1: Project Title *</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Project name"
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <FileEdit className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>{isAdminOrHr ? 'Section 2: Type *' : 'Section 2: Module Name *'}</span>
            </label>
            <input
              type="text"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder={isAdminOrHr ? 'Type' : 'Module name'}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-500 transition-all shadow-2xs"
              required
            />
          </div>
        </div>

        {/* Row 2: Report Title & Hours Worked */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                <Target className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>{isAdminOrHr ? 'Changes *' : 'Report Title / Summary Focus *'}</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAdminOrHr ? 'Changes' : "Today's work summary"}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-500 transition-all shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Hours Logged</span>
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs focus-within:border-blue-500 transition-all">
              <input
                type="time"
                id="appt"
                name="appt"
                value={workTime}
                onChange={(e) => setWorkTime(e.target.value)}
                className="w-full p-3 bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
                required
              />
              <div className="px-3 py-3 bg-slate-50 dark:bg-slate-700/50 border-l border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>Hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Report Session / Shift Slot Selection */}
        <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
            <span>Report Session / Time Slot *</span>
            <span className="text-[10px] text-slate-400 font-bold normal-case">Allows multiple reports per day</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setReportSlot('MORNING')}
              className={`p-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                reportSlot === 'MORNING'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
              }`}
            >
              <span>🌅 Morning</span>
            </button>
            <button
              type="button"
              onClick={() => setReportSlot('AFTERNOON')}
              className={`p-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                reportSlot === 'AFTERNOON'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <span>☀️ Afternoon</span>
            </button>
            <button
              type="button"
              onClick={() => setReportSlot('EVENING')}
              className={`p-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                reportSlot === 'EVENING'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
              }`}
            >
              <span>🌆 Evening</span>
            </button>
            <button
              type="button"
              onClick={() => setReportSlot('GENERAL')}
              className={`p-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                reportSlot === 'GENERAL'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <span>📝 General</span>
            </button>
          </div>
        </div>

        {/* Work Status Selection (3 Statuses: In Progress, Pending, Completed) */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Work Status / Task Progress *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setWorkStatus('IN_PROGRESS')}
              className={`p-2.5 rounded-xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                workStatus === 'IN_PROGRESS'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              <span className="flex items-center gap-1">🔵 On Progress</span>
              <span className="text-[9px] opacity-80 font-medium hidden sm:inline">Continuing work...</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkStatus('PENDING')}
              className={`p-2.5 rounded-xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                workStatus === 'PENDING'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
              }`}
            >
              <span className="flex items-center gap-1">🟡 Pending</span>
              <span className="text-[9px] opacity-80 font-medium hidden sm:inline">Interrupted / Paused</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkStatus('COMPLETED')}
              className={`p-2.5 rounded-xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                workStatus === 'COMPLETED'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <span className="flex items-center gap-1">🟢 Completed</span>
              <span className="text-[9px] opacity-80 font-medium hidden sm:inline">Finished today</span>
            </button>
          </div>
        </div>

        {/* Section 3: Specific Task Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Section 3: Specific Task Description & Progress Details *</span>
          </label>
          <div className="relative">
            <textarea
              value={tasksCompleted}
              onChange={(e) => setTasksCompleted(e.target.value)}
              rows="3"
              maxLength="1000"
              placeholder="Detail the specific tasks performed in this module..."
              className="w-full p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all leading-relaxed shadow-2xs"
              required
            />
            <span className="absolute right-3 bottom-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
              {tasksCompleted.length}/1000
            </span>
          </div>
        </div>

        {/* Row 3: Pending Tasks & Blockers (2 Cols) Matching Image 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Pending Tasks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <CalendarClock className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Pending / Carried Over Tasks</span>
            </label>
            <div className="relative">
              <textarea
                value={pendingTasks}
                onChange={(e) => setPendingTasks(e.target.value)}
                rows="3"
                maxLength="1000"
                placeholder="Tasks carried over to tomorrow..."
                className="w-full p-3 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all shadow-2xs"
              />
              <span className="absolute right-3 bottom-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                {pendingTasks.length}/1000
              </span>
            </div>
          </div>

          {/* Blockers / Issues */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Blockers / Challenges</span>
            </label>
            <div className="relative">
              <textarea
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                rows="3"
                maxLength="1000"
                placeholder="Any blockers or assistance needed..."
                className="w-full p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-all shadow-2xs"
              />
              <span className="absolute right-3 bottom-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                {blockers.length}/1000
              </span>
            </div>
          </div>
        </div>

        {/* Tip Banner Matching Image 1 */}
        <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-3 relative overflow-hidden shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-blue-500/30">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">
                Tip
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Be specific and concise. This helps your team stay informed and aligned.
              </p>
            </div>
          </div>

          <ClipboardCheck className="absolute -right-3 -bottom-3 w-16 h-16 text-blue-200/50 dark:text-blue-900/30 pointer-events-none stroke-[1]" />
        </div>

        {/* Footer Actions Matching Image 1 */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

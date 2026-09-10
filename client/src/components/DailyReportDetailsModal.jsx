import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from './Modal';
import { UserAvatar } from './UserAvatar';
import {
  ClipboardList,
  Target,
  Clock,
  CheckCircle2,
  Check,
  CalendarDays,
  CalendarClock,
  AlertTriangle,
  Star,
  Download,
  Edit3,
  Trash2,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';

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

export const DailyReportDetailsModal = ({
  isOpen,
  onClose,
  report: initialReport,
  reportsList: initialReportsList = [],
  currentUser,
  onUpdateSuccess,
  onEditReport
}) => {
  const [currentReport, setCurrentReport] = React.useState(initialReport);
  const [reportsGroup, setReportsGroup] = React.useState(
    initialReportsList && initialReportsList.length ? initialReportsList : (initialReport ? [initialReport] : [])
  );
  const [newComment, setNewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState(initialReport?.status || 'REVIEWED');
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoadingDate, setIsLoadingDate] = useState(false);

  React.useEffect(() => {
    setCurrentReport(initialReport);
    const list = (initialReportsList && initialReportsList.length) ? initialReportsList : (initialReport ? [initialReport] : []);
    setReportsGroup(list);
    setNewComment('');
    setReviewStatus(initialReport?.status || 'REVIEWED');
  }, [initialReport, initialReportsList]);

  if (!currentReport) return null;

  const isReviewer = ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD'].includes(currentUser?.role);
  const reportUserId = currentReport.user?._id ? currentReport.user._id.toString() : currentReport.user ? currentReport.user.toString() : '';
  const currentUserId = currentUser?._id ? currentUser._id.toString() : '';
  const isOwner = reportUserId && currentUserId && reportUserId === currentUserId;
  const canModify = isOwner;

  // Build comments list: prefer comments array, fallback to legacy feedback
  const commentsList = (() => {
    if (currentReport?.comments && currentReport.comments.length > 0) {
      return currentReport.comments;
    }
    if (currentReport?.feedback && currentReport.feedback.trim()) {
      return [
        {
          _id: 'legacy_review',
          user: currentReport.reviewedBy,
          comment: currentReport.feedback,
          status: currentReport.status || 'REVIEWED',
          createdAt: currentReport.reviewedAt || currentReport.updatedAt || currentReport.date
        }
      ];
    }
    return [];
  })();

  const handleSelectReportFromGroup = (rep) => {
    setCurrentReport(rep);
    setNewComment('');
    setReviewStatus(rep?.status || 'REVIEWED');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && !reviewStatus) return;
    try {
      setSubmitting(true);
      const res = await api.patch(`/daily-reports/${currentReport._id}`, {
        feedback: newComment.trim(),
        status: reviewStatus
      });
      setNewComment('');
      if (res.data?.data?.report) {
        const updated = res.data.data.report;
        setCurrentReport(updated);
        setReportsGroup(prev => prev.map(r => r._id === updated._id ? updated : r));
      }
      onUpdateSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId || commentId === 'legacy_review') return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await api.delete(`/daily-reports/${currentReport._id}/comments/${commentId}`);
      if (res.data?.data?.report) {
        const updated = res.data.data.report;
        setCurrentReport(updated);
        setReportsGroup(prev => prev.map(r => r._id === updated._id ? updated : r));
      }
      onUpdateSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/daily-reports/${currentReport._id}`);
      setShowDeleteConfirm(false);
      onUpdateSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    if (!selectedDate) return;
    
    try {
      setIsLoadingDate(true);
      const targetUserId = currentReport.user?._id || currentReport.user;
      // Fetch user's report history
      const res = await api.get(`/daily-reports/history/${targetUserId}`);
      const historyReports = res.data?.data?.reports || [];
      
      // Find all reports for the selected date
      const matchingReports = historyReports.filter(r => 
        new Date(r.date).toISOString().split('T')[0] === selectedDate
      );
      
      if (matchingReports.length > 0) {
        setReportsGroup(matchingReports);
        setCurrentReport(matchingReports[0]);
        setNewComment('');
        setReviewStatus(matchingReports[0].status || 'REVIEWED');
      } else {
        alert('No report found for ' + selectedDate);
      }
    } catch (err) {
      alert('Failed to fetch report history');
    } finally {
      setIsLoadingDate(false);
    }
  };

  const handleDownloadReport = () => {
    const empName = `${currentReport.user?.firstName || 'Employee'} ${currentReport.user?.lastName || ''}`.trim();
    const dateStr = new Date(currentReport.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const roleNameMap = {
      CEO: 'CEO',
      TEAM_LEAD: 'Team Lead',
      HR: 'HR Manager',
      ADMIN: 'Admin',
      EMPLOYEE: 'Employee'
    };

    let commentsFormatted = 'No reviewer feedback yet.';
    if (commentsList.length > 0) {
      commentsFormatted = commentsList.map((c, idx) => {
        const commenterName = `${c.user?.firstName || 'Reviewer'} ${c.user?.lastName || ''}`.trim();
        const commenterRole = roleNameMap[c.user?.role] || c.user?.role || 'Reviewer';
        const commentDate = new Date(c.createdAt || currentReport.date).toLocaleString('en-US');
        return `[#${idx + 1}] Comment by: ${commenterName} (${commenterRole})\nStatus: ${c.status || 'REVIEWED'} | Date: ${commentDate}\n"${c.comment || c.feedback || ''}"`;
      }).join('\n\n------------------------------------------------------------------------\n');
    }

    const content = `========================================================================
             LIFE CHANGERS IND - DAILY WORK REPORT (DWR)
========================================================================

EMPLOYEE INFORMATION:
------------------------------------------------------------------------
Name:        ${empName}
Employee ID: ${currentReport.user?.employeeId || 'N/A'}
Department:  ${currentReport.user?.department?.name || 'N/A'}
Report Date: ${dateStr}
Status:      ${currentReport.status || 'SUBMITTED'}

REPORT SUMMARY:
------------------------------------------------------------------------
Title / Focus:   ${currentReport.title}
Hours Logged:    ${currentReport.hoursWorked || 8} Hours

TASKS COMPLETED TODAY:
------------------------------------------------------------------------
${currentReport.tasksCompleted}

PENDING / CARRIED OVER TASKS:
------------------------------------------------------------------------
${currentReport.pendingTasks || 'None specified'}

BLOCKERS / CHALLENGES:
------------------------------------------------------------------------
${currentReport.blockers || 'None reported'}

REVIEWER COMMENTS & FEEDBACK HISTORY:
------------------------------------------------------------------------
${commentsFormatted}

========================================================================
Generated via Life Changers Ind LCM Portal on ${new Date().toLocaleString()}
========================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeEmpName = empName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeDate = new Date(currentReport.date).toISOString().split('T')[0];
    link.download = `Daily_Report_${safeEmpName}_${safeDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} showHeader={false} maxWidth="max-w-2xl">
        <div className="space-y-4 p-1">
          {/* Custom Header Matching Image 1 */}
          <div className="flex items-center justify-between pb-1 pr-8 sm:pr-10">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                <ClipboardList className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  Daily Work Report Details
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium truncate">
                  Overview of your daily progress and tasks
                </p>
              </div>
            </div>
          </div>

          {/* User Profile Card Matching Image 1 */}
          <div className={`p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/60 dark:from-slate-800/90 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${isLoadingDate ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3.5">
              <UserAvatar user={currentReport.user} size="w-12 h-12 text-sm shrink-0" />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {currentReport.user?.firstName || 'Employee'} {currentReport.user?.lastName || ''}
                </h3>
                <p className="text-xs text-blue-600/90 dark:text-blue-400 font-extrabold mt-0.5">
                  {formatEmpId(currentReport.user?.employeeId)} • {formatDepartmentName(currentReport.user?.department)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="relative flex items-center flex-1 sm:flex-initial min-w-[140px]">
                <input
                  type="date"
                  value={new Date(currentReport.date).toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  title="Filter Report by Date"
                  className="relative w-full sm:w-auto pl-4 pr-9 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-20"
                />
                <CalendarDays className="absolute right-3.5 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
              </div>

              <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase flex items-center justify-center gap-1 shadow-2xs shrink-0 flex-1 sm:flex-initial ${
                currentReport.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                currentReport.status === 'REVIEWED' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                {currentReport.status}
              </span>
            </div>
          </div>

          {/* Multiple Reports Selector Tabs if employee submitted more than 1 report for this date */}
          {reportsGroup.length > 1 && (
            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-indigo-900 dark:text-indigo-300">
                <span>Multiple Reports Submitted ({reportsGroup.length} Reports on {new Date(currentReport.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}):</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold">Select report to view</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
                {reportsGroup.map((rep, index) => {
                  const isSelected = rep._id === currentReport._id;
                  return (
                    <button
                      key={rep._id || index}
                      type="button"
                      onClick={() => handleSelectReportFromGroup(rep)}
                      className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400 sm:scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      <span className="shrink-0">Report #{index + 1}:</span>
                      <span className="truncate max-w-[160px] sm:max-w-[130px] text-left">{rep.title || rep.projectTitle || 'Work Report'}</span>
                      {rep.reportSlot && rep.reportSlot !== 'GENERAL' && (
                        <span className="text-[10px] opacity-90 uppercase font-black ml-auto sm:ml-0 shrink-0">({rep.reportSlot})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Toolbar (Icon Only Edit & Delete Buttons) */}
          {canModify && (
            <div className={`flex items-center justify-end gap-2 pt-0.5 ${isLoadingDate ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                onClick={() => {
                  onClose();
                  if (onEditReport) onEditReport(currentReport);
                }}
                title="Edit Report"
                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center transition-all cursor-pointer border border-blue-200 dark:border-blue-800 shadow-2xs hover:scale-105"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete Report"
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer border border-rose-200 dark:border-rose-900 shadow-2xs hover:scale-105"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Project Title, Module Name & Work Status Badge */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {currentReport.reportSlot && currentReport.reportSlot !== 'GENERAL' && (
                  <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black border border-amber-200 dark:border-amber-800">
                    {currentReport.reportSlot === 'MORNING' ? '🌅 Morning Session' : currentReport.reportSlot === 'AFTERNOON' ? '☀️ Afternoon Session' : '🌆 Evening Session'}
                  </span>
                )}
                <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200 dark:border-indigo-800">
                  📁 Project: {currentReport.projectTitle || 'Attendance Project'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black border border-purple-200 dark:border-purple-800">
                  {(currentReport?.user?.role === 'ADMIN' || currentReport?.user?.role === 'HR') ? `🏷️ Type: ${currentReport.moduleName || 'General'}` : `🧩 Module: ${currentReport.moduleName || 'Employee Management'}`}
                </span>
              </div>

              {/* Work Progress Status Badge */}
              <span className={`px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs ${
                currentReport.workStatus === 'PENDING'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse'
                  : currentReport.workStatus === 'COMPLETED'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
              }`}>
                {currentReport.workStatus === 'PENDING' ? '🟡 Task Status: Pending (Interrupted / Paused)' : currentReport.workStatus === 'COMPLETED' ? '🟢 Task Status: Completed' : '🔵 Task Status: On Progress'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Target className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    {(currentReport?.user?.role === 'ADMIN' || currentReport?.user?.role === 'HR') ? 'Changes / Focus' : 'Report Focus / Title'}
                  </span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                    {currentReport.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-4 border-l border-slate-100 dark:border-slate-700">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Clock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 block">
                    {currentReport.hoursWorked || 8} Hours
                  </span>
                  <span className="text-[9px] font-medium text-slate-400 block">
                    Total spent
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Specific Task Description Card Matching Image 1 */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 relative overflow-hidden shadow-2xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Specific Task Description
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line relative z-10 pl-11">
              {currentReport.tasksCompleted}
            </p>

            {/* Background Watermark Icon */}
            <ClipboardList className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 text-emerald-500/30 dark:text-emerald-400/25 pointer-events-none stroke-[1.4]" />
          </div>

          {/* Pending & Blockers 2-Column Row Matching Image 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Pending Tasks Card */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 relative overflow-hidden shadow-2xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 border border-blue-300/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                  <CalendarClock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Pending / Next Day Tasks
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line relative z-10 pl-10 pr-10">
                {currentReport.pendingTasks || 'None specified'}
              </p>

              {/* Watermark */}
              <CalendarClock className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 text-blue-500/30 dark:text-blue-400/25 pointer-events-none stroke-[1.4]" />
            </div>

            {/* Blockers / Issues Card */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 relative overflow-hidden shadow-2xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300/80 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                  <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Blockers / Issues
                </span>
              </div>

              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-line relative z-10 pl-10 pr-10">
                {currentReport.blockers || 'None reported'}
              </p>

              {/* Watermark */}
              <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 text-amber-500/30 dark:text-amber-400/25 pointer-events-none stroke-[1.4]" />
            </div>
          </div>

          {/* Reviewer Comments & Feedback History Section */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Reviewer Comments & Feedback History
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    All comments from Team Lead, HR, Admin, and CEO
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                {commentsList.length} {commentsList.length === 1 ? 'Comment' : 'Comments'}
              </span>
            </div>

            {/* Comments List */}
            {commentsList.length === 0 ? (
              <div className="py-3 text-center text-slate-400 text-xs font-medium bg-white/60 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No reviewer comments yet. Managers can add feedback below.
              </div>
            ) : (
              <div className="space-y-2.5">
                {commentsList.map((c, index) => {
                  const commenter = c.user;
                  const commenterName = commenter
                    ? `${commenter.firstName || ''} ${commenter.lastName || ''}`.trim() || 'Reviewer'
                    : 'Reviewer';
                  const role = commenter?.role || 'REVIEWER';
                  const isAuthor = commenter?._id && currentUser?._id && commenter._id.toString() === currentUser._id.toString();
                  const canDeleteComment = isAuthor || ['ADMIN', 'CEO'].includes(currentUser?.role);

                  // Role badge config
                  const roleBadgeConfig = {
                    CEO: {
                      name: 'CEO',
                      cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    },
                    TEAM_LEAD: {
                      name: 'Team Lead',
                      cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    },
                    HR: {
                      name: 'HR Manager',
                      cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                    },
                    ADMIN: {
                      name: 'Admin',
                      cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                    }
                  };
                  const rConfig = roleBadgeConfig[role] || {
                    name: role,
                    cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  };

                  const formattedTime = c.createdAt
                    ? new Date(c.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                    : '';

                  return (
                    <div
                      key={c._id || index}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={commenter} size="w-7 h-7 text-[10px] shrink-0" />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {commenterName}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rConfig.cls}`}>
                              {rConfig.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {c.status && (
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                c.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              }`}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {c.status}
                            </span>
                          )}
                          {formattedTime && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              {formattedTime}
                            </span>
                          )}
                          {canDeleteComment && c._id !== 'legacy_review' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c._id)}
                              title="Delete this comment"
                              className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 pl-9 whitespace-pre-line leading-relaxed">
                        "{c.comment || c.feedback}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Review Form for Manager / HR / CEO */}
          {isReviewer && (
            <form onSubmit={handleReviewSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Add Your Review / Comment ({currentUser?.role === 'CEO' ? 'CEO' : currentUser?.role === 'TEAM_LEAD' ? 'Team Lead' : currentUser?.role === 'HR' ? 'HR' : 'Admin'})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('REVIEWED')}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                      reviewStatus === 'REVIEWED' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('APPROVED')}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                      reviewStatus === 'APPROVED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Approved
                  </button>
                </div>
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="2"
                placeholder="Write your review / feedback comment here..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Posting...' : 'Post Comment / Save Review'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer Motivation Bar Matching Image 1 */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Star className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                  Great job staying consistent!
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                  Keep up the good work and achieve your goals.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Done / Download Report</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal rendered via Portal on top of parent Modal */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-5 animate-in zoom-in-95 duration-200 relative z-[100001]">
            {/* Trash Badge Icon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-red-400 flex items-center justify-center shadow-lg shadow-rose-500/30 text-white">
                <Trash2 className="w-10 h-10 stroke-[2]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center text-amber-950 shadow-md">
                <AlertTriangle className="w-4 h-4 fill-amber-950 stroke-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Delete Work Report?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-200">"{currentReport.title}"</span>?
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex items-center gap-2.5 text-left text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>This action cannot be undone and will permanently remove this daily report.</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-black shadow-lg shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

const formatEmpId = (empId, fallback = 'EMP001') => {
  if (!empId) return fallback;
  if (typeof empId === 'string' && empId.match(/^[0-9a-fA-F]{24}$/)) return 'EMP' + empId.slice(-3).toUpperCase();
  return empId;
};

const formatDepartmentName = (dept, fallback = 'Engineering') => {
  if (!dept) return fallback;
  if (typeof dept === 'object' && dept.name) return dept.name;
  if (typeof dept === 'string' && !dept.match(/^[0-9a-fA-F]{24}$/)) return dept;
  return fallback;
};

const formatDesignation = (desig) => {
  if (!desig) return '';
  if (typeof desig === 'object') return desig.title || desig.name || '';
  if (typeof desig === 'string' && desig.match(/^[0-9a-fA-F]{24}$/)) return '';
  return desig;
};

const StatusBadge = ({ status }) => {
  if (status === 'APPROVED' || status === 'REVIEWED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3 h-3" /> {status}
      </span>
    );
  }
  if (status === 'BLOCKED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <AlertCircle className="w-3 h-3" /> BLOCKED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
      <CheckCircle2 className="w-3 h-3" /> {status || 'SUBMITTED'}
    </span>
  );
};

// Group reports by month
const groupByMonth = (reports) => {
  const groups = {};
  reports.forEach((r) => {
    const d = new Date(r.date);
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return groups;
};

export const EmployeeReportHistoryModal = ({ isOpen, onClose, userId, onSelectReport, refreshKey }) => {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (isOpen && userId) fetchEmployeeHistory();
  }, [isOpen, userId, refreshKey]);

  const fetchEmployeeHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/daily-reports/history/${userId}`);
      setHistoryData(res.data.data);
    } catch (err) {
      console.error('[Employee History Error]', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const targetUser = historyData?.user;
  const reports = historyData?.reports || [];
  const stats = historyData?.stats || {};
  const grouped = groupByMonth(reports);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <History className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Employee Report History</h2>
              <p className="text-[11px] text-slate-400 font-medium">Complete log of daily work reports submitted by this employee.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm font-medium animate-pulse">
              Loading report history...
            </div>
          ) : !targetUser ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              No employee history data found.
            </div>
          ) : (
            <>
              {/* ── Employee Summary Card ── */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UserAvatar user={targetUser} size="w-12 h-12 text-sm font-black" className="ring-2 ring-white dark:ring-slate-700 shadow-sm shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {targetUser.firstName} {targetUser.lastName}
                      {formatDesignation(targetUser.designation) && (
                        <span className="text-slate-400 font-semibold">, {formatDesignation(targetUser.designation)}</span>
                      )}
                    </h3>
                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mt-0.5">
                      <span>{formatEmpId(targetUser.employeeId)}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{formatDepartmentName(targetUser.department)}</span>
                    </p>
                  </div>
                </div>


              </div>

              {/* ── Monthly Tables ── */}
              {reports.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-xs font-semibold">
                  No past daily reports found for this employee.
                </div>
              ) : (
                Object.entries(grouped).map(([monthLabel, monthReports]) => (
                  <div key={monthLabel}>
                    {/* Month Header */}
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Monthly Work Log ({monthLabel})
                    </p>

                    {/* Table */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {/* Table Head */}
                      <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                        <span className="col-span-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Date</span>
                        <span className="col-span-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Project / Task</span>
                        <span className="col-span-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Description</span>
                        <span className="col-span-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Hours</span>
                        <span className="col-span-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</span>
                      </div>

                      {/* Table Rows */}
                      {monthReports.map((r, idx) => (
                        <div key={r._id}>
                          {/* Main Row */}
                          <div
                            onClick={() => setExpandedRow(expandedRow === r._id ? null : r._id)}
                            className={`grid grid-cols-12 gap-2 px-4 py-3 cursor-pointer transition-colors items-start ${
                              idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'
                            } hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${
                              expandedRow === r._id ? 'border-l-2 border-blue-500' : ''
                            }`}
                          >
                            {/* Date */}
                            <div className="col-span-3">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>

                            {/* Project / Task */}
                            <div className="col-span-3">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.projectTitle || '—'}</p>
                              {r.moduleName && (
                                <p className="text-[10px] text-slate-400 font-medium">({r.moduleName})</p>
                              )}
                            </div>

                            {/* Description */}
                            <div className="col-span-3">
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                                {r.tasksCompleted}
                              </p>
                            </div>

                            {/* Hours */}
                            <div className="col-span-1">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.hoursWorked || 8} hrs</p>
                            </div>

                            {/* Status + expand toggle */}
                            <div className="col-span-2 flex items-start justify-between gap-1">
                              <StatusBadge status={r.status} />
                              <button className="text-slate-400 hover:text-slate-600 mt-0.5">
                                {expandedRow === r._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Detail Row */}
                          {expandedRow === r._id && (
                            <div className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/10 border-t border-blue-100 dark:border-blue-900/30 space-y-2">
                              {r.pendingTasks && (
                                <div className="flex items-start gap-2 text-[11px]">
                                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span className="font-bold text-slate-600 dark:text-slate-300">Pending: </span>
                                  <span className="text-slate-500 dark:text-slate-400">{r.pendingTasks}</span>
                                </div>
                              )}
                              {r.blockers && (
                                <div className="mt-1 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                                  <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Blocker Notes:
                                  </p>
                                  <p className="text-[11px] text-rose-600 dark:text-rose-300 font-semibold mt-0.5">{r.blockers}</p>
                                </div>
                              )}
                              {/* Comments & Reviewer Feedback Thread */}
                              {(() => {
                                const list = [];
                                if (Array.isArray(r.comments) && r.comments.length > 0) {
                                  list.push(...r.comments);
                                }
                                if (r.feedback && r.feedback.trim()) {
                                  const alreadyInComments = list.some(c => (c.comment || c.feedback) === r.feedback);
                                  if (!alreadyInComments) {
                                    list.unshift({
                                      _id: 'fb_' + r._id,
                                      user: r.reviewedBy,
                                      comment: r.feedback,
                                      createdAt: r.reviewedAt || r.updatedAt
                                    });
                                  }
                                }

                                if (list.length === 0) return null;

                                const roleBadgeConfig = {
                                  CEO: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
                                  TEAM_LEAD: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700',
                                  HR: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-700',
                                  ADMIN: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                                };

                                return (
                                  <div className="mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/30 space-y-2">
                                    <p className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500 stroke-[2.5]" />
                                      Reviewer Comments & Feedback ({list.length}):
                                    </p>
                                    <div className="space-y-1.5">
                                      {list.map((c, cIdx) => {
                                        const cUser = (c.user && typeof c.user === 'object')
                                          ? c.user
                                          : (r.reviewedBy && typeof r.reviewedBy === 'object' ? r.reviewedBy : null);
                                        const cName = cUser ? `${cUser.firstName || ''} ${cUser.lastName || ''}`.trim() : 'Reviewer';
                                        const roleKey = cUser?.role || 'REVIEWER';
                                        const roleLabel = roleKey === 'CEO' ? 'CEO' : roleKey === 'TEAM_LEAD' ? 'Team Lead' : roleKey === 'HR' ? 'HR' : roleKey === 'ADMIN' ? 'Admin' : roleKey;
                                        const badgeCls = roleBadgeConfig[roleKey] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                                        return (
                                          <div key={c._id || cIdx} className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] space-y-1 shadow-2xs">
                                            <div className="flex items-center justify-between text-[10px]">
                                              <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                                                <span>{cName}</span>
                                                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border ${badgeCls}`}>
                                                  {roleLabel}
                                                </span>
                                              </div>
                                              {c.createdAt && (
                                                <span className="text-slate-400 font-medium text-[10px]">
                                                  {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-200 font-medium italic pl-2 border-l-2 border-indigo-500/70 dark:border-indigo-400">
                                              "{c.comment || c.feedback}"
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                              {onSelectReport && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onSelectReport(r); }}
                                  className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> View Full Details
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-start">
          <button
            onClick={onClose}
            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View All — full timesheet
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

import React from 'react';

export const StatusBadge = ({ status, applicantRole, isDualRole }) => {
  const styles = {
    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    TEAM_LEAD_APPROVED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    TEAM_LEAD_REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    ESCALATED_TO_HR: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 animate-pulse',
    HR_APPROVED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    HR_REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    ADMIN_APPROVED: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    ADMIN_REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    CEO_APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    CEO_REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    INACTIVE: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    DRAFT: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    OVER_DUTY: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
    OD: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
    WEEK_OFF: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  };

  const getPendingLabel = () => {
    switch (applicantRole) {
      case 'EMPLOYEE': return isDualRole ? 'Pending TL & HR Approval' : 'Pending TL Approval';
      case 'TEAM_LEAD': return 'Pending HR Approval';
      case 'HR': return 'Pending Admin Approval';
      case 'ADMIN': return 'Pending HR Approval';
      default: return 'Pending Approval';
    }
  };

  const labels = {
    PENDING: getPendingLabel(),
    TEAM_LEAD_APPROVED: 'TL Approved',
    TEAM_LEAD_REJECTED: 'TL Rejected ❌',
    ESCALATED_TO_HR: 'Escalated to HR',
    HR_APPROVED: 'HR Approved',
    HR_REJECTED: 'HR Rejected ❌',
    ADMIN_APPROVED: applicantRole === 'EMPLOYEE' ? 'Final Approved ✅' : 'Admin Approved',
    ADMIN_REJECTED: 'Admin Rejected ❌',
    CEO_APPROVED: 'Final Approved (CEO) ✅',
    CEO_REJECTED: 'CEO Rejected ❌',
    CANCELLED: 'Cancelled',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    DRAFT: 'Draft',
    OVER_DUTY: 'Over Duty (OD)',
    OD: 'Over Duty (OD)',
    WEEK_OFF: '📅 Week Off'
  };

  const currentStyle = (status === 'ADMIN_APPROVED' && applicantRole === 'EMPLOYEE')
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    : styles[status] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  const label = labels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border tracking-wide transition-colors ${currentStyle}`}
    >
      {label}
    </span>
  );
};

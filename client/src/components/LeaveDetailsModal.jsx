import React, { useState } from 'react';
import { Modal } from './Modal';
import { UserAvatar } from './UserAvatar';
import { StatusBadge } from './Badge';
import { Calendar, Clock, Phone, FileText, CheckCircle2, XCircle, Ban, Zap, ShieldAlert, History, MessageSquare, Paperclip, ExternalLink } from 'lucide-react';

export const LeaveDetailsModal = ({ isOpen, onClose, leave, currentUser, onApprove, onReject, onCancel }) => {
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  if (!leave) return null;

  const isManagerOrHR = ['TEAM_LEAD', 'HR', 'ADMIN', 'CEO'].includes(currentUser?.role);
  const isOwner = leave.user?._id?.toString() === currentUser?._id?.toString();
  const applicantRole = leave.user?.role || 'EMPLOYEE';

  const mgrId = leave.user?.reportingManager?._id || leave.user?.reportingManager;
  const isDirectManager = Boolean(
    currentUser?._id && mgrId && (mgrId.toString() === currentUser._id.toString())
  );
  const managerRole = leave.user?.reportingManager?.role;
  const isManagerDualRole = managerRole === 'HR' || (isDirectManager && currentUser?.role === 'HR');

  // Define approval chains based on applicant role (Standard 3-Step Pipeline)
  const getApprovalChain = () => {
    if (applicantRole === 'EMPLOYEE') {
      return [
        { role: 'TEAM_LEAD', label: '1. TL Approval', statusKey: 'TEAM_LEAD_APPROVED' },
        { role: 'HR', label: '2. HR Approval', statusKey: 'HR_APPROVED' },
        { role: 'ADMIN', label: '3. Admin (Final)', statusKey: 'ADMIN_APPROVED' }
      ];
    } else if (applicantRole === 'TEAM_LEAD') {
      return [
        { role: 'HR', label: '1. HR Approval', statusKey: 'HR_APPROVED' },
        { role: 'ADMIN', label: '2. Admin Approval', statusKey: 'ADMIN_APPROVED' },
        { role: 'CEO', label: '3. CEO Final', statusKey: 'CEO_APPROVED' }
      ];
    } else if (applicantRole === 'ADMIN') {
      return [
        { role: 'HR', label: '1. HR Approval', statusKey: 'HR_APPROVED' },
        { role: 'CEO', label: '2. CEO Final', statusKey: 'CEO_APPROVED' }
      ];
    } else if (applicantRole === 'HR') {
      return [
        { role: 'ADMIN', label: '1. Admin Approval', statusKey: 'ADMIN_APPROVED' },
        { role: 'CEO', label: '2. CEO Final', statusKey: 'CEO_APPROVED' }
      ];
    }
    return [{ role: 'CEO', label: '1. CEO Approval', statusKey: 'CEO_APPROVED' }];
  };

  const approvalChain = getApprovalChain();

  // Determine current active turn index in sequence
  const getCurrentStepIndex = () => {
    if (leave.status === 'PENDING' || leave.status === 'ESCALATED_TO_HR') return 0;
    if (leave.status === 'TEAM_LEAD_APPROVED') {
      const idx = approvalChain.findIndex((s) => s.role === 'HR');
      return idx !== -1 ? idx : 1;
    }
    if (leave.status === 'HR_APPROVED') {
      const idx = approvalChain.findIndex((s) => s.role === 'ADMIN');
      return idx !== -1 ? idx : approvalChain.length - 1;
    }
    if (leave.status === 'ADMIN_APPROVED') {
      const idx = approvalChain.findIndex((s) => s.role === 'CEO');
      // If no CEO step (EMPLOYEE flow), ADMIN_APPROVED = final (beyond chain)
      return idx !== -1 ? idx : approvalChain.length;
    }
    return approvalChain.length;
  };

  const currentStepIndex = getCurrentStepIndex();
  const currentTurnRole = approvalChain[currentStepIndex]?.role || 'CEO';
  const currentTurnLabel = approvalChain[currentStepIndex]?.label || 'CEO Approval';

  const isRejectedOrCancelled = ['TEAM_LEAD_REJECTED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED', 'CANCELLED'].includes(leave.status);
  // Final approved: EMPLOYEE → ADMIN_APPROVED or CEO_APPROVED, others → CEO_APPROVED
  const isFinalApproved = leave.status === 'CEO_APPROVED' || 
                           (applicantRole === 'EMPLOYEE' && leave.status === 'ADMIN_APPROVED');

  const canCancel = isOwner && !['CANCELLED', 'CEO_APPROVED', 'HR_REJECTED', 'ADMIN_REJECTED', 'CEO_REJECTED'].includes(leave.status) &&
    !(applicantRole === 'EMPLOYEE' && leave.status === 'ADMIN_APPROVED');

  // Check if current user is allowed to approve/reject right now in the sequence
  // - Step 1 (TL): Team Lead or Direct Reporting Manager (Jason) or CEO
  // - Step 2 (HR): HR (Jason) or CEO
  // - Step 3 (Admin): Admin or CEO only (Locked for Jason)
  const isMyTurn = (
    currentUser?.role === currentTurnRole ||
    currentUser?.role === 'CEO' ||
    (currentTurnRole === 'TEAM_LEAD' && isDirectManager)
  ) && !isOwner && !isFinalApproved && !isRejectedOrCancelled;
  const showReviewSection = (isManagerOrHR || isDirectManager) && (!isOwner || currentUser?.role === 'CEO');
  const isActionDisabled = actionLoading || !isMyTurn;

  const handleApproveAction = async () => {
    setActionLoading(true);
    await onApprove(leave, comments);
    setActionLoading(false);
    onClose();
  };

  const handleRejectAction = async () => {
    if (!comments.trim()) {
      alert('Please enter rejection comments/reason.');
      return;
    }
    setActionLoading(true);
    await onReject(leave, comments);
    setActionLoading(false);
    onClose();
  };

  const handleCancelAction = async () => {
    setActionLoading(true);
    await onCancel(leave);
    setActionLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave Application Details" maxWidth="max-w-3xl">
      <div className="space-y-5 sm:space-y-6 pr-1 sm:pr-3 pb-8 sm:pb-10">
        {/* Applicant Overview Banner (Mobile Responsive Stack) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar user={leave.user} size="w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                {leave.user?.firstName} {leave.user?.lastName}
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
                {leave.user?.employeeId || 'EMP'} • {leave.user?.department?.name || 'Department'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-200/60 dark:border-slate-700/60">
            <StatusBadge status={leave.status} applicantRole={leave.user?.role} isDualRole={isManagerDualRole} />
          </div>
        </div>

        {/* Multi-Level Sequential Approval Progress Pipeline */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Required Multi-Level Approval Pipeline
            </p>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
              {isFinalApproved
                ? 'Final Approved ✅'
                : isRejectedOrCancelled
                ? 'Rejected/Cancelled ❌'
                : `Pending Step ${currentStepIndex + 1}/${approvalChain.length}: ${currentTurnLabel}`}
            </span>
          </div>

          <div className={`grid ${approvalChain.length === 2 ? 'grid-cols-2' : approvalChain.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-2 pt-1`}>
            {approvalChain.map((step, idx) => {
              const isDone = idx < currentStepIndex || isFinalApproved;
              const isCurrent = idx === currentStepIndex && !isFinalApproved && !isRejectedOrCancelled;

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold'
                      : isCurrent
                      ? 'bg-blue-600/10 border-blue-600/50 text-blue-600 dark:text-blue-400 font-black ring-2 ring-blue-500/20'
                      : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 animate-pulse" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 text-[9px] flex items-center justify-center font-bold">{idx + 1}</span>
                    )}
                    <span className="text-[10px] truncate">{step.label}</span>
                  </div>
                  <span className="text-[9px] font-semibold mt-0.5 opacity-80 truncate">
                    {isDone ? 'Approved ✓' : isCurrent ? 'Current Turn ⏱' : 'Waiting ⌛'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Metrics Grid (1 Col on Mobile, 3 Cols on Tablet/Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Leave Type</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: leave.leaveType?.colorBadge || '#2563EB' }}
              />
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{leave.leaveType?.name}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Duration</p>
            <p className="text-xs font-bold text-primary mt-1">
              {leave.isPermission
                ? `${leave.permissionHours || 2} Hour${(leave.permissionHours || 2) > 1 ? 's' : ''} Permission${leave.permissionTimeSlot ? ` (${leave.permissionTimeSlot})` : ''}`
                : `${leave.daysCount} Day${leave.daysCount > 1 ? 's' : ''} ${leave.isHalfDay ? `(${leave.halfDayType})` : ''}`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Date Period</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Emergency Alert Tag if applicable */}
        {leave.isEmergency && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Urgent Emergency Leave Request</p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                Auto-escalates to HR if not reviewed within 5 minutes.
              </p>
            </div>
          </div>
        )}

        {/* Full Reason Text */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Reason for Leave
          </label>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {leave.reason || 'No reason provided.'}
          </div>
        </div>

        {/* Medical Certificate / Supporting Documents */}
        {leave.attachments?.length > 0 && (
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-primary" /> Medical Report / Attached Document
            </label>
            <div className="flex flex-wrap gap-2">
              {leave.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.fileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-bold text-primary flex items-center gap-2 transition-all group"
                >
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate max-w-[200px]">{att.fileName || `Medical_Report_${idx + 1}.pdf`}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {leave.contactNumber && (
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Emergency Contact Number
            </label>
            <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{leave.contactNumber}</p>
          </div>
        )}

        {/* Approval Timeline Audit Trail */}
        {leave.approvalFlow && leave.approvalFlow.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Approval Timeline & Audit Trail
            </label>
            <div className="space-y-4 pl-3 border-l-2 border-slate-200 dark:border-slate-700 ml-1.5 mr-1 sm:mr-4">
              {leave.approvalFlow.map((step, idx) => (
                <div key={idx} className="relative pl-3.5 sm:pl-4">
                  <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {(() => {
                        const actionLabels = {
                          'APPLIED': 'Applied',
                          'TEAM_LEAD_APPROVE': 'Approved by TL',
                          'TEAM_LEAD_REJECT': 'Rejected by TL',
                          'HR_APPROVE': 'Approved by HR',
                          'HR_REJECT': 'Rejected by HR',
                          'ADMIN_APPROVE': 'Approved by Admin',
                          'ADMIN_REJECT': 'Rejected by Admin',
                          'CEO_APPROVE': 'Final Approved by CEO',
                          'CEO_REJECT': 'Rejected by CEO',
                          'ESCALATED': 'Escalated to HR',
                          'CANCELLED': 'Cancelled'
                        };
                        const roleLabels = {
                          'TEAM_LEAD': 'Team Lead', 'ADMIN': 'Admin',
                          'HR': 'HR', 'CEO': 'CEO', 'EMPLOYEE': 'Employee', 'SYSTEM': 'System'
                        };
                        const actionText = actionLabels[step.action] || step.action?.replace(/_/g, ' ');
                        const roleText = roleLabels[step.reviewerRole] || step.reviewerRole;
                        return <>{actionText} — <span className="text-primary">{roleText}</span></>;
                      })()}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(step.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {step.comments && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 break-words">
                      "{step.comments}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviewer Action Area (Manager/HR/Admin/CEO) - Always Visible, Enabled on Role Turn */}
        {showReviewSection && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Reviewer Comments / Note
              </label>
              {isFinalApproved ? (
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Final Approved & Confirmed (CEO) ✅
                </span>
              ) : isRejectedOrCancelled ? (
                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-500" /> Application Rejected/Cancelled ❌
                </span>
              ) : isMyTurn ? (
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3 text-blue-600" /> Action Required: {currentUser?.role === 'CEO' ? 'CEO Direct Final Approval' : currentTurnLabel}
                </span>
              ) : (
                <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" /> Waiting for {currentTurnLabel} first... ⌛
                </span>
              )}
            </div>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isActionDisabled}
              placeholder={
                isFinalApproved
                  ? "Leave application has been fully approved by CEO."
                  : isRejectedOrCancelled
                  ? "Leave application has been rejected or cancelled."
                  : isMyTurn
                  ? "Enter approval note or rejection reason..."
                  : `Waiting for ${currentTurnLabel} to approve first.`
              }
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/80"
              rows={2}
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={handleRejectAction}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none w-full sm:w-auto"
              >
                <XCircle className="w-4 h-4" /> Reject Leave
              </button>

              <button
                type="button"
                disabled={isActionDisabled}
                onClick={handleApproveAction}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none w-full sm:w-auto"
              >
                <CheckCircle2 className="w-4 h-4" /> {currentUser?.role === 'CEO' ? 'Approve & Finalize (CEO Direct)' : (currentUser?.role === 'ADMIN' && applicantRole === 'EMPLOYEE' && leave.status === 'HR_APPROVED') ? 'Approve & Finalize (Admin)' : 'Approve Leave'}
              </button>
            </div>
          </div>
        )}

        {/* Owner Cancel Action */}
        {canCancel && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleCancelAction}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <Ban className="w-4 h-4" /> Cancel Application
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

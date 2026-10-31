import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import api from '../services/api';
import { AlertCircle, Zap, Calendar, FileText, Phone, Paperclip, Clock } from 'lucide-react';

export const LeaveApplyModal = ({ isOpen, onClose, onSuccess, leaveTypes = [], balance }) => {
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('FIRST_HALF');
  const [isPermission, setIsPermission] = useState(false);
  const [permissionHours, setPermissionHours] = useState('');
  const [permissionStartTime, setPermissionStartTime] = useState('');
  const [permissionEndTime, setPermissionEndTime] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [reason, setReason] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [daysCount, setDaysCount] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const permissionTimeSlot = permissionStartTime && permissionEndTime
    ? `${permissionStartTime} - ${permissionEndTime}`
    : '';

  const updatePermissionTimes = (startTime, endTime) => {
    setPermissionStartTime(startTime);
    setPermissionEndTime(endTime);
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const duration = ((endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)) / 60;
      setPermissionHours(duration > 0 ? String(Math.round(duration * 100) / 100) : '0');
    } else {
      setPermissionHours('0');
    }
  };

  useEffect(() => {
    if (leaveTypes.length > 0 && !leaveType) {
      setLeaveType(leaveTypes[0]._id);
    }
  }, [leaveTypes, leaveType]);

  // Auto-calculate leave duration
  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      if (start <= end) {
        if (isHalfDay) {
          setDaysCount(0.5);
        } else if (isPermission) {
          const hrs = Number(permissionHours) || 2;
          setDaysCount(Math.round((hrs / 8) * 1000) / 1000);
        } else {
          const diffTime = Math.abs(end - start);
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          setDaysCount(days);
        }
        setError('');
      } else {
        setDaysCount(0);
        setError('From Date cannot be later than To Date.');
      }
    }
  }, [fromDate, toDate, isHalfDay, isPermission, permissionHours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isPermission && (!permissionStartTime || !permissionEndTime || Number(permissionHours) <= 0)) {
      setError('Please select a valid permission start and end time.');
      return;
    }
    if (daysCount <= 0) {
      setError('Invalid date selection.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const attachments = (attachmentName.trim() && attachmentUrl.trim()) ? [{
        fileName: attachmentName.trim(),
        fileUrl: attachmentUrl.trim(),
        fileType: 'application/pdf'
      }] : [];

      await api.post('/leaves', {
        leaveType,
        fromDate,
        toDate,
        isHalfDay: isPermission ? false : isHalfDay,
        halfDayType: (isHalfDay && !isPermission) ? halfDayType : 'NONE',
        isPermission,
        permissionHours: isPermission ? Number(permissionHours) : 0,
        permissionTimeSlot: isPermission ? permissionTimeSlot : '',
        isEmergency,
        reason,
        contactNumber,
        attachments
      });

      onSuccess();
      onClose();
      // Reset Form
      setReason('');
      setContactNumber('');
      setAttachmentName('');
      setAttachmentUrl('');
      setIsEmergency(false);
      setIsHalfDay(false);
      setIsPermission(false);
      setPermissionHours('');
      setPermissionStartTime('');
      setPermissionEndTime('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Remaining days for selected leave type
  const selectedAlloc = balance?.allocations?.find(
    (a) => a.leaveType?._id === leaveType || a.leaveType === leaveType
  );
  const remainingDays = selectedAlloc ? selectedAlloc.remaining : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Leave" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Leave Type Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Leave Type *
          </label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
          >
            {leaveTypes.map((lt) => (
              <option key={lt._id} value={lt._id}>
                {lt.name} ({lt.code}) — Max {lt.maxDays} Days
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs text-slate-400 flex items-center justify-between font-medium">
            <span>Available Balance: <strong className="text-primary">{remainingDays} Days</strong></span>
            {remainingDays < daysCount && (
              <span className="text-amber-500 font-bold">⚠️ Warning: Exceeds Balance</span>
            )}
          </div>
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              From Date *
            </label>
            <input
              type="date"
              value={fromDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              To Date *
            </label>
            <input
              type="date"
              value={toDate}
              min={fromDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
              required
            />
          </div>
        </div>

        {/* Leave Duration Options (Half Day & Hourly Permission) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Half Day Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsHalfDay(val);
                  if (val) setIsPermission(false);
                }}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Apply as Half Day</span>
            </label>

            {/* Permission Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPermission}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsPermission(val);
                  if (val) setIsHalfDay(false);
                }}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Apply for Permission (Hours)
              </span>
            </label>

            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold uppercase">
                {isPermission ? 'Duration: ' : 'Total Days: '}
              </span>
              <span className="text-sm font-extrabold text-primary">
                {isPermission
                  ? (permissionHours ? `${permissionHours} Hour${Number(permissionHours) !== 1 ? 's' : ''}` : '--')
                  : daysCount}
              </span>
            </div>
          </div>

          {/* Half Day Selection */}
          {isHalfDay && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Half Day Session:</span>
              <select
                value={halfDayType}
                onChange={(e) => setHalfDayType(e.target.value)}
                className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-primary flex-1"
              >
                <option value="FIRST_HALF">First Half (Morning)</option>
                <option value="SECOND_HALF">Second Half (Afternoon)</option>
              </select>
            </div>
          )}

          {/* Permission Hours & Time Slot Options */}
          {isPermission && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Permission Start Time *
                  </label>
                  <input
                    type="time"
                    value={permissionStartTime}
                    onChange={(e) => updatePermissionTimes(e.target.value, permissionEndTime)}
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    required={isPermission}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Permission End Time *
                  </label>
                  <input
                    type="time"
                    value={permissionEndTime}
                    onChange={(e) => updatePermissionTimes(permissionStartTime, e.target.value)}
                    min={permissionStartTime || undefined}
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    required={isPermission}
                  />
                </div>
              </div>

              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-[11px] text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {permissionHours
                    ? `Permission requested: ${permissionHours} Hour${Number(permissionHours) !== 1 ? 's' : ''} (${permissionTimeSlot})`
                    : 'Select start and end times to calculate permission duration.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Leave Toggle */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Emergency Leave Request</p>
              <p className="text-[11px] text-slate-500">Auto-escalates to HR if Manager doesn't respond in 5 mins.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
            className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* Reason Textarea */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Reason for Leave *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please detail the reason for your leave request..."
            rows={3}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
            required
          />
        </div>

        {/* Medical Certificate / Supporting Attachment Field (Optional) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-primary" /> Medical Certificate / Attachment
            </span>
            <span className="text-[10px] text-slate-400 font-semibold lowercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              (Optional)
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="e.g. Medical_Report_Aug.pdf"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
            />
            <input
              type="text"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="Document Link / Drive URL (Optional)"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            Attach medical report or fitness certificate for medical leave (optional).
          </p>
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Emergency Contact Number During Leave
          </label>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ''))}
            maxLength="10"
            placeholder="9876543210"
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || daysCount <= 0}
            className="px-6 py-2.5 text-xs font-bold text-white bg-primary hover:bg-blue-700 rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

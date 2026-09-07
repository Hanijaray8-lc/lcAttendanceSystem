import React from 'react';
import { Modal } from './Modal';
import { UserAvatar } from './UserAvatar';
import { LogIn, LogOut, Coffee, UtensilsCrossed, Clock, MapPin, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

const formatISTTime = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  } catch (e) {
    return '—';
  }
};

const calculateGapString = (startIso, endIso) => {
  if (!startIso || !endIso) return null;
  const diffMs = new Date(endIso) - new Date(startIso);
  if (diffMs <= 0) return null;
  const mins = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs === 0) return `${remMins}m`;
  if (remMins === 0) return `${hrs}h`;
  return `${hrs}h ${remMins}m`;
};

const parseTimeFromNote = (noteStr, defaultDateStr) => {
  if (!noteStr) return defaultDateStr;
  const match = noteStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const baseDate = new Date(defaultDateStr || Date.now());
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate.toISOString();
  }
  return defaultDateStr;
};

export const AttendanceTimelineModal = ({ isOpen, onClose, liveItem }) => {
  if (!liveItem) return null;

  const emp = liveItem.employee || liveItem.user || {};
  const attendance = liveItem.attendance || liveItem;
  
  const empName = emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : (emp.name || 'Employee');
  const empId = emp.employeeId || 'N/A';
  const dept = emp.department?.name || emp.department || 'General';

  // Build unified timeline entries
  let rawTimeline = [];
  const timelineArr = (Array.isArray(attendance?.timeline) && attendance.timeline.length > 0)
    ? attendance.timeline
    : (Array.isArray(liveItem?.timeline) && liveItem.timeline.length > 0)
      ? liveItem.timeline
      : [];

  if (timelineArr.length > 0) {
    rawTimeline = [...timelineArr];
  } else {
    // Fallback parser for records without structured timeline array
    const clockInTime = liveItem.clockInTime || attendance.clockIn;
    if (clockInTime) {
      rawTimeline.push({
        type: 'CLOCK_IN',
        timestamp: clockInTime,
        workLocation: liveItem.workLocation || attendance.workLocation || 'IN_OFFICE',
        note: 'First Clock In of the day'
      });
    }

    if (liveItem.lunchOutTime || attendance.lunchOut) {
      rawTimeline.push({
        type: 'LUNCH_OUT',
        timestamp: liveItem.lunchOutTime || attendance.lunchOut,
        workLocation: liveItem.workLocation || attendance.workLocation
      });
    }

    if (liveItem.lunchInTime || attendance.lunchIn) {
      rawTimeline.push({
        type: 'LUNCH_IN',
        timestamp: liveItem.lunchInTime || attendance.lunchIn,
        workLocation: liveItem.workLocation || attendance.workLocation
      });
    }

    // Parse all events recorded in notes (Force checked out, Re-clocked in, etc.)
    const notesStr = attendance.notes || liveItem.notes || '';
    if (notesStr && typeof notesStr === 'string') {
      const parts = notesStr.split('|');
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('Force checked out')) {
          rawTimeline.push({
            type: 'FORCE_CHECKOUT',
            timestamp: parseTimeFromNote(trimmed, liveItem.clockOutTime || attendance.clockOut || attendance.updatedAt),
            workLocation: liveItem.workLocation || attendance.workLocation,
            note: trimmed
          });
        } else if (trimmed.includes('Re-clocked in')) {
          rawTimeline.push({
            type: 'CLOCK_IN',
            timestamp: parseTimeFromNote(trimmed, attendance.updatedAt),
            workLocation: liveItem.workLocation || attendance.workLocation,
            note: trimmed
          });
        }
      });
    }

    if ((liveItem.clockOutTime || attendance.clockOut) && !rawTimeline.some(t => t.type === 'FORCE_CHECKOUT' || t.type === 'CLOCK_OUT')) {
      rawTimeline.push({
        type: 'CLOCK_OUT',
        timestamp: liveItem.clockOutTime || attendance.clockOut,
        workLocation: liveItem.workLocation || attendance.workLocation,
        note: notesStr?.includes('Force checked out') ? notesStr : undefined
      });
    }
  }

  // Deduplicate and sort chronologically
  const uniqueTimeline = [];
  const seenKeys = new Set();
  rawTimeline.forEach(item => {
    const key = `${item.type}_${new Date(item.timestamp).getTime()}_${item.note || ''}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueTimeline.push(item);
    }
  });
  rawTimeline = uniqueTimeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Interleave Break duration gaps between events
  const displayTimeline = [];
  for (let i = 0; i < rawTimeline.length; i++) {
    const current = rawTimeline[i];
    displayTimeline.push(current);

    // If current is Clock Out, Force Checkout or Lunch Out and next is Clock In or Lunch In, add a gap element
    if (i < rawTimeline.length - 1) {
      const next = rawTimeline[i + 1];
      const gapStr = calculateGapString(current.timestamp, next.timestamp);
      if (gapStr && (current.type === 'CLOCK_OUT' || current.type === 'FORCE_CHECKOUT' || current.type === 'LUNCH_OUT')) {
        displayTimeline.push({
          type: 'BREAK_GAP',
          gapDuration: gapStr,
          startTimestamp: current.timestamp,
          endTimestamp: next.timestamp
        });
      }
    }
  }

  // Calculate stats
  const lastEvent = rawTimeline[rawTimeline.length - 1];
  const isActiveSession = lastEvent?.type === 'CLOCK_IN' || lastEvent?.type === 'LUNCH_IN';

  const firstClockIn = rawTimeline.find(t => t.type === 'CLOCK_IN')?.timestamp || liveItem.clockInTime || attendance.clockIn;
  const lastClockOut = isActiveSession 
    ? null 
    : ([...rawTimeline].reverse().find(t => t.type === 'CLOCK_OUT' || t.type === 'FORCE_CHECKOUT')?.timestamp || liveItem.clockOutTime || attendance.clockOut);
  const totalHoursNum = liveItem.totalHours || attendance.totalHours || 0;

  const formattedHours = isActiveSession 
    ? '⏱ Active' 
    : (totalHoursNum ? (() => {
        const h = Math.floor(totalHoursNum);
        const m = Math.round((totalHoursNum - h) * 60);
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
      })() : (firstClockIn && !lastClockOut ? '⏱ Active' : '—'));

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Employee Header */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <UserAvatar user={emp} size="w-12 h-12 text-sm font-black shrink-0 ring-2 ring-purple-500/20" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{empName}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {empId} • {dept}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <Sparkles className="w-3 h-3" />
              Daily Timeline
            </span>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 text-center">
            <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-300 uppercase tracking-wider block">First In</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-0.5">{formatISTTime(firstClockIn)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/30 text-center">
            <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-300 uppercase tracking-wider block">Last Out</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-0.5">{formatISTTime(lastClockOut)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-center">
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider block">Total Work</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-0.5">{formattedHours}</span>
          </div>
        </div>

        {/* Timeline List */}
        <div className="pt-2 px-1">
          <h5 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Activity Log</h5>

          {displayTimeline.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No activity logs recorded for today yet.
            </div>
          ) : (
            <div className="relative pl-6 ml-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-4 my-2">
              {displayTimeline.map((item, idx) => {
                if (item.type === 'BREAK_GAP') {
                  return (
                    <div key={`gap-${idx}`} className="relative my-2">
                      {/* Gap Dot */}
                      <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-100 dark:bg-amber-950 border-2 border-amber-500 flex items-center justify-center shadow-xs">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                      </div>
                      <div className="p-2 px-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-dashed border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 shadow-2xs">
                        <span className="flex items-center gap-1.5 text-[11px] font-extrabold">
                          <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Break / Away Duration
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900/70 font-black text-[11px]">
                          {item.gapDuration}
                        </span>
                      </div>
                    </div>
                  );
                }

                let icon = <LogIn className="w-3.5 h-3.5 text-purple-600" />;
                let badgeBg = 'bg-purple-100/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200/80';
                let dotBorder = 'border-purple-600 bg-purple-500 ring-4 ring-purple-100 dark:ring-purple-950/60';
                let cardBorder = 'border-l-4 border-l-purple-500 border-slate-100 dark:border-slate-800';
                let label = 'Clock In';

                if (item.type === 'CLOCK_OUT') {
                  icon = <LogOut className="w-3.5 h-3.5 text-orange-600" />;
                  badgeBg = 'bg-orange-100/90 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border-orange-200/80';
                  dotBorder = 'border-orange-500 bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-950/60';
                  cardBorder = 'border-l-4 border-l-orange-500 border-slate-100 dark:border-slate-800';
                  label = 'Clock Out';
                } else if (item.type === 'LUNCH_OUT') {
                  icon = <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />;
                  badgeBg = 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200/80';
                  dotBorder = 'border-amber-500 bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950/60';
                  cardBorder = 'border-l-4 border-l-amber-500 border-slate-100 dark:border-slate-800';
                  label = 'Lunch Out';
                } else if (item.type === 'LUNCH_IN') {
                  icon = <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />;
                  badgeBg = 'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/80';
                  dotBorder = 'border-emerald-500 bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/60';
                  cardBorder = 'border-l-4 border-l-emerald-500 border-slate-100 dark:border-slate-800';
                  label = 'Lunch In';
                } else if (item.type === 'FORCE_CHECKOUT') {
                  icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
                  badgeBg = 'bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200/80';
                  dotBorder = 'border-rose-600 bg-rose-600 ring-4 ring-rose-100 dark:ring-rose-950/60';
                  cardBorder = 'border-l-4 border-l-rose-500 border-slate-100 dark:border-slate-800';
                  label = 'Force Checkout';
                }

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Dot centered on line */}
                    <div className={`absolute -left-[33px] top-3.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 ${dotBorder} flex items-center justify-center shadow-xs transition-transform group-hover:scale-125`} />

                    <div className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border shadow-2xs space-y-2 hover:shadow-md transition-all ${cardBorder}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 border shadow-2xs ${badgeBg}`}>
                            {icon}
                            {label}
                          </span>
                          {item.workLocation && (
                            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              {item.workLocation === 'WFH' ? 'WFH' : 'Office'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white font-mono bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                          {formatISTTime(item.timestamp)}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold pl-2.5 border-l-2 border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 py-1 rounded-r-lg">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

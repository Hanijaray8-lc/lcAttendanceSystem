import { Attendance } from '../models/Attendance.js';
import { Settings } from '../models/Settings.js';
import { Notification } from '../models/Notification.js';

export const runAutoCheckoutJob = async () => {
  try {
    const settings = await Settings.findOne() || { autoCheckoutTime: '19:00', enableAutoCheckout: true };
    if (settings.enableAutoCheckout === false) return;

    // Get current time in IST (Asia/Kolkata)
    const now = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = istFormatter.formatToParts(now);
    let currentHours = 0;
    let currentMinutes = 0;
    for (const part of parts) {
      if (part.type === 'hour') currentHours = parseInt(part.value, 10);
      if (part.type === 'minute') currentMinutes = parseInt(part.value, 10);
    }
    if (currentHours === 24) currentHours = 0;

    // Today's start in IST
    const todayISTStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
    const todayStartIST = new Date(`${todayISTStr}T00:00:00.000+05:30`);

    // Target auto checkout time: 7:00 PM IST (19:00)
    const targetTimeStr = process.env.AUTO_CHECKOUT_TIME || '19:00';
    const [targetHour, targetMinute = 0] = targetTimeStr.split(':').map(Number);

    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const targetTotalMinutes = targetHour * 60 + targetMinute;
    const isPastTargetHour = currentTotalMinutes >= targetTotalMinutes;

    // Formatted display string (e.g., "12:17 PM IST" or "7:00 PM IST")
    const displayHour = targetHour % 12 || 12;
    const ampm = targetHour >= 12 ? 'PM' : 'AM';
    const displayTimeStr = `${displayHour}:${String(targetMinute).padStart(2, '0')} ${ampm} IST`;

    // Find active attendance records where clockIn exists but clockOut is missing:
    // 1. Any record from a PAST DAY (< todayStartIST) is immediately auto-closed
    // 2. Today's records are auto-closed if current time is at or past target time
    const query = isPastTargetHour
      ? { 
          clockIn: { $ne: null }, 
          $or: [{ clockOut: null }, { clockOut: { $exists: false } }]
        }
      : { 
          clockIn: { $ne: null, $lt: todayStartIST }, 
          $or: [{ clockOut: null }, { clockOut: { $exists: false } }]
        };

    const openAttendances = await Attendance.find(query).populate('user', 'firstName lastName email role');

    if (!openAttendances || openAttendances.length === 0) {
      return;
    }

    console.log(`⏰ [Auto Check-Out Service] Found ${openAttendances.length} open sessions to auto check out at ${displayTimeStr}...`);

    for (const att of openAttendances) {
      try {
        // Construct target checkout time date object for the day of attendance clockIn
        const clockInDate = new Date(att.clockIn);
        const istDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(clockInDate);
        const targetFormatted = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}:00.000+05:30`;
        const autoCheckoutTime = new Date(`${istDateStr}T${targetFormatted}`);

        // If clockIn was after target time, use actual clockIn + 1min or now
        const checkoutTime = autoCheckoutTime > clockInDate ? autoCheckoutTime : now;

        let diffMs = checkoutTime - new Date(att.clockIn);
        if (att.lunchOut && att.lunchIn) {
          diffMs -= (new Date(att.lunchIn) - new Date(att.lunchOut));
        }
        if (att.extraBreakMs) {
          diffMs -= att.extraBreakMs;
        }

        const totalHours = Math.max(0.1, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));

        att.clockOut = checkoutTime;
        att.totalHours = totalHours;

        const autoNote = `System Auto Checked Out at ${displayTimeStr}`;
        att.notes = att.notes ? `${att.notes} | ${autoNote}` : autoNote;

        if (!att.timeline) att.timeline = [];
        const alreadyHasAutoCheckout = att.timeline.some(t => t.type === 'FORCE_CHECKOUT');

        if (!alreadyHasAutoCheckout) {
          att.timeline.push({
            type: 'FORCE_CHECKOUT',
            timestamp: checkoutTime,
            workLocation: att.workLocation || 'IN_OFFICE',
            note: autoNote
          });
        }

        att.markModified('timeline');
        await att.save();

        // Send Notification to Employee
        if (att.user?._id) {
          await Notification.safeCreate({
            recipient: att.user._id,
            title: '⏰ Auto Check-Out Completed',
            message: `You were automatically checked out at ${displayTimeStr}. Total work hours: ${totalHours} hrs.`,
            type: 'SYSTEM',
            targetUrl: '/attendance'
          });
        }

        console.log(`✅ [Auto Check-Out] User ${att.user?.firstName || att.user} auto checked out at ${displayTimeStr}.`);
      } catch (err) {
        console.error(`❌ [Auto Check-Out Error] Failed for attendance ID ${att._id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ [Auto Check-Out Service Exception]:', error.message);
  }
};

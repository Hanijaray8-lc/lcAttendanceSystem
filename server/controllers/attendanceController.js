import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { decryptFaceDescriptor } from '../utils/encryption.js';

// Get today's start and end date in IST (Asia/Kolkata timezone)
const getTodayDateRange = () => {
  const now = new Date();
  const istDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  const start = new Date(`${istDateStr}T00:00:00.000+05:30`);
  const end = new Date(`${istDateStr}T23:59:59.999+05:30`);
  return { start, end };
};

// Helper to get IST hours, minutes, and day regardless of server UTC environment
const getISTTime = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  let hours = 0;
  let minutes = 0;
  let dayName = '';
  for (const part of parts) {
    if (part.type === 'hour') hours = parseInt(part.value, 10);
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
    if (part.type === 'weekday') dayName = part.value;
  }
  if (hours === 24) hours = 0;
  const isSunday = dayName === 'Sun';
  return { hours, minutes, isSunday };
};

// Calculate Euclidean distance between two descriptor arrays
const calculateEuclideanDistance = (desc1, desc2) => {
  // Validate that both descriptors are valid arrays with 128 elements
  if (!desc1 || !desc2 || !Array.isArray(desc1) || !Array.isArray(desc2) || desc1.length !== 128 || desc2.length !== 128) {
    return 1.0;
  }
  
  // Check if descriptors are empty (all zeros) which means invalid face scan
  const isDesc1Empty = desc1.every(val => val === 0);
  const isDesc2Empty = desc2.every(val => val === 0);
  if (isDesc1Empty || isDesc2Empty) {
    return 1.0;
  }

  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const v1 = parseFloat(desc1[i]);
    const v2 = parseFloat(desc2[i]);
    
    // If any value is not a valid number, fail the validation
    if (isNaN(v1) || isNaN(v2)) return 1.0;
    
    const diff = v1 - v2;
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

const verifyUserFaceDescriptor = (user, submittedDescriptor) => {
  // SECURITY FIX: Removed CEO exemption - ALL users must use face verification
  
  if (!user.isFaceRegistered || !user.faceDescriptor) {
    return {
      valid: false,
      message: 'Face Lock not registered or corrupted. Please contact your administrator to re-register your face.'
    };
  }
  
  if (!submittedDescriptor || !Array.isArray(submittedDescriptor) || submittedDescriptor.length !== 128) {
    return { valid: false, message: 'Invalid face scan detected. Please try again.' };
  }
  
  // Decrypt the stored face descriptor
  let storedDescriptor;
  try {
    storedDescriptor = decryptFaceDescriptor(user.faceDescriptor);
    if (!storedDescriptor || !Array.isArray(storedDescriptor) || storedDescriptor.length !== 128) {
      console.error(`❌ [Face Verification] Decryption failed or invalid descriptor for ${user.email}`);
      return {
        valid: false,
        message: 'Face Lock data is corrupted. Please contact your administrator to re-register your face.'
      };
    }
  } catch (error) {
    console.error(`❌ [Face Verification] Decryption error for ${user.email}:`, error.message);
    return {
      valid: false,
      message: 'Face verification system error. Please contact your administrator.'
    };
  }
  
  const distance = calculateEuclideanDistance(storedDescriptor, submittedDescriptor);
  console.log(`[Face Verification] User: ${user.email}, Role: ${user.role}, Distance: ${distance.toFixed(4)}`);
  
  // STRICT threshold: 0.40 (0.50 was allowing false positives)
  // This prevents unauthorized users from using similar-looking faces
  if (isNaN(distance) || distance > 0.40) {
    console.log(`[Face Verification FAILED] Distance ${distance.toFixed(4)} exceeds threshold 0.40`);
    return { valid: false, message: 'Face verification failed! Face does not match the registered profile. Please use your own registered face.' };
  }
  
  console.log(`[Face Verification SUCCESS] Distance ${distance.toFixed(4)} within threshold 0.40`);
  return { valid: true, distance };
};

// Helper to check if a given date corresponds to today in IST (Asia/Kolkata)
const isTodayInIST = (dateVal) => {
  if (!dateVal) return false;
  const todayISTStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const recordISTStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(dateVal));
  return todayISTStr === recordISTStr;
};

// Clock In
export const clockIn = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { workLocation, notes, faceDescriptor } = req.body;
  const { start } = getTodayDateRange();

  // Face Verification Check
  const faceVerification = verifyUserFaceDescriptor(req.user, faceDescriptor);
  if (!faceVerification.valid) {
    return next(new AppError(faceVerification.message, 400));
  }

  // 1. Find user's latest attendance document
  let existingAttendance = await Attendance.findOne({
    user: userId
  }).sort({ date: -1, createdAt: -1 });

  // 2. Check if the latest attendance document belongs to today in IST
  const isTodayDoc = existingAttendance && (
    isTodayInIST(existingAttendance.date) ||
    isTodayInIST(existingAttendance.clockIn)
  );

  const now = new Date();
  const { hours, minutes, isSunday } = getISTTime(now);
  const isLate = hours >= 9 && (hours > 9 || minutes > 40);
  const attendanceStatus = isSunday ? 'OVER_DUTY' : (isLate ? 'LATE' : 'PRESENT');

  if (isTodayDoc && existingAttendance) {
    if (existingAttendance.clockOut) {
      const gapMs = now - new Date(existingAttendance.clockOut);
      existingAttendance.extraBreakMs = (existingAttendance.extraBreakMs || 0) + gapMs;

      // Ensure the checkout event is preserved in timeline array before resetting clockOut
      if (!existingAttendance.timeline) existingAttendance.timeline = [];
      const isForce = existingAttendance.notes?.includes('Force checked out');
      const hasCheckoutInTimeline = existingAttendance.timeline.some(
        (t) => (t.type === 'CLOCK_OUT' || t.type === 'FORCE_CHECKOUT') &&
               new Date(t.timestamp).getTime() === new Date(existingAttendance.clockOut).getTime()
      );
      if (!hasCheckoutInTimeline) {
        existingAttendance.timeline.push({
          type: isForce ? 'FORCE_CHECKOUT' : 'CLOCK_OUT',
          timestamp: existingAttendance.clockOut,
          workLocation: existingAttendance.workLocation,
          note: isForce ? existingAttendance.notes : undefined
        });
      }
      existingAttendance.markModified('timeline');
      if (existingAttendance.lunchOut && !existingAttendance.lunchIn) {
        existingAttendance.lunchIn = now;
        if (!existingAttendance.timeline) existingAttendance.timeline = [];
        existingAttendance.timeline.push({
          type: 'LUNCH_IN',
          timestamp: now,
          workLocation: existingAttendance.workLocation,
          note: 'Auto lunch-in on re-clocking in'
        });
      }

      existingAttendance.clockOut = undefined;
      existingAttendance.totalHours = undefined;
      if (workLocation) existingAttendance.workLocation = workLocation;

      const firstClockInIST = getISTTime(new Date(existingAttendance.clockIn || now));
      const originalIsLate = firstClockInIST.hours >= 9 && (firstClockInIST.hours > 9 || firstClockInIST.minutes > 40);
      existingAttendance.status = firstClockInIST.isSunday ? 'OVER_DUTY' : (originalIsLate ? 'LATE' : 'PRESENT');

      const timeLogStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const newNote = `Re-clocked in at ${timeLogStr} IST`;
      existingAttendance.notes = existingAttendance.notes ? `${existingAttendance.notes} | ${newNote}` : newNote;

      if (!existingAttendance.timeline) existingAttendance.timeline = [];
      existingAttendance.timeline.push({
        type: 'CLOCK_IN',
        timestamp: now,
        workLocation: workLocation || existingAttendance.workLocation,
        note: newNote
      });

      existingAttendance.markModified('timeline');
      await existingAttendance.save();
      return res.status(200).json({
        status: 'success',
        message: 'Checked in successfully.',
        data: { attendance: existingAttendance }
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { attendance: existingAttendance }
    });
  }

  // 3. First check-in of the day for this user
  try {
    const initialNote = notes || (isSunday ? 'Sunday Special Over Duty (OD)' : 'First Clock In of the day');
    const attendance = await Attendance.create({
      user: userId,
      date: start,
      clockIn: now,
      workLocation: workLocation || 'IN_OFFICE',
      status: attendanceStatus,
      notes: initialNote,
      timeline: [
        {
          type: 'CLOCK_IN',
          timestamp: now,
          workLocation: workLocation || 'IN_OFFICE',
          note: initialNote
        }
      ]
    });

    return res.status(201).json({
      status: 'success',
      data: { attendance }
    });
  } catch (err) {
    // If MongoDB E11000 duplicate key error occurs on user_1_date_1 index, update the existing document!
    if (err.code === 11000) {
      let duplicateDoc = await Attendance.findOne({ user: userId }).sort({ date: -1, createdAt: -1 });
      if (duplicateDoc) {
        if (duplicateDoc.clockOut) {
          const gapMs = now - new Date(duplicateDoc.clockOut);
          duplicateDoc.extraBreakMs = (duplicateDoc.extraBreakMs || 0) + gapMs;

          if (!duplicateDoc.timeline) duplicateDoc.timeline = [];
          const hasCheckoutInTimeline = duplicateDoc.timeline.some(
            (t) => (t.type === 'CLOCK_OUT' || t.type === 'FORCE_CHECKOUT') &&
                   new Date(t.timestamp).getTime() === new Date(duplicateDoc.clockOut).getTime()
          );
          if (!hasCheckoutInTimeline) {
            const isForce = duplicateDoc.notes?.includes('Force checked out');
            duplicateDoc.timeline.push({
              type: isForce ? 'FORCE_CHECKOUT' : 'CLOCK_OUT',
              timestamp: duplicateDoc.clockOut,
              workLocation: duplicateDoc.workLocation,
              note: isForce ? duplicateDoc.notes : undefined
            });
          }
          if (duplicateDoc.lunchOut && !duplicateDoc.lunchIn) {
            duplicateDoc.lunchIn = now;
            if (!duplicateDoc.timeline) duplicateDoc.timeline = [];
            duplicateDoc.timeline.push({
              type: 'LUNCH_IN',
              timestamp: now,
              workLocation: duplicateDoc.workLocation,
              note: 'Auto lunch-in on re-clocking in'
            });
          }

          duplicateDoc.clockOut = undefined;
          duplicateDoc.totalHours = undefined;
          if (workLocation) duplicateDoc.workLocation = workLocation;

          const firstClockInIST = getISTTime(new Date(duplicateDoc.clockIn || now));
          const originalIsLate = firstClockInIST.hours >= 9 && (firstClockInIST.hours > 9 || firstClockInIST.minutes > 40);
          duplicateDoc.status = firstClockInIST.isSunday ? 'OVER_DUTY' : (originalIsLate ? 'LATE' : 'PRESENT');

          const timeLogStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
          const newNote = `Re-clocked in at ${timeLogStr} IST`;
          duplicateDoc.notes = duplicateDoc.notes ? `${duplicateDoc.notes} | ${newNote}` : newNote;

          if (!duplicateDoc.timeline) duplicateDoc.timeline = [];
          duplicateDoc.timeline.push({
            type: 'CLOCK_IN',
            timestamp: now,
            workLocation: workLocation || duplicateDoc.workLocation,
            note: newNote
          });

          duplicateDoc.markModified('timeline');
          await duplicateDoc.save();
          return res.status(200).json({
            status: 'success',
            message: 'Checked in successfully.',
            data: { attendance: duplicateDoc }
          });
        }

        return res.status(200).json({
          status: 'success',
          data: { attendance: duplicateDoc }
        });
      }
    }
    throw err;
  }
});

// Lunch Out
export const lunchOut = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { faceDescriptor } = req.body;

  // Face Verification Check
  const faceVerification = verifyUserFaceDescriptor(req.user, faceDescriptor);
  if (!faceVerification.valid) {
    return next(new AppError(faceVerification.message, 400));
  }

  const latest = await Attendance.findOne({ user: userId }).sort({ date: -1, createdAt: -1 });
  const attendance = (latest && (!latest.clockOut || isTodayInIST(latest.date) || isTodayInIST(latest.clockIn))) ? latest : null;

  if (!attendance) {
    return next(new AppError('No clock-in record found for today.', 404));
  }

  if (attendance.clockOut) {
    return next(new AppError('You have already clocked out for today.', 400));
  }

  if (attendance.lunchOut) {
    return next(new AppError('You have already taken lunch out.', 400));
  }

  const now = new Date();
  attendance.lunchOut = now;
  if (!attendance.timeline) attendance.timeline = [];
  attendance.timeline.push({
    type: 'LUNCH_OUT',
    timestamp: now,
    workLocation: attendance.workLocation
  });
  await attendance.save();

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Lunch In
export const lunchIn = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { faceDescriptor } = req.body;

  // Face Verification Check
  const faceVerification = verifyUserFaceDescriptor(req.user, faceDescriptor);
  if (!faceVerification.valid) {
    return next(new AppError(faceVerification.message, 400));
  }

  const latest = await Attendance.findOne({ user: userId }).sort({ date: -1, createdAt: -1 });
  const attendance = (latest && (!latest.clockOut || isTodayInIST(latest.date) || isTodayInIST(latest.clockIn))) ? latest : null;

  if (!attendance) {
    return next(new AppError('No clock-in record found for today.', 404));
  }

  if (attendance.clockOut) {
    return next(new AppError('You have already clocked out for today.', 400));
  }

  if (!attendance.lunchOut) {
    return next(new AppError('You have not taken lunch out yet.', 400));
  }

  if (attendance.lunchIn) {
    return next(new AppError('You have already taken lunch in.', 400));
  }

  const now = new Date();
  attendance.lunchIn = now;
  if (!attendance.timeline) attendance.timeline = [];
  attendance.timeline.push({
    type: 'LUNCH_IN',
    timestamp: now,
    workLocation: attendance.workLocation
  });
  await attendance.save();

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Clock Out
export const clockOut = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { faceDescriptor } = req.body;

  // Face Verification Check
  const faceVerification = verifyUserFaceDescriptor(req.user, faceDescriptor);
  if (!faceVerification.valid) {
    return next(new AppError(faceVerification.message, 400));
  }

  const latest = await Attendance.findOne({ user: userId }).sort({ date: -1, createdAt: -1 });
  const attendance = (latest && (!latest.clockOut || isTodayInIST(latest.date) || isTodayInIST(latest.clockIn))) ? latest : null;

  if (!attendance) {
    return next(new AppError('No clock-in record found for today.', 404));
  }

  if (attendance.clockOut) {
    return next(new AppError('You have already clocked out for today.', 400));
  }

  if (attendance.lunchOut && !attendance.lunchIn) {
    return next(new AppError('Please Lunch In before checking out.', 400));
  }

  const now = new Date();
  let diffMs = now - new Date(attendance.clockIn);

  if (attendance.lunchOut && attendance.lunchIn) {
    const lunchBreakMs = new Date(attendance.lunchIn) - new Date(attendance.lunchOut);
    diffMs -= lunchBreakMs;
  }

  if (attendance.extraBreakMs) {
    diffMs -= attendance.extraBreakMs;
  }

  const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

  attendance.clockOut = now;
  attendance.totalHours = totalHours;

  if (totalHours < 4 && attendance.status !== 'LATE') {
    attendance.status = 'HALF_DAY';
  }

  if (!attendance.timeline) attendance.timeline = [];
  attendance.timeline.push({
    type: 'CLOCK_OUT',
    timestamp: now,
    workLocation: attendance.workLocation
  });

  await attendance.save();

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Get Today Attendance Status
export const getTodayAttendance = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const latest = await Attendance.findOne({ user: userId }).sort({ date: -1, createdAt: -1 });
  const attendance = (latest && (!latest.clockOut || isTodayInIST(latest.date) || isTodayInIST(latest.clockIn))) ? latest : null;

  if (attendance && attendance.clockIn && !attendance.clockOut && attendance.status === 'HALF_DAY') {
    const firstClockInIST = getISTTime(new Date(attendance.clockIn));
    const originalIsLate = firstClockInIST.hours >= 9 && (firstClockInIST.hours > 9 || firstClockInIST.minutes > 40);
    attendance.status = firstClockInIST.isSunday ? 'OVER_DUTY' : (originalIsLate ? 'LATE' : 'PRESENT');
    await attendance.save();
  }

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Get Attendance Logs (Monthly / Team / All)
export const getAttendanceLogs = asyncHandler(async (req, res, next) => {
  const role = req.user.role;
  const userId = req.user._id;
  const { month, year, status } = req.query;

  const currentYear = Number(year) || new Date().getFullYear();
  const currentMonth = Number(month) || new Date().getMonth() + 1;

  // Build IST-aware month start and end dates
  const monthStr = String(currentMonth).padStart(2, '0');
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const startDate = new Date(`${currentYear}-${monthStr}-01T00:00:00.000+05:30`);
  const endDate = new Date(`${currentYear}-${monthStr}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:30`);

  let query = {
    date: { $gte: startDate, $lte: endDate }
  };

  if (status) {
    if (status === 'WFH') {
      query.workLocation = 'WFH';
    } else {
      query.status = status;
    }
  }

  if (role === 'EMPLOYEE') {
    query.user = userId;
  } else if (role === 'TEAM_LEAD') {
    const teamMembers = await User.find({ reportingManager: userId }).select('_id');
    const teamIds = teamMembers.map((m) => m._id);
    teamIds.push(userId);
    query.user = { $in: teamIds };
  } else {
    // Exclude CEO role users from employee attendance logs list
    const ceoUsers = await User.find({ role: 'CEO' }).select('_id');
    const ceoIds = ceoUsers.map((u) => u._id);
    if (ceoIds.length > 0) {
      query.user = { $nin: ceoIds };
    }
  }

  let rawLogs = await Attendance.find(query)
    .populate({
      path: 'user',
      select: 'firstName lastName employeeId department profileImage role email',
      populate: { path: 'department', select: 'name code' }
    })
    .sort({ date: -1, clockIn: -1 });

  // Strictly filter out any logs without a valid user object or with CEO role
  const logs = rawLogs.filter((l) => l.user && l.user.role !== 'CEO');

  // Auto-heal active sessions stuck on HALF_DAY
  for (const log of logs) {
    if (log.clockIn && !log.clockOut && log.status === 'HALF_DAY') {
      const firstClockInIST = getISTTime(new Date(log.clockIn));
      const originalIsLate = firstClockInIST.hours >= 9 && (firstClockInIST.hours > 9 || firstClockInIST.minutes > 40);
      log.status = firstClockInIST.isSunday ? 'OVER_DUTY' : (originalIsLate ? 'LATE' : 'PRESENT');
      await Attendance.updateOne({ _id: log._id }, { status: log.status });
    }
  }

  // Calculate Summary Metrics (for the current user's visible logs only)
  const totalDays = logs.length;
  const presentCount = logs.filter((l) => ['PRESENT', 'LATE', 'HALF_DAY', 'OVER_DUTY', 'OD'].includes(l.status)).length;
  const wfhCount = logs.filter((l) => l.workLocation === 'WFH').length;
  const lateCount = logs.filter((l) => l.status === 'LATE').length;
  const overDutyCount = logs.filter((l) => ['OVER_DUTY', 'OD'].includes(l.status)).length;

  res.status(200).json({
    status: 'success',
    data: {
      logs,
      summary: {
        totalDays,
        presentCount,
        wfhCount,
        lateCount,
        overDutyCount
      }
    }
  });
});

// Update Attendance Record (Work Location, Status, etc.)
export const updateAttendance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { workLocation, status } = req.body;

  const updateData = {};
  if (workLocation) updateData.workLocation = workLocation;
  if (status) updateData.status = status;

  const attendance = await Attendance.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!attendance) {
    return next(new AppError('Attendance record not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Get Live Status of all currently clocked-in employees (for CEO/Admin/HR/TL)
export const getLiveStatus = asyncHandler(async (req, res, next) => {
  const { start: todayStart, end: todayEnd } = getTodayDateRange();

  // Build match query for users
  let userMatch = { isDeleted: false, status: 'ACTIVE', role: { $ne: 'CEO' } };
  
  // TEAM_LEAD: only show direct reports
  if (req.user.role === 'TEAM_LEAD') {
    const teamMembers = await User.find({ reportingManager: req.user._id, isDeleted: false }).select('_id');
    const teamIds = teamMembers.map((m) => m._id);
    userMatch._id = { $in: teamIds };
  }

  // Single optimized aggregation query instead of 2 separate queries
  const liveStatus = await User.aggregate([
    { $match: userMatch },
    {
      $lookup: {
        from: 'attendances',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', '$$userId'] },
                  {
                    $or: [
                      { $and: [{ $gte: ['$date', todayStart] }, { $lte: ['$date', todayEnd] }] },
                      { $eq: ['$clockOut', null] },
                      { $eq: ['$clockOut', '$$REMOVE'] }
                    ]
                  }
                ]
              }
            }
          },
          { $sort: { date: -1, createdAt: -1 } },
          { $limit: 1 }
        ],
        as: 'attendanceArray'
      }
    },
    { $unwind: { path: '$attendanceArray', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    },
    {
      $lookup: {
        from: 'designations',
        localField: 'designation',
        foreignField: '_id',
        as: 'designationInfo'
      }
    },
    {
      $addFields: {
        lastTimelineEvent: {
          $cond: {
            if: { $and: [{ $isArray: '$attendanceArray.timeline' }, { $gt: [{ $size: '$attendanceArray.timeline' }, 0] }] },
            then: { $arrayElemAt: ['$attendanceArray.timeline', -1] },
            else: null
          }
        },
        lastClockInEvent: {
          $cond: {
            if: { $and: [{ $isArray: '$attendanceArray.timeline' }, { $gt: [{ $size: '$attendanceArray.timeline' }, 0] }] },
            then: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$attendanceArray.timeline',
                    as: 't',
                    cond: { $eq: ['$$t.type', 'CLOCK_IN'] }
                  }
                },
                -1
              ]
            },
            else: null
          }
        }
      }
    },
    {
      $addFields: {
        statusLabel: {
          $cond: {
            if: { $not: ['$attendanceArray'] },
            then: 'NOT_CHECKED_IN',
            else: {
              $cond: {
                if: '$lastTimelineEvent',
                then: {
                  $switch: {
                    branches: [
                      { case: { $in: ['$lastTimelineEvent.type', ['CLOCK_OUT', 'FORCE_CHECKOUT']] }, then: 'CHECKED_OUT' },
                      { case: { $eq: ['$lastTimelineEvent.type', 'LUNCH_OUT'] }, then: 'ON_LUNCH' },
                      { case: { $in: ['$lastTimelineEvent.type', ['CLOCK_IN', 'LUNCH_IN']] }, then: 'CHECKED_IN' }
                    ],
                    default: 'CHECKED_IN'
                  }
                },
                else: {
                  $cond: {
                    if: '$attendanceArray.clockOut',
                    then: 'CHECKED_OUT',
                    else: {
                      $cond: {
                        if: { $and: ['$attendanceArray.lunchOut', { $not: ['$attendanceArray.lunchIn'] }] },
                        then: 'ON_LUNCH',
                        else: 'CHECKED_IN'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        sortOrder: {
          $switch: {
            branches: [
              { case: { $eq: ['$statusLabel', 'CHECKED_IN'] }, then: 0 },
              { case: { $eq: ['$statusLabel', 'ON_LUNCH'] }, then: 1 },
              { case: { $eq: ['$statusLabel', 'NOT_CHECKED_IN'] }, then: 2 },
              { case: { $eq: ['$statusLabel', 'CHECKED_OUT'] }, then: 3 }
            ],
            default: 4
          }
        }
      }
    },
    {
      $project: {
        employee: {
          _id: '$_id',
          firstName: '$firstName',
          lastName: '$lastName',
          employeeId: '$employeeId',
          profileImage: '$profileImage',
          role: '$role',
          department: { $arrayElemAt: ['$departmentInfo', 0] },
          designation: { $arrayElemAt: ['$designationInfo', 0] }
        },
        attendance: '$attendanceArray',
        statusLabel: 1,
        clockInTime: {
          $cond: {
            if: '$lastClockInEvent.timestamp',
            then: '$lastClockInEvent.timestamp',
            else: '$attendanceArray.clockIn'
          }
        },
        firstClockInTime: '$attendanceArray.clockIn',
        lastClockInTime: {
          $cond: {
            if: '$lastClockInEvent.timestamp',
            then: '$lastClockInEvent.timestamp',
            else: '$attendanceArray.clockIn'
          }
        },
        clockOutTime: '$attendanceArray.clockOut',
        lunchOutTime: '$attendanceArray.lunchOut',
        lunchInTime: '$attendanceArray.lunchIn',
        workLocation: '$attendanceArray.workLocation',
        totalHours: '$attendanceArray.totalHours',
        timeline: '$attendanceArray.timeline',
        notes: '$attendanceArray.notes',
        sortOrder: 1
      }
    },
    { $sort: { sortOrder: 1, 'employee.firstName': 1 } },
    { $project: { sortOrder: 0 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: { liveStatus }
  });
});

// Force Check-Out an employee (CEO/Admin/HR/TL only)
export const forceCheckOut = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { reason } = req.body;
  const { start, end } = getTodayDateRange();

  const targetEmployee = await User.findById(userId);
  if (!targetEmployee || targetEmployee.isDeleted) {
    return next(new AppError('Employee not found.', 404));
  }

  // TEAM_LEAD can only force checkout their direct reports
  if (req.user.role === 'TEAM_LEAD') {
    const isDirectReport = targetEmployee.reportingManager?.toString() === req.user._id.toString();
    if (!isDirectReport) {
      return next(new AppError('You can only force check-out your direct team members.', 403));
    }
  }

  const latest = await Attendance.findOne({ user: userId }).sort({ date: -1, createdAt: -1 });
  const attendance = (latest && (!latest.clockOut || (latest.date >= start && latest.date <= end))) ? latest : null;
  if (!attendance) {
    return next(new AppError('No check-in record found for this employee today.', 404));
  }
  if (attendance.clockOut) {
    return next(new AppError('This employee has already checked out.', 400));
  }

  const now = new Date();
  let diffMs = now - new Date(attendance.clockIn);
  if (attendance.lunchOut && attendance.lunchIn) {
    diffMs -= new Date(attendance.lunchIn) - new Date(attendance.lunchOut);
  }
  if (attendance.extraBreakMs) {
    diffMs -= attendance.extraBreakMs;
  }
  const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

  attendance.clockOut = now;
  attendance.totalHours = totalHours;
  const forceTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  const forceNote = `Force checked out at ${forceTimeStr} IST by ${req.user.firstName} ${req.user.lastName} (${req.user.role})${reason ? ': ' + reason : ''}`;
  attendance.notes = attendance.notes ? `${attendance.notes} | ${forceNote}` : forceNote;
  if (totalHours < 4 && attendance.status !== 'LATE') attendance.status = 'HALF_DAY';

  if (!attendance.timeline) attendance.timeline = [];
  attendance.timeline.push({
    type: 'FORCE_CHECKOUT',
    timestamp: now,
    workLocation: attendance.workLocation,
    note: forceNote
  });

  await attendance.save();

  // Notify the employee
  const { Notification } = await import('../models/Notification.js');
  await Notification.safeCreate({
    recipient: userId,
    title: '⚠️ You have been checked out',
    message: `${req.user.firstName} ${req.user.lastName} (${req.user.role}) has checked you out at ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST.${reason ? ' Reason: ' + reason : ''}`,
    type: 'SYSTEM',
    targetUrl: '/attendance'
  });

  // Audit Log
  const { AuditLog } = await import('../models/AuditLog.js');
  await AuditLog.create({
    user: req.user._id,
    userName: `${targetEmployee.firstName} ${targetEmployee.lastName} (by ${req.user.firstName})`,
    userRole: req.user.role,
    action: 'FORCE_CHECKOUT',
    module: 'ATTENDANCE',
    details: `Force checked out ${targetEmployee.firstName} ${targetEmployee.lastName} (${targetEmployee.employeeId}) at ${now.toISOString()}${reason ? ' — Reason: ' + reason : ''}`
  });

  res.status(200).json({
    status: 'success',
    message: `${targetEmployee.firstName} ${targetEmployee.lastName} has been checked out successfully.`,
    data: { attendance }
  });
});

// Clear all test attendance logs (restricted to CEO & ADMIN)
export const clearAllAttendanceLogs = asyncHandler(async (req, res, next) => {
  const delRes = await Attendance.deleteMany({});
  res.status(200).json({
    status: 'success',
    message: `Successfully cleared ${delRes.deletedCount || 0} test attendance records. System is now ready for live real-time employee punches.`
  });
});

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Designation } from '../models/Designation.js';
import { LeaveType } from '../models/LeaveType.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Holiday } from '../models/Holiday.js';
import { Settings } from '../models/Settings.js';
import { Notification } from '../models/Notification.js';
import { Attendance } from '../models/Attendance.js';
import { DailyReport } from '../models/DailyReport.js';

dotenv.config();

export const clearAllLeaveRequests = async () => {
  // Safe no-op: never delete anything
};

export const updateEarnedLeaveToPaidLeave = async () => {
  try {
    await LeaveType.updateMany(
      { $or: [{ name: /earned/i }, { code: /^el$/i }] },
      { name: 'Paid Leave', code: 'PL' }
    );

    const balances = await LeaveBalance.find();
    for (const bal of balances) {
      let modified = false;
      for (const alloc of bal.allocations) {
        if (alloc.leaveTypeName === 'Earned Leave' || alloc.leaveTypeCode === 'EL' || /earned/i.test(alloc.leaveTypeName || '')) {
          alloc.leaveTypeName = 'Paid Leave';
          alloc.leaveTypeCode = 'PL';
          modified = true;
        }
      }
      if (modified) await bal.save();
    }
  } catch (err) {
    console.error('[Leave Migration Error]', err);
  }
};

export const updateCeoName = async () => {
  // Safe no-op: never modify or overwrite CEO credentials or accounts
  return;
};

export const runAutoSeed = async () => {
  try {
    const userCount = await User.countDocuments();
    const deptCount = await Department.countDocuments();
    if (userCount > 0 || deptCount > 0) {
      return;
    }

    console.log('[Seed Engine] Empty database detected! Auto-seeding initial enterprise accounts...');
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        companyName: 'Enterprise HR Global',
        emergencyEscalationMinutes: 5,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        weekendDays: ['Saturday', 'Sunday']
      });
    }

    // 2. Create Departments
    const engineering = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      description: 'Software development, DevOps and R&D'
    });

    const hrDept = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      description: 'Talent management and employee welfare'
    });

    const salesDept = await Department.create({
      name: 'Sales & Business',
      code: 'SALES',
      description: 'Enterprise client acquisition'
    });

    // 3. Create Designations
    const techLead = await Designation.create({
      name: 'Senior Tech Lead',
      code: 'STL',
      department: engineering._id,
      grade: 'L4'
    });

    const dev = await Designation.create({
      name: 'Full Stack Engineer',
      code: 'FSE',
      department: engineering._id,
      grade: 'L2'
    });

    const hrManagerDesig = await Designation.create({
      name: 'HR Business Partner',
      code: 'HRBP',
      department: hrDept._id,
      grade: 'L3'
    });

    const salesManagerDesig = await Designation.create({
      name: 'Sales Director',
      code: 'SD',
      department: salesDept._id,
      grade: 'L4'
    });

    const accountExecDesig = await Designation.create({
      name: 'Enterprise Account Executive',
      code: 'EAE',
      department: salesDept._id,
      grade: 'L3'
    });


    // 5. Create Leave Types
    const casualLeave = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CL',
      maxDays: 12,
      colorBadge: '#2563EB',
      description: 'Regular planned personal time off'
    });

    const sickLeave = await LeaveType.create({
      name: 'Sick Leave',
      code: 'SL',
      maxDays: 10,
      colorBadge: '#EF4444',
      documentRequired: true,
      description: 'Medical and sick leave'
    });

    const paidLeave = await LeaveType.create({
      name: 'Paid Leave',
      code: 'PL',
      maxDays: 15,
      colorBadge: '#22C55E',
      carryForward: true,
      description: 'Annual accrued leave entitlement'
    });

    const emergencyLeave = await LeaveType.create({
      name: 'Emergency Leave',
      code: 'EML',
      maxDays: 5,
      colorBadge: '#F59E0B',
      description: 'Urgent unannounced family or emergency leave'
    });

    // 6. No default leave balances are created in this seed.

    // 7. Create Sample Holidays
    await Holiday.create([
      { name: 'New Year Day', date: new Date('2026-01-01'), type: 'NATIONAL', description: 'Global holiday' },
      { name: 'Labor Day', date: new Date('2026-05-01'), type: 'NATIONAL', description: 'International workers day' },
      { name: 'Company Foundation Day', date: new Date('2026-08-15'), type: 'COMPANY', description: 'Enterprise celebration' },
      { name: 'Christmas Day', date: new Date('2026-12-25'), type: 'NATIONAL', description: 'Christmas festival' }
    ]);

    // 8. No sample leave requests are created by default.

    console.log('[Seed Engine] ✅ Enterprise database successfully seeded with initial production-ready data!');
  } catch (error) {
    console.error('[Seed Engine Error]', error);
  }
};

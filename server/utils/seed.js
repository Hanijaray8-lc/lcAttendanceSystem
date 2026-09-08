import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Designation } from '../models/Designation.js';
import { LeaveType } from '../models/LeaveType.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Holiday } from '../models/Holiday.js';
import { Settings } from '../models/Settings.js';

dotenv.config();

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
  try {
    const hashedPassword = await bcrypt.hash('Alban@123', 12);
    const result = await User.updateMany(
      { $or: [{ role: 'CEO' }, { email: 'ceo@enterprise.com' }, { email: 'albansanthosh@enterprise.com' }, { employeeId: 'EMP001' }] },
      { 
        firstName: 'Alban', 
        lastName: 'Santhosh A',
        email: 'albansanthosh@enterprise.com',
        password: hashedPassword,
        plainPassword: 'Alban@123'
      }
    );
    console.log('[Seed Engine] Updated CEO credentials to Alban Santhosh A / Alban@123:', result.modifiedCount || 0);
  } catch (err) {
    console.error('[CEO Name Migration Error]', err);
  }
};

export const runAutoSeed = async () => {
  try {
    await updateEarnedLeaveToPaidLeave();
    await updateCeoName();

    const deptCount = await Department.countDocuments();
    if (deptCount > 0) {
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

    // 4. Create Production Demo Accounts safely (never overwrite existing passwords)
    const existingCeo = await User.findOne({ $or: [{ email: 'ceo@enterprise.com' }, { email: 'albansanthosh@enterprise.com' }, { employeeId: 'EMP001' }] });
    if (!existingCeo) {
      await User.create({
        employeeId: 'EMP001',
        firstName: 'Alban',
        lastName: 'Santhosh A',
        email: 'albansanthosh@enterprise.com',
        password: 'Alban@123',
        role: 'CEO',
        department: engineering._id,
        designation: techLead._id,
        status: 'ACTIVE'
      });
    }

    const existingHr = await User.findOne({ $or: [{ email: 'hr@enterprise.com' }, { employeeId: 'EMP002' }] });
    if (!existingHr) {
      await User.create({
        employeeId: 'EMP002',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        email: 'hr@enterprise.com',
        password: 'Password@123',
        role: 'HR',
        department: hrDept._id,
        designation: hrManagerDesig._id,
        status: 'ACTIVE'
      });
    }

    const existingManager = await User.findOne({ $or: [{ email: 'teamlead@enterprise.com' }, { employeeId: 'EMP003' }] });
    let managerUser = existingManager;
    if (!existingManager) {
      managerUser = await User.create({
        employeeId: 'EMP003',
        firstName: 'David',
        lastName: 'Miller',
        email: 'teamlead@enterprise.com',
        password: 'Password@123',
        role: 'TEAM_LEAD',
        department: engineering._id,
        designation: techLead._id,
        status: 'ACTIVE'
      });
    }

    const existingEmp = await User.findOne({ $or: [{ email: 'employee@enterprise.com' }, { employeeId: 'EMP004' }] });
    if (!existingEmp) {
      await User.create({
        employeeId: 'EMP004',
        firstName: 'John',
        lastName: 'Doe',
        email: 'employee@enterprise.com',
        password: 'Password@123',
        role: 'EMPLOYEE',
        department: engineering._id,
        designation: dev._id,
        reportingManager: managerUser?._id,
        status: 'ACTIVE'
      });
    }

    // Create Sales & Business Demo Employees
    const existingSalesManager = await User.findOne({ $or: [{ email: 'sales.lead@enterprise.com' }, { employeeId: 'EMP005' }] });
    let salesManager = existingSalesManager;
    if (!existingSalesManager) {
      salesManager = await User.create({
        employeeId: 'EMP005',
        firstName: 'Robert',
        lastName: 'Vance',
        email: 'sales.lead@enterprise.com',
        password: 'Password@123',
        role: 'TEAM_LEAD',
        department: salesDept._id,
        designation: salesManagerDesig._id,
        status: 'ACTIVE'
      });
    }

    const existingEmp6 = await User.findOne({ $or: [{ email: 'emily.watson@enterprise.com' }, { employeeId: 'EMP006' }] });
    if (!existingEmp6) {
      await User.create({
        employeeId: 'EMP006',
        firstName: 'Emily',
        lastName: 'Watson',
        email: 'emily.watson@enterprise.com',
        password: 'Password@123',
        role: 'EMPLOYEE',
        department: salesDept._id,
        designation: accountExecDesig._id,
        reportingManager: salesManager?._id,
        status: 'ACTIVE'
      });
    }

    const existingEmp7 = await User.findOne({ $or: [{ email: 'michael.chang@enterprise.com' }, { employeeId: 'EMP007' }] });
    if (!existingEmp7) {
      await User.create({
        employeeId: 'EMP007',
        firstName: 'Michael',
        lastName: 'Chang',
        email: 'michael.chang@enterprise.com',
        password: 'Password@123',
        role: 'EMPLOYEE',
        department: salesDept._id,
        designation: accountExecDesig._id,
        reportingManager: salesManager?._id,
        status: 'ACTIVE'
      });
    }

    console.log('[Seed Engine] Created default accounts: ceo@enterprise.com (CEO@123), hr@enterprise.com (Password@123)');

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

// Add this at the very bottom of server/utils/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elms_enterprise')
    .then(async () => {
      console.log('Force Seeding...');
      // Temporarily bypass userCount check to force create accounts
      await runAutoSeed();
      console.log('Seed Complete!');
      process.exit(0);
    })
    .catch(err => console.error(err));
}

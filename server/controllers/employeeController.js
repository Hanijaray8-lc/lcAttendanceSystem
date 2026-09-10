import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { LeaveType } from '../models/LeaveType.js';
import { Department } from '../models/Department.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Attendance } from '../models/Attendance.js';
import { DailyReport } from '../models/DailyReport.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuditLog } from '../models/AuditLog.js';
import { encryptFaceDescriptor, decryptFaceDescriptor } from '../utils/encryption.js';

export const getEmployees = asyncHandler(async (req, res, next) => {
  const { search, department, role, status, page = 1, limit = 10 } = req.query;
  const query = { isDeleted: false };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }

  if (department) {
    let deptObjId = null;
    if (mongoose.Types.ObjectId.isValid(department)) {
      deptObjId = department;
    } else {
      const deptDoc = await Department.findOne({
        $or: [{ name: department }, { code: department }],
        isDeleted: false
      });
      if (deptDoc) deptObjId = deptDoc._id;
    }

    if (deptObjId) {
      query.department = deptObjId;
    }
  }
  if (role) query.role = role;
  if (status) query.status = status;

  // Filter for Manager role: always show only direct team members
  if (req.user.role === 'TEAM_LEAD') {
    query.reportingManager = req.user._id;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const employees = await User.find(query)
    .populate('department', 'name code')
    .populate('designation', 'name code')
    .populate('reportingManager', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Hide CEO plainPassword from non-CEO users
  const reqUserIsCEO = req.user?.role === 'CEO' || req.user?.email === 'ceo@enterprise.com' || req.user?.employeeId === 'EMP001';
  const sanitizedEmployees = employees.map((emp) => {
    const obj = emp.toObject();
    const isCeoAccount = obj.role === 'CEO' || obj.email === 'ceo@enterprise.com' || obj.employeeId === 'EMP001';
    if (isCeoAccount && !reqUserIsCEO) {
      delete obj.plainPassword;
    }
    return obj;
  });

  // Always pin CEO account to position #1 (first item)
  sanitizedEmployees.sort((a, b) => {
    const isACeo = a.role === 'CEO' || a.employeeId === 'EMP001';
    const isBCeo = b.role === 'CEO' || b.employeeId === 'EMP001';
    if (isACeo && !isBCeo) return -1;
    if (!isACeo && isBCeo) return 1;
    return 0;
  });

  res.status(200).json({
    status: 'success',
    data: {
      employees: sanitizedEmployees,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});

export const getEmployeeById = asyncHandler(async (req, res, next) => {
  const employee = await User.findById(req.params.id)
    .populate('department', 'name code description')
    .populate('designation', 'name code grade')
    .populate('reportingManager', 'firstName lastName email profileImage');

  if (!employee || employee.isDeleted) {
    return next(new AppError('Employee not found.', 404));
  }

  const employeeData = employee.toObject();
  const reqUserIsCEO = req.user?.role === 'CEO' || req.user?.email === 'ceo@enterprise.com' || req.user?.employeeId === 'EMP001';
  const isCeoAccount = employeeData.role === 'CEO' || employeeData.email === 'ceo@enterprise.com' || employeeData.employeeId === 'EMP001';
  if (isCeoAccount && !reqUserIsCEO) {
    delete employeeData.plainPassword;
  }

  res.status(200).json({
    status: 'success',
    data: { employee: employeeData }
  });
});

export const createEmployee = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Check if email already exists
  if (email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return next(new AppError('An employee account with this Email address already exists.', 400));
    }
  }

  // Check or Auto-generate unique employeeId
  if (req.body.employeeId && req.body.employeeId.trim()) {
    const existingId = await User.findOne({ employeeId: req.body.employeeId.trim() });
    if (existingId) {
      return next(new AppError('Employee ID already exists. Please use a different ID.', 400));
    }
  } else {
    // Auto-generate highest non-conflicting EMP-XXXX ID
    const usersWithEmpId = await User.find({ employeeId: { $regex: /^EMP-\d+$/i } }).select('employeeId');
    let maxNum = 0;
    usersWithEmpId.forEach((u) => {
      if (u.employeeId) {
        const num = parseInt(u.employeeId.replace(/EMP-/i, ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    let nextNum = maxNum + 1;
    let candidateId = `EMP-${String(nextNum).padStart(4, '0')}`;

    while (await User.exists({ employeeId: candidateId })) {
      nextNum += 1;
      candidateId = `EMP-${String(nextNum).padStart(4, '0')}`;
    }

    req.body.employeeId = candidateId;
  }

  // Clean empty strings for ObjectIds
  if (!req.body.department) delete req.body.department;
  if (!req.body.designation) delete req.body.designation;
  if (!req.body.reportingManager) delete req.body.reportingManager;

  // Default password if not provided — strong default
  if (!req.body.password) {
    req.body.password = 'Welcome@123';
  }
  req.body.plainPassword = req.body.password;

  // Encrypt face descriptor if provided during employee creation
  if (req.body.faceDescriptor && Array.isArray(req.body.faceDescriptor)) {
    const encryptedDescriptor = encryptFaceDescriptor(req.body.faceDescriptor);
    if (!encryptedDescriptor) {
      return next(new AppError('Failed to encrypt face descriptor. Please try again.', 500));
    }
    req.body.faceDescriptor = encryptedDescriptor;
  }

  const newEmployee = await User.create(req.body);

  // Initialize Leave Balances for all active Leave Types
  const activeLeaveTypes = await LeaveType.find({ status: 'ACTIVE', isDeleted: false });
  const allocations = activeLeaveTypes.map((lt) => ({
    leaveType: lt._id,
    leaveTypeName: lt.name,
    leaveTypeCode: lt.code,
    colorBadge: lt.colorBadge,
    total: lt.maxDays,
    used: 0,
    pending: 0,
    remaining: lt.maxDays
  }));

  await LeaveBalance.create({
    user: newEmployee._id,
    year: new Date().getFullYear(),
    allocations
  });

  // Increment Department employeeCount
  if (newEmployee.department) {
    await Department.findByIdAndUpdate(newEmployee.department, { $inc: { employeeCount: 1 } });
  }

  // Audit log
  await AuditLog.create({
    user: req.user._id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    userRole: req.user.role,
    action: 'EMPLOYEE_CREATE',
    module: 'EMPLOYEE',
    details: `Created new employee: ${newEmployee.firstName} ${newEmployee.lastName} (${newEmployee.employeeId})`
  });

  res.status(201).json({
    status: 'success',
    data: { employee: newEmployee }
  });
});

export const updateEmployee = asyncHandler(async (req, res, next) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.isDeleted) {
    return next(new AppError('Employee not found.', 404));
  }

  // Permission checks:
  // CEO can edit anyone.
  // Admin and HR can ONLY edit Employee and Team Lead accounts, and CANNOT edit CEO.
  const isCallerCEO = req.user.role === 'CEO';
  const isCallerAdminOrHR = ['ADMIN', 'HR'].includes(req.user.role);
  const isTargetCEO = employee.role === 'CEO' || employee.email === 'ceo@enterprise.com' || employee.employeeId === 'EMP001';
  const isTargetEmployeeOrTL = ['EMPLOYEE', 'TEAM_LEAD'].includes(employee.role);

  if (!isCallerCEO) {
    if (isCallerAdminOrHR) {
      if (isTargetCEO) {
        return next(new AppError('You do not have permission to edit CEO details.', 403));
      }
      if (!isTargetEmployeeOrTL) {
        return next(new AppError('Admin and HR can only edit Employee and Team Lead accounts.', 403));
      }
      // If role is being changed by Admin/HR, it can only be EMPLOYEE or TEAM_LEAD
      if (req.body.role && !['EMPLOYEE', 'TEAM_LEAD'].includes(req.body.role)) {
        return next(new AppError('You can only assign Employee or Team Lead roles.', 403));
      }
    } else {
      return next(new AppError('You do not have permission to edit employees.', 403));
    }
  }

  const updateData = { ...req.body };

  // Handle password separately
  if (updateData.password && typeof updateData.password === 'string' && updateData.password.trim().length > 0) {
    const trimmedPass = updateData.password.trim();
    if (trimmedPass.length < 6) {
      return next(new AppError('Password must be at least 6 characters long.', 400));
    }
    updateData.plainPassword = trimmedPass;
    updateData.password = await bcrypt.hash(trimmedPass, 12);
  } else {
    delete updateData.password;
    delete updateData.plainPassword;
  }

  // IMPORTANT: Allow explicitly setting fields to null/undefined to clear them
  // Empty string "" means "clear this field" - convert to null
  if (updateData.department === '') updateData.department = null;
  if (updateData.designation === '') updateData.designation = null;
  if (updateData.reportingManager === '') updateData.reportingManager = null;

  // Remove completely missing fields (undefined) but keep null (explicit clear)
  if (updateData.department === undefined) delete updateData.department;
  if (updateData.designation === undefined) delete updateData.designation;
  if (updateData.reportingManager === undefined) delete updateData.reportingManager;

  // Handle email uniqueness check if changing email
  if (updateData.email && typeof updateData.email === 'string' && updateData.email.trim()) {
    const cleanEmail = updateData.email.toLowerCase().trim();
    updateData.email = cleanEmail;

    // Check if another account has this email
    const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: req.params.id } });
    if (existingUser) {
      // Only silently clear email if it's a soft-deleted account
      if (existingUser.isDeleted) {
        await User.findByIdAndUpdate(existingUser._id, { email: `deleted_${Date.now()}_${cleanEmail}` });
      } else {
        return next(new AppError(`The email '${cleanEmail}' is already assigned to ${existingUser.firstName} ${existingUser.lastName}.`, 400));
      }
    }
  }

  if (updateData.username && typeof updateData.username === 'string') {
    updateData.username = updateData.username.trim();
  }

  // Remove empty required string fields to avoid overwriting with empty string
  ['firstName', 'lastName', 'email', 'employeeId'].forEach((field) => {
    if (field in updateData && !updateData[field]?.toString().trim()) {
      delete updateData[field];
    }
  });

  // Protect CEO role — cannot be changed to any other role
  const isCEOAccount = employee.role === 'CEO' || employee.email === 'ceo@enterprise.com' || employee.employeeId === 'EMP001';
  if (isCEOAccount) {
    // Prevent role change for CEO account
    delete updateData.role;
  }

  const updatedEmployee = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true, context: 'query' }
  )
    .populate('department', 'name code')
    .populate('designation', 'name code')
    .populate('reportingManager', 'firstName lastName email');

  // Audit log for employee profile update
  try {
    await AuditLog.create({
      user: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      action: 'EMPLOYEE_UPDATE',
      module: 'EMPLOYEE',
      details: `Updated details for employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName} (${updatedEmployee.employeeId})`
    });
  } catch (err) {
    // Ignore audit log error
  }

  res.status(200).json({
    status: 'success',
    data: { employee: updatedEmployee }
  });
});

export const toggleEmployeeStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const employee = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!employee) return next(new AppError('Employee not found.', 404));

  res.status(200).json({
    status: 'success',
    data: { employee }
  });
});

export const deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await User.findById(req.params.id);
  if (!employee) return next(new AppError('Employee not found.', 404));

  // Safety protection: CEO account can never be deleted!
  const isCEOAccount =
    employee.role === 'CEO' ||
    employee.email === 'albansanthosh@enterprise.com' ||
    employee.email === 'ceo@enterprise.com' ||
    employee.employeeId === 'EMP001';

  if (isCEOAccount) {
    return next(new AppError('The CEO account cannot be deleted.', 400));
  }

  // 1. Permanently delete user document from MongoDB
  await User.findByIdAndDelete(req.params.id);

  // 2. Cascade delete all associated user records in MongoDB
  await Promise.all([
    LeaveBalance.deleteMany({ user: req.params.id }),
    LeaveRequest.deleteMany({ user: req.params.id }),
    Attendance.deleteMany({ user: req.params.id }),
    DailyReport.deleteMany({ user: req.params.id })
  ]);

  // 3. Clear reportingManager link for employees reporting to this user
  await User.updateMany({ reportingManager: req.params.id }, { $unset: { reportingManager: 1 } });

  // 4. If employee was part of a department, decrement employee count
  if (employee.department) {
    await Department.findByIdAndUpdate(employee.department, { $inc: { employeeCount: -1 } });
  }

  // 5. Create audit log
  try {
    await AuditLog.create({
      user: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      action: 'EMPLOYEE_DELETE',
      module: 'EMPLOYEE',
      details: `Permanently deleted employee from MongoDB: ${employee.firstName} ${employee.lastName} (${employee.employeeId}, ${employee.email})`
    });
  } catch (err) {
    // Ignore audit log error
  }

  res.status(200).json({
    status: 'success',
    message: 'Employee permanently deleted from database.'
  });
});

// Register or Update Face Lock Descriptor (CEO & HR Access Only)
export const registerFaceLock = asyncHandler(async (req, res, next) => {
  const { faceDescriptor } = req.body;
  const { id } = req.params;

  if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
    return next(new AppError('Valid Face Descriptor array is required.', 400));
  }

  const employee = await User.findById(id);
  if (!employee || employee.isDeleted) {
    return next(new AppError('Employee not found.', 404));
  }

  // Encrypt face descriptor before saving
  const encryptedDescriptor = encryptFaceDescriptor(faceDescriptor);
  if (!encryptedDescriptor) {
    return next(new AppError('Failed to encrypt face descriptor. Please try again.', 500));
  }

  employee.faceDescriptor = encryptedDescriptor;
  employee.isFaceRegistered = true;
  await employee.save({ validateBeforeSave: false });

  console.log(`✅ [Face Registration] Encrypted and saved face descriptor for ${employee.email}`);

  await AuditLog.create({
    user: req.user._id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    userRole: req.user.role,
    action: 'FACE_LOCK_REGISTER',
    module: 'EMPLOYEE',
    details: `Registered Face Lock pattern for employee ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
  });

  res.status(200).json({
    status: 'success',
    message: 'Face Lock registered successfully!',
    data: {
      isFaceRegistered: true
    }
  });
});

// Reset / Remove Face Lock (CEO & HR Access Only)
export const removeFaceLock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employee = await User.findById(id);
  if (!employee || employee.isDeleted) {
    return next(new AppError('Employee not found.', 404));
  }

  employee.faceDescriptor = '';
  employee.isFaceRegistered = false;
  await employee.save({ validateBeforeSave: false });

  console.log(`✅ [Face Removal] Cleared encrypted face descriptor for ${employee.email}`);

  await AuditLog.create({
    user: req.user._id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    userRole: req.user.role,
    action: 'FACE_LOCK_REMOVE',
    module: 'EMPLOYEE',
    details: `Removed Face Lock pattern for employee ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
  });

  res.status(200).json({
    status: 'success',
    message: 'Face Lock pattern removed successfully.',
    data: {
      isFaceRegistered: false
    }
  });
});


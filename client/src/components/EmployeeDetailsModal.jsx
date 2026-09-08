import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { UserAvatar } from './UserAvatar';
import { StatusBadge } from './Badge';
import { FaceCameraModal } from './FaceCameraModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Phone, Building2, Award, Calendar, ShieldCheck, UserCheck, CheckCircle, XCircle, Edit3, Save, X, Trash2, Camera, Lock, Unlock, Scan, User } from 'lucide-react';

export const EmployeeDetailsModal = ({
  isOpen,
  onClose,
  employee,
  departments = [],
  designations = [],
  onToggleStatus,
  onUpdateSuccess
}) => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceSubmitting, setFaceSubmitting] = useState(false);
  const [managers, setManagers] = useState([]);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    employeeId: '',
    department: '',
    designation: '',
    role: 'EMPLOYEE',
    employmentType: 'Full Time',
    reportingManager: '',
    password: ''
  });

  const isLoggedInCEO = user?.role === 'CEO' || user?.email === 'albansanthosh@enterprise.com' || user?.email === 'ceo@enterprise.com' || user?.employeeId === 'EMP001';
  const isTargetCEO = employee?.role === 'CEO' || employee?.email === 'albansanthosh@enterprise.com' || employee?.email === 'ceo@enterprise.com' || employee?.employeeId === 'EMP001';
  const isCEO = isLoggedInCEO;
  const canManageFaceLock = isCEO;
  const canManageEmployee = isCEO;

  // Debug: Log props when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('[EmployeeModal] Props received:', {
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'None',
        departmentsCount: departments?.length || 0,
        designationsCount: designations?.length || 0
      });
      if (!departments || departments.length === 0) {
        console.warn('[EmployeeModal] ⚠️ Departments prop is empty! Parent should fetch departments first.');
      }
      if (!designations || designations.length === 0) {
        console.warn('[EmployeeModal] ⚠️ Designations prop is empty! Parent should fetch designations first.');
      }
    }
  }, [isOpen, departments, designations, employee]);

  const handlePhoneChange = (value) => {
    // Only numbers, max 10 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setEditForm({ ...editForm, phone: cleaned });
  };

  useEffect(() => {
    if (employee) {
      setEditForm({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        phone: employee.phone || '',
        employeeId: employee.employeeId || '',
        department: employee.department?._id || employee.department || '',
        designation: employee.designation?._id || employee.designation || '',
        role: employee.role || 'EMPLOYEE',
        employmentType: employee.employmentType || 'Full Time',
        reportingManager: employee.reportingManager?._id || employee.reportingManager || '',
        password: ''
      });
      setIsEditing(false);
    }
  }, [employee, isOpen]);

  // Load all potential managers (TEAM_LEAD role) when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch managers
      api.get('/employees?limit=200&status=ACTIVE')
        .then((res) => {
          const all = res.data?.data?.employees || [];
          // Show anyone who can be a reporting manager: TEAM_LEAD, HR, ADMIN, CEO
          const mgrs = all.filter((e) => ['TEAM_LEAD', 'HR', 'ADMIN', 'CEO'].includes(e.role));
          setManagers(mgrs);
          console.log('[EmployeeModal] Managers loaded:', mgrs.length);
        })
        .catch((err) => {
          console.error('[EmployeeModal] Failed to load managers:', err);
          setManagers([]);
        });
    }
  }, [isOpen]);

  if (!employee) return null;

  const handleStatusClick = async () => {
    const nextStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmText = nextStatus === 'INACTIVE' ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${confirmText} ${employee.firstName}'s account?`)) {
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/employees/${employee._id}/status`, { status: nextStatus });
      alert(`✅ Employee account ${nextStatus.toLowerCase()}d successfully!`);
      if (onUpdateSuccess) onUpdateSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update employee status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm(`⚠️ Warning: Are you sure you want to remove ${employee.firstName} ${employee.lastName}?`)) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/employees/${employee._id}`);
      alert(`✅ Employee account removed successfully!`);
      if (onUpdateSuccess) onUpdateSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove employee account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFaceLock = async (faceDescriptor) => {
    setFaceSubmitting(true);
    try {
      await api.post(`/employees/${employee._id}/face-lock`, { faceDescriptor });
      alert(`✅ Face Lock successfully set up for ${employee.firstName} ${employee.lastName}!`);
      setIsFaceModalOpen(false);
      if (onUpdateSuccess) onUpdateSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save face lock.');
    } finally {
      setFaceSubmitting(false);
    }
  };

  const handleRemoveFaceLock = async () => {
    if (!window.confirm(`Are you sure you want to remove Face Lock for ${employee.firstName}?`)) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/employees/${employee._id}/face-lock`);
      alert(`✅ Face Lock pattern removed for ${employee.firstName}.`);
      if (onUpdateSuccess) onUpdateSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove face lock.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    const isPasswordChanged = Boolean(editForm.password && editForm.password.trim());

    // If a new password is typed, ensure it meets minimum length
    if (isPasswordChanged) {
      if (editForm.password.trim().length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = { ...editForm };
      
      // Don't delete empty fields - send them as empty string to clear values
      // Only delete if they're undefined
      if (payload.department === undefined) delete payload.department;
      if (payload.designation === undefined) delete payload.designation;
      if (payload.reportingManager === undefined) delete payload.reportingManager;
      
      // If password field is empty, remove it completely so existing password is untouched
      if (!payload.password || !payload.password.trim()) {
        delete payload.password;
      } else {
        payload.password = payload.password.trim();
      }
      
      const response = await api.put(`/employees/${employee._id}`, payload);
      
      console.log('[EmployeeModal] Update response:', response.data);

      const currentUserId = user?._id || user?.id;
      const targetEmployeeId = employee._id || employee.id;
      const isSelf = currentUserId && targetEmployeeId && String(currentUserId) === String(targetEmployeeId);

      setIsEditing(false);
      onClose();

      if (isPasswordChanged) {
        if (isSelf) {
          alert('✅ Password updated successfully! Application will now log out. Please log in using your new password.');
          logout();
          return;
        } else {
          alert(`✅ Password updated successfully for ${employee.firstName}! They will now need to log in using the new password.`);
        }
      } else {
        alert('✅ Employee details updated successfully!');
      }
      
      // Trigger parent to refresh employee list
      if (onUpdateSuccess) onUpdateSuccess(response.data?.data?.employee);
    } catch (err) {
      console.error('[EmployeeModal] Update failed:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to update employee details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Employee Profile' : 'Employee Account Profile'} maxWidth="max-w-2xl">
      <div className="space-y-5 pr-2 sm:pr-4 pb-6">
        {/* Header Overview Banner */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-sky-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar user={employee} size="w-12 h-12 text-xs" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                  {employee.firstName} {employee.lastName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20 truncate">
                  {employee.role === 'TEAM_LEAD' ? 'Team Lead' : employee.role === 'ADMIN' ? 'Admin' : employee.role?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5 truncate max-w-[18rem]">
                <User className="w-3.5 h-3.5 text-purple-500" />
                <span className="truncate font-bold text-slate-700 dark:text-slate-300">
                  {employee.role === 'CEO' ? (employee.username || 'Alban Santhosh') : (employee.username || employee.email)}
                </span>
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3">
            <StatusBadge status={employee.status} />
          </div>
        </div>

        {/* Biometric Face Lock Status & Setup Banner (CEO / HR Access) */}
        {canManageFaceLock && !isEditing && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-transparent border border-purple-500/30 flex items-center justify-between gap-3 flex-wrap shadow-xs">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white ${employee.role === 'CEO' ? 'bg-blue-600 shadow-md shadow-blue-500/20' : employee.isFaceRegistered ? 'bg-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-purple-600 shadow-md shadow-purple-500/20'}`}>
                {employee.role === 'CEO' ? <ShieldCheck className="w-5 h-5 stroke-[2.2]" /> : employee.isFaceRegistered ? <Lock className="w-5 h-5 stroke-[2.2]" /> : <Scan className="w-5 h-5 stroke-[2.2]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    Biometric Face Lock
                  </h4>
                  {employee.role === 'CEO' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-extrabold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> CEO Exempt (Not Required)
                    </span>
                  ) : employee.isFaceRegistered ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Enrolled
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold">
                      Not Configured
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {employee.role === 'CEO'
                    ? 'Executive Account — Exempt from biometric face verification requirements.'
                    : employee.isFaceRegistered
                    ? 'Employee must scan face for attendance login/logout.'
                    : 'Only CEO and HR have permission to capture and set Face Lock.'}
                </p>
              </div>
            </div>

            {employee.role !== 'CEO' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaceModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-purple-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4" />
                  <span>{employee.isFaceRegistered ? 'Re-enroll Face' : 'Set Face Lock'}</span>
                </button>

                {employee.isFaceRegistered && (
                  <button
                    type="button"
                    onClick={handleRemoveFaceLock}
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-extrabold rounded-xl transition-all"
                    title="Remove Face Lock"
                  >
                    <Unlock className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode 1: View Details */}
        {!isEditing ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Username</p>
                <p className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1.5 truncate">
                  <User className="w-4 h-4 text-purple-500" />
                  <span className="truncate">{employee.role === 'CEO' ? (employee.username || 'Alban Santhosh') : (employee.username || 'N/A')}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 truncate">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{employee.email || 'N/A'}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Employee ID</p>
                <p className="text-sm font-extrabold text-primary font-mono mt-1 truncate">{employee.employeeId || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Department</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 truncate">
                  <Building2 className="w-4 h-4 text-blue-500" /> <span className="truncate">{employee.department?.name || 'Unassigned'}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Designation</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 truncate">
                  <Award className="w-4 h-4 text-emerald-500" /> <span className="truncate">{employee.designation?.name || 'Unassigned'}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Contact Phone</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 font-mono truncate">
                  <Phone className="w-4 h-4 text-amber-500" /> <span className="truncate">{employee.phone || 'Not provided'}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Employment Type</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {employee.employmentType || 'Full Time'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Date of Joining</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 font-mono truncate">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="truncate">{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Reporting Manager (TL)</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 truncate">
                  <UserCheck className="w-4 h-4 text-indigo-500" />
                  <span className="truncate">
                    {employee.reportingManager
                      ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}`
                      : <span className="text-amber-500 font-semibold">Not Assigned</span>}
                  </span>
                </p>
              </div>

              {/* Password visibility: Hide CEO password from ADMIN, HR, and other roles */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Account Password</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 font-mono truncate">
                  <Lock className="w-4 h-4 text-rose-500" /> 
                  <span className="truncate">
                    {isTargetCEO && !isLoggedInCEO
                      ? '•••••••• (Protected)'
                      : employee?.plainPassword || '••••••••'}
                  </span>
                </p>
              </div>
            </div>

            {/* Bottom Actions Row: Edit Button + Status Toggle + Delete (CEO / Admin / HR Access) */}
            {canManageEmployee && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Edit Employee Details
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleStatusClick}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                      employee.status === 'ACTIVE'
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {employee.status === 'ACTIVE' ? (
                      <>
                        <XCircle className="w-4 h-4" /> Deactivate Account
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Activate Account
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleDeleteClick}
                    className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Mode 2: Edit Form */
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Employee ID *</label>
              <input
                type="text"
                value={editForm.employeeId}
                onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary uppercase"
                placeholder="e.g. EMP-1234"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">First Name *</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={10}
                placeholder="Enter 10-digit phone number"
                className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Department</label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                >
                  <option value="">Select Dept</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Designation</label>
                <select
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                >
                  <option value="">Select Designation</option>
                  {designations.map((des) => (
                    <option key={des._id} value={des._id}>{des.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Employment Type</label>
                <select
                  value={editForm.employmentType}
                  onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Reporting Manager (TL)</label>
                <select
                  value={editForm.reportingManager}
                  onChange={(e) => setEditForm({ ...editForm, reportingManager: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                >
                  <option value="">-- No Reporting Manager --</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName} ({m.employeeId})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Assign a TL/Manager — leave requests will route to them first.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Set New Password</label>
                <input
                  type="text"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave empty to keep current"
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5 transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-blue-700 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Face Lock Enrolment Camera Modal */}
      <FaceCameraModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        mode="register"
        employeeName={`${employee.firstName} ${employee.lastName}`}
        employeeId={employee.email}
        onCaptureSuccess={handleSaveFaceLock}
        isSubmitting={faceSubmitting}
      />
    </Modal>
  );
};

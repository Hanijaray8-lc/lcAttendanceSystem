import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/Badge';
import { UserAvatar } from '../components/UserAvatar';
import { Modal } from '../components/Modal';
import { EmployeeDetailsModal } from '../components/EmployeeDetailsModal';
import { FaceCameraModal } from '../components/FaceCameraModal';
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  Award,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  MoreVertical,
  CalendarCheck,
  Clock,
  Eye,
  UserPlus,
  User,
  ShieldCheck,
  Lock,
  EyeOff,
  Info,
  X,
  Camera,
  CheckCircle,
  Scan,
  Hash
} from 'lucide-react';

const CARD_THEMES = [
  {
    avatarBg: "!bg-gradient-to-tr !from-pink-600 !via-rose-500 !to-red-400",
    empIdColor: "text-rose-500 dark:text-rose-400",
    boxBg: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100/70 dark:border-rose-900/30",
    iconColor: "text-rose-500 dark:text-rose-400",
    roleColor: "text-rose-500 dark:text-rose-400",
    nameHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    borderHover: "hover:border-rose-300 dark:hover:border-rose-800",
    btnBg: "bg-gradient-to-r from-pink-600 via-rose-600 to-rose-500 hover:from-pink-700 hover:to-rose-700 shadow-md shadow-rose-500/25"
  },
  {
    avatarBg: "!bg-gradient-to-tr !from-amber-600 !via-orange-500 !to-yellow-400",
    empIdColor: "text-amber-600 dark:text-amber-400",
    boxBg: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100/70 dark:border-amber-900/30",
    iconColor: "text-amber-500 dark:text-amber-400",
    roleColor: "text-amber-600 dark:text-amber-400",
    nameHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    borderHover: "hover:border-amber-300 dark:hover:border-amber-800",
    btnBg: "bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-700 shadow-md shadow-amber-500/25"
  },
  {
    avatarBg: "!bg-gradient-to-tr !from-cyan-600 !via-teal-500 !to-sky-400",
    empIdColor: "text-cyan-600 dark:text-cyan-400",
    boxBg: "bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-100/70 dark:border-cyan-900/30",
    iconColor: "text-cyan-500 dark:text-cyan-400",
    roleColor: "text-cyan-600 dark:text-cyan-400",
    nameHover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
    borderHover: "hover:border-cyan-300 dark:hover:border-cyan-800",
    btnBg: "bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md shadow-cyan-500/25"
  },
  {
    avatarBg: "!bg-gradient-to-tr !from-blue-600 !via-indigo-500 !to-cyan-400",
    empIdColor: "text-blue-600 dark:text-blue-400",
    boxBg: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/70 dark:border-blue-900/30",
    iconColor: "text-blue-500 dark:text-blue-400",
    roleColor: "text-blue-600 dark:text-blue-400",
    nameHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    borderHover: "hover:border-blue-300 dark:hover:border-blue-800",
    btnBg: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25"
  },
  {
    avatarBg: "!bg-gradient-to-tr !from-emerald-600 !via-teal-500 !to-green-400",
    empIdColor: "text-emerald-600 dark:text-emerald-400",
    boxBg: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/70 dark:border-emerald-900/30",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    roleColor: "text-emerald-600 dark:text-emerald-400",
    nameHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    borderHover: "hover:border-emerald-300 dark:hover:border-emerald-800",
    btnBg: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25"
  },
  {
    avatarBg: "!bg-gradient-to-tr !from-purple-600 !via-violet-500 !to-indigo-400",
    empIdColor: "text-purple-600 dark:text-purple-400",
    boxBg: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-100/70 dark:border-purple-900/30",
    iconColor: "text-purple-500 dark:text-purple-400",
    roleColor: "text-purple-600 dark:text-purple-400",
    nameHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    borderHover: "hover:border-purple-300 dark:hover:border-purple-800",
    btnBg: "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/25"
  }
];

export const Employees = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedDept, setSelectedDept] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isCreateFaceModalOpen, setIsCreateFaceModalOpen] = useState(false);
  const [capturedFaceDescriptor, setCapturedFaceDescriptor] = useState(null);

  useEffect(() => {
    const actionParam = searchParams.get('action');
    const deptParam = searchParams.get('department');
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
    if (deptParam) {
      setSelectedDept(deptParam);
      setFormData((prev) => ({ ...prev, department: deptParam }));
    }
    if (actionParam === 'add') {
      setFormData({
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        designation: '',
        role: 'EMPLOYEE',
        employmentType: 'Full Time'
      });
      setCapturedFaceDescriptor(null);
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    designation: '',
    role: 'EMPLOYEE',
    employmentType: 'Full Time'
  });

  const fetchEmployees = async (updatedEmp = null) => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedDept) params.department = selectedDept;

      const [empRes, deptRes, desigRes] = await Promise.all([
        api.get('/employees', { params }),
        api.get('/departments'),
        api.get('/designations')
      ]);

      const loadedEmps = empRes.data.data.employees || [];
      const loadedDepts = deptRes.data.data.departments || [];
      const loadedDesigs = desigRes.data.data.designations || [];

      setEmployees(loadedEmps);
      setDepartments(loadedDepts);
      setDesignations(loadedDesigs);

      if (updatedEmp) {
        setSelectedEmployee(updatedEmp);
      } else if (selectedEmployee) {
        const refreshed = loadedEmps.find((e) => e._id === selectedEmployee._id);
        if (refreshed) {
          setSelectedEmployee(refreshed);
        }
      }

      if (selectedDept) {
        const matchedDept = loadedDepts.find(
          (d) => d._id === selectedDept || d.name === selectedDept || d.code === selectedDept
        );
        if (matchedDept) {
          if (selectedDept !== matchedDept._id) {
            setSelectedDept(matchedDept._id);
          }
          setFormData((prev) => ({ ...prev, department: matchedDept._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept]);

  const handleOpenDetails = (emp) => {
    setSelectedEmployee(emp);
    setIsDetailsModalOpen(true);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!['CEO', 'ADMIN', 'HR'].includes(user?.role)) {
      alert('⚠️ Permission Denied: Only CEO, Admin, and HR can add new employees.');
      return;
    }
    try {
      const payload = { ...formData };
      if (!payload.department) delete payload.department;
      if (!payload.designation) delete payload.designation;
      if (!payload.password) payload.password = '123456';
      if (capturedFaceDescriptor) {
        payload.faceDescriptor = capturedFaceDescriptor;
        payload.isFaceRegistered = true;
      }

      // If email is empty, fallback to username
      const uname = (payload.username || '').trim();
      const mail = (payload.email || '').trim();
      if (!mail && uname) {
        payload.email = uname;
      }

      await api.post('/employees', payload);
      setIsCreateModalOpen(false);
      setCapturedFaceDescriptor(null);
      fetchEmployees();
      setFormData({
        employeeId: '',
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        designation: '',
        role: 'EMPLOYEE',
        employmentType: 'Full Time'
      });
      alert('✅ Employee account created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/employees/${id}/status`, { status: newStatus });
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Employee Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage workforce accounts, roles, and department assignments</p>
        </div>

        {['CEO', 'ADMIN', 'HR'].includes(user?.role) && (
          <button
            onClick={() => {
              setFormData({
                employeeId: '',
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phone: '',
                department: '',
                designation: '',
                role: 'EMPLOYEE',
                employmentType: 'Full Time'
              });
              setCapturedFaceDescriptor(null);
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white text-xs font-bold rounded-enterprise shadow-lg shadow-primary/25 flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      {/* Filter Bar with View Mode Toggle */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch('');
                setSearchParams({});
              }
            }}
            placeholder="Search by name, ID, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 relative">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Grid / List View Toggle Switch */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Grid View (Image 2 style)"
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="List View (Image 1 style)"
            >
              <List className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>

      {/* Employee Cards Area */}
      {loading ? (
        <div className="glass-card p-8 text-center text-slate-400 font-medium">Loading employees...</div>
      ) : employees.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View Layout (Matching Image 1 Design 100%) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {employees.map((emp, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              return (
                <div
                  key={emp._id}
                  onClick={() => handleOpenDetails(emp)}
                  className="relative overflow-hidden rounded-[26px] border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer group"
                >
                  {/* Header: Avatar, Name, ID & Active Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        user={emp}
                        size="w-12 h-12 text-sm font-bold"
                        className={`${theme.avatarBg} shadow-md ring-2 ring-white/80 shrink-0`}
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate capitalize tracking-tight group-hover:text-primary transition-colors">
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <p className={`text-xs font-mono font-extrabold ${theme.empIdColor} mt-0.5 truncate`}>
                          {emp.employeeId || 'EMP'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge with Green/Red Dot based on actual status */}
                    <div className="shrink-0">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5 shadow-2xs border ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border-rose-100 dark:border-rose-900/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {emp.status === 'ACTIVE' ? 'Active' : emp.status === 'INACTIVE' ? 'Inactive' : 'Suspended'}
                      </span>
                    </div>
                  </div>

                  {/* Tinted Profile Info Box */}
                  <div className={`${theme.boxBg} rounded-2xl p-3.5 border space-y-2.5 text-xs`}>
                    {/* Email */}
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold min-w-0">
                      <Mail className={`w-4 h-4 ${theme.iconColor} shrink-0`} />
                      <span className="truncate">{emp.email || '—'}</span>
                    </div>

                    {/* Department & Designation */}
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold min-w-0">
                      <Building2 className={`w-4 h-4 ${theme.iconColor} shrink-0`} />
                      <span className="truncate">
                        <strong className="font-extrabold text-slate-900 dark:text-white">{emp.department?.name || 'General'}</strong>
                        {emp.designation?.name && <span className="text-slate-500 font-medium"> • {emp.designation.name}</span>}
                      </span>
                    </div>

                    {/* Employment Type & Role */}
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-[11px] text-slate-700 dark:text-slate-300">
                        <UserCheck className={`w-4 h-4 ${theme.iconColor}`} />
                        {emp.employmentType || 'Full Time'}
                      </span>
                      <span className={`font-black text-[11px] uppercase tracking-wider ${theme.roleColor}`}>
                        {emp.role === 'TEAM_LEAD' ? 'Team Lead' : emp.role === 'ADMIN' ? 'Admin' : emp.role || 'Employee'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Button: Full Theme Gradient with View Profile -> */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(emp);
                    }}
                    className={`w-full py-2.5 px-4 rounded-2xl ${theme.btnBg} text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]`}
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Layout (Themed matching Grid View colors) */
          <div className="space-y-3">
            {employees.map((emp, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              return (
                <div
                  key={emp._id}
                  onClick={() => handleOpenDetails(emp)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 items-center gap-3 md:gap-4 cursor-pointer hover:shadow-md transition-all group ${theme.borderHover}`}
                >
                  {/* Left Column: Avatar + Name + Email */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        user={emp}
                        size="w-11 h-11 text-xs font-bold"
                        className={`${theme.avatarBg} shadow-md ring-2 ring-white/80 shrink-0`}
                      />
                      <div className="min-w-0">
                        <h3 className={`font-extrabold text-slate-900 dark:text-white text-xs sm:text-base truncate capitalize tracking-tight ${theme.nameHover} transition-colors`}>
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{emp.email}</p>
                      </div>
                    </div>

                    {/* Status Badge right-aligned on mobile only */}
                    <div className="md:hidden shrink-0">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5 shadow-2xs border ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border-rose-100 dark:border-rose-900/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {emp.status === 'ACTIVE' ? 'Active' : emp.status === 'INACTIVE' ? 'Inactive' : 'Suspended'}
                      </span>
                    </div>
                  </div>

                  {/* Emp ID Column */}
                  <div className={`hidden md:flex md:col-span-2 items-center font-mono text-xs font-extrabold ${theme.empIdColor}`}>
                    {emp.employeeId || 'EMP'}
                  </div>

                  {/* Department & Designation Column */}
                  <div className="hidden md:flex md:col-span-3 flex-col">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{emp.department?.name || '—'}</p>
                    <p className="text-[11px] text-slate-500 font-semibold truncate">{emp.designation?.name || '—'}</p>
                  </div>

                  {/* Status Badge & Action Button Column */}
                  <div className="flex items-center justify-between md:justify-end gap-4 md:col-span-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="hidden md:block">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] inline-flex items-center gap-1.5 shadow-2xs border ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border-rose-100 dark:border-rose-900/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {emp.status === 'ACTIVE' ? 'Active' : emp.status === 'INACTIVE' ? 'Inactive' : 'Suspended'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      <span className="hidden sm:inline">View Profile</span>
                      <div className={`w-8 h-8 rounded-full ${theme.btnBg} text-white flex items-center justify-center transition-all shrink-0 shadow-xs group-hover:scale-105`}>
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 font-medium">
          No employees found matching criteria.
        </div>
      )}

      {/* Employee Details Interactive Modal */}
      <EmployeeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        employee={selectedEmployee}
        departments={departments}
        designations={designations}
        onToggleStatus={handleToggleStatus}
        onUpdateSuccess={fetchEmployees}
      />

      {/* Add Employee Modal (Matching Image 1 Design 100%) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="max-w-lg"
        hideCloseButton={true}
      >
        <div className="space-y-4">
          {/* Modal Custom Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/40 shadow-xs">
                <UserPlus className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Create New Employee Account
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Fill in the details below to create a new employee account.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateEmployee} className="space-y-3.5" autoComplete="off">
            {/* Employee ID */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="e.g. EMP001"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all uppercase"
                  required
                />
              </div>
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Username & Email Address in separate boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {/* Department & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none z-10" />
                  <select
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="appearance-none w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Designation
                </label>
                <div className="relative">
                  <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none z-10" />
                  <select
                    value={formData.designation || ''}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="appearance-none w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                  >
                    <option value="" className="text-slate-400">Select Designation</option>
                    {designations.map((des) => (
                      <option key={des._id} value={des._id} className="text-slate-900 dark:text-white">{des.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                </div>
              </div>
            </div>

            {/* Role & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="appearance-none w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                  >
                    <option value="" disabled hidden>Select Role</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TEAM_LEAD">Team Lead</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Default: 123456"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Biometric Face Lock Setup */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-transparent border border-purple-500/30 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl text-white ${capturedFaceDescriptor ? 'bg-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-purple-600 shadow-md shadow-purple-500/20'}`}>
                  {capturedFaceDescriptor ? <Lock className="w-4 h-4 stroke-[2.2]" /> : <Scan className="w-4 h-4 stroke-[2.2]" />}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Face Lock Registration
                    {capturedFaceDescriptor && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Face Captured
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {capturedFaceDescriptor ? 'Employee face locked for attendance verification.' : 'Scan employee face now or setup later in profile.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateFaceModalOpen(true)}
                className="px-3 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-purple-500/25 flex items-center gap-1.5 transition-all shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{capturedFaceDescriptor ? 'Re-scan' : 'Scan Face'}</span>
              </button>
            </div>

            {/* Info Alert Box */}
            <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-3.5 flex items-start sm:items-center gap-3 text-xs text-purple-700 dark:text-purple-300 font-semibold">
              <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>A temporary password will be generated. The employee can change it after their first login.</span>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Account</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Face Lock Registration Modal for New Employee Creation */}
      <FaceCameraModal
        isOpen={isCreateFaceModalOpen}
        onClose={() => setIsCreateFaceModalOpen(false)}
        mode="register"
        employeeName={`${formData.firstName} ${formData.lastName}`.trim() || 'New Employee'}
        employeeId={formData.email || 'new_user_temp'}
        onCaptureSuccess={(desc) => {
          setCapturedFaceDescriptor(desc);
          setIsCreateFaceModalOpen(false);
        }}
      />
    </div>
  );
};

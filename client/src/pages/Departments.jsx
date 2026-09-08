import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Building2, Plus, Users, Trash2, AlertTriangle, UserPlus, Hash, FileText, PlusCircle, X } from 'lucide-react';

const CARD_THEMES = [
  {
    // Blue Theme (Engineering)
    id: 'blue',
    cardStroke: '#3B82F6',
    outerGlow: 'rgba(59, 130, 246, 0.3)',
    bgGradientTopLight: '#EFF6FF',
    bgGradientBottomLight: '#F8FAFC',
    miniHexFill: '#DBEAFE',
    miniHexStroke: '#2563EB',
    iconColor: '#2563EB',
    badgeClass: 'bg-blue-100/90 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60',
    dotColor: '#3B82F6',
    lineGradient: 'from-transparent via-blue-400 to-transparent',
    textAccent: 'text-blue-600 dark:text-blue-400',
    statBadge: 'bg-blue-100/80 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    // Green Theme (Human Resources)
    id: 'emerald',
    cardStroke: '#10B981',
    outerGlow: 'rgba(16, 185, 129, 0.3)',
    bgGradientTopLight: '#ECFDF5',
    bgGradientBottomLight: '#F8FAFC',
    miniHexFill: '#D1FAE5',
    miniHexStroke: '#059669',
    iconColor: '#059669',
    badgeClass: 'bg-emerald-100/90 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
    dotColor: '#10B981',
    lineGradient: 'from-transparent via-emerald-400 to-transparent',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
    statBadge: 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    // Orange/Amber Theme (Sales & Business)
    id: 'amber',
    cardStroke: '#F59E0B',
    outerGlow: 'rgba(245, 158, 11, 0.3)',
    bgGradientTopLight: '#FFFBEB',
    bgGradientBottomLight: '#F8FAFC',
    miniHexFill: '#FEF3C7',
    miniHexStroke: '#D97706',
    iconColor: '#D97706',
    badgeClass: 'bg-amber-100/90 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
    dotColor: '#F59E0B',
    lineGradient: 'from-transparent via-amber-400 to-transparent',
    textAccent: 'text-amber-600 dark:text-amber-400',
    statBadge: 'bg-amber-100/80 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    // Purple Theme (R&D / Marketing)
    id: 'purple',
    cardStroke: '#8B5CF6',
    outerGlow: 'rgba(139, 92, 246, 0.3)',
    bgGradientTopLight: '#F3E8FF',
    bgGradientBottomLight: '#F8FAFC',
    miniHexFill: '#E9D5FF',
    miniHexStroke: '#7C3AED',
    iconColor: '#7C3AED',
    badgeClass: 'bg-purple-100/90 text-purple-600 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
    dotColor: '#8B5CF6',
    lineGradient: 'from-transparent via-purple-400 to-transparent',
    textAccent: 'text-purple-600 dark:text-purple-400',
    statBadge: 'bg-purple-100/80 text-purple-600 dark:bg-purple-950 dark:text-purple-300',
  },
];

const DEPT_PRESETS = {
  ENG: {
    name: 'Engineering',
    code: 'ENG',
    description: 'Software development,\nDevOps and R&D',
    defaultCount: 25,
  },
  HR: {
    name: 'Human Resources',
    code: 'HR',
    description: 'Talent management and\nemployee welfare',
    defaultCount: 18,
  },
  SALES: {
    name: 'Sales & Business',
    code: 'SALES',
    description: 'Enterprise client\nacquisition',
    defaultCount: 30,
  },
};

const HexagonDepartmentCard = ({ dept, index, onDelete }) => {
  const navigate = useNavigate();
  const theme = CARD_THEMES[index % CARD_THEMES.length];

  const codeKey = dept.code?.toUpperCase();
  const preset = DEPT_PRESETS[codeKey];

  const deptName = dept.name || preset?.name || 'Department';
  const deptCode = dept.code || preset?.code || 'DEPT';
  const descriptionText = dept.description || preset?.description || 'Enterprise department unit structure';
  const displayEmployeeCount = (typeof dept.employeeCount === 'number')
    ? dept.employeeCount
    : (preset?.defaultCount ?? 0);

  return (
    <div
      onClick={() => navigate(`/employees?department=${encodeURIComponent(dept._id || dept.name || '')}`)}
      className="relative w-full max-w-[340px] sm:max-w-[350px] aspect-[320/440] mx-auto group cursor-pointer transition-all duration-300 hover:-translate-y-2 filter drop-shadow-lg hover:drop-shadow-2xl"
    >
      {/* Background SVG Hexagon Shape */}
      <svg
        className="w-full h-full absolute inset-0 overflow-visible pointer-events-none"
        viewBox="0 0 320 440"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`card-bg-${dept._id || index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.bgGradientTopLight} stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="100%" stopColor={theme.bgGradientBottomLight} stopOpacity="0.95" />
          </linearGradient>
          <filter id={`shadow-${dept._id || index}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor={theme.cardStroke} floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer Glow / Soft Stroke */}
        <path
          d="M 134 37.5 Q 160 24, 186 37.5 L 272 83 Q 298 96, 298 126 L 298 314 Q 298 344, 272 357 L 186 402.5 Q 160 416, 134 402.5 L 48 357 Q 22 344, 22 314 L 22 126 Q 22 96, 48 83 Z"
          fill="none"
          stroke={theme.outerGlow}
          strokeWidth="6"
        />

        {/* Main Rounded Hexagon Body */}
        <path
          d="M 134 37.5 Q 160 24, 186 37.5 L 272 83 Q 298 96, 298 126 L 298 314 Q 298 344, 272 357 L 186 402.5 Q 160 416, 134 402.5 L 48 357 Q 22 344, 22 314 L 22 126 Q 22 96, 48 83 Z"
          fill={`url(#card-bg-${dept._id || index})`}
          stroke={theme.cardStroke}
          strokeWidth="2.2"
          filter={`url(#shadow-${dept._id || index})`}
          className="dark:fill-slate-900/90 dark:stroke-slate-700"
        />
      </svg>

      {/* Delete Trash Button - Top Left inside Hexagon safe bounds */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(dept);
        }}
        title="Delete Department"
        className="absolute top-[76px] left-[94px] z-20 p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
      >
        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
      </button>

      {/* Content Layer strictly aligned inside safe Y zone (Y: 24..314) */}
      <div className="relative z-10 flex flex-col justify-between h-full pt-28 pb-24 px-6 text-center">
        {/* Center Content: Mini Hexagon Icon, Title, Decorative Line with Dot, Description */}
        <div className="flex flex-col items-center justify-center pt-2">
          {/* Mini Hexagon Icon Badge right above Heading */}
          <div className="relative mb-2 shrink-0">
            <svg className="w-14 h-16 sm:w-15 sm:h-17 overflow-visible filter drop-shadow-sm" viewBox="0 0 70 78">
              <path
                d="M 26 11 Q 35 6, 44 11 L 56 18 Q 63 22, 63 30 L 63 48 Q 63 56, 56 60 L 44 67 Q 35 72, 26 67 L 14 60 Q 7 56, 7 48 L 7 30 Q 7 22, 14 18 Z"
                fill={theme.miniHexFill}
                stroke={theme.miniHexStroke}
                strokeWidth="2"
                className="dark:fill-slate-800"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-6 h-6 sm:w-6.5 sm:h-6.5 stroke-[2.2]" style={{ color: theme.iconColor }} />
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {deptName}
          </h3>

          {/* Decorative line with center dot */}
          <div className="flex items-center justify-center gap-1.5 w-20 mx-auto my-1.5">
            <div className={`h-[1.5px] flex-1 bg-gradient-to-r ${theme.lineGradient}`} />
            <div className="w-2 h-2 rounded-full shadow-2xs" style={{ backgroundColor: theme.dotColor }} />
            <div className={`h-[1.5px] flex-1 bg-gradient-to-l ${theme.lineGradient}`} />
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[180px] mx-auto whitespace-pre-line">
            {descriptionText}
          </p>
        </div>

        {/* Bottom Stats Section placed well inside wide Y zone */}
        <div className="w-full max-w-[195px] sm:max-w-[200px] mx-auto px-1">
          <div className="w-full pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            {/* Left: View Employees Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/employees?department=${encodeURIComponent(dept._id || dept.name || '')}`);
              }}
              title="View Employees in this Department"
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-extrabold ${theme.textAccent} hover:underline cursor-pointer transition-all hover:scale-105 active:scale-95`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{displayEmployeeCount} Employees</span>
            </button>

            {/* Right: Add Employee to Department Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/employees?department=${encodeURIComponent(dept._id || dept.name || '')}&action=add`);
              }}
              title={`Add New Employee to ${deptName}`}
              className={`w-7 h-7 rounded-full flex items-center justify-center ${theme.statBadge} hover:scale-110 active:scale-95 cursor-pointer shadow-2xs transition-all`}
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Departments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  // Custom Delete Modal State
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', formData);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleOpenDeleteModal = (dept) => {
    setDeptToDelete(dept);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/departments/${deptToDelete._id}`);
      setIsDeleteModalOpen(false);
      setDeptToDelete(null);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove department.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-28 sm:pb-8">
      {/* Top Header Section matching Image 1 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Enterprise organizational unit structure
          </p>
        </div>

        {['ADMIN', 'HR', 'CEO'].includes(user?.role) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="group px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-black rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" /> Add Department
          </button>
        )}      </div>

      {/* Hexagon Department Cards Grid matching Image 1 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-2">
          {departments.map((dept, index) => (
            <HexagonDepartmentCard
              key={dept._id || index}
              dept={dept}
              index={index}
              onDelete={handleOpenDeleteModal}
              userRole={user?.role}
            />
          ))}

          {/* Add New Department Interactive Card */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="relative w-full max-w-[340px] sm:max-w-[350px] aspect-[320/440] mx-auto group cursor-pointer transition-all duration-300 hover:-translate-y-2 filter drop-shadow-md hover:drop-shadow-xl flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-blue-400/60 dark:border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <Plus className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight mb-1">
              Add Department
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center max-w-[200px] leading-relaxed">
              Create a new organizational unit for your enterprise
            </p>
          </div>
        </div>
      )}

      {/* Create Department Modal (Matching Image 2 Design 100%) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-lg"
        hideCloseButton={true}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-50 dark:from-purple-950/60 dark:to-indigo-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/40 shadow-xs">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Create Department
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Add a new department to your organization
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleCreate} className="space-y-3.5">
            {/* Department Name */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                Department Name
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r border-purple-100 dark:border-slate-700 text-purple-500 pointer-events-none">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Research & Development"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* Department Code */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                Department Code
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r border-purple-100 dark:border-slate-700 text-purple-500 font-extrabold text-sm pointer-events-none">
                  #
                </div>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. RND"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                Description
              </label>
              <div className="relative flex items-start">
                <div className="absolute left-0 top-0 w-10 pt-3 flex items-center justify-center border-r border-purple-100 dark:border-slate-700 text-purple-500 pointer-events-none">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Enter a short description about this department..."
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Create</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal Popup */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteModalOpen(false);
            setDeptToDelete(null);
          }
        }}
        maxWidth="max-w-lg"
        overflowHidden={true}
      >
        <div className="space-y-4 p-1 sm:p-2 border-b-4 border-rose-600 rounded-b-2xl">
          <div className="flex items-center gap-4 sm:gap-6 text-left">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FFEAEF] dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center shrink-0 shadow-inner">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-14 rounded-b-2xl bg-gradient-to-b from-rose-500 to-rose-600 flex items-center justify-center shadow-md relative">
                  <div className="absolute -top-1.5 w-14 h-2.5 bg-rose-700 rounded-full shadow-2xs" />
                  <div className="flex gap-1.5 opacity-40">
                    <div className="w-1 h-6 bg-white rounded-full" />
                    <div className="w-1 h-6 bg-white rounded-full" />
                  </div>
                </div>
                <div className="absolute -top-4 left-1.5 w-6 h-6 bg-white rounded-sm border border-blue-200 shadow-2xs rotate-[-12deg] flex items-center justify-center text-[9px] text-blue-500 font-extrabold">
                  📄
                </div>
                <div className="absolute -bottom-2 -right-3 w-9 h-9 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
                  <AlertTriangle className="w-5 h-5 text-slate-950 fill-amber-400 stroke-[2.5]" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Delete Department?
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                You are about to remove
              </p>
              <p className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 leading-snug">
                {deptToDelete?.name}.
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#FFF6E9] dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-left flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-500 fill-amber-500/20 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-amber-200 leading-relaxed">
              {deptToDelete?.employeeCount > 0
                ? `Warning: ${deptToDelete?.name} currently has ${deptToDelete?.employeeCount} active employee(s) assigned. Deleting this department cannot be undone.`
                : 'This action will mark the department as deleted and cannot be undone.'}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeptToDelete(null);
              }}
              className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-extrabold rounded-2xl transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleConfirmDelete}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-white" />
              <span>{deleteLoading ? 'Deleting...' : 'Yes, Delete'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


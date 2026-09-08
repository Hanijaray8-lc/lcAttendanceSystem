import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { DesignationDetailsModal } from '../components/DesignationDetailsModal';
import { Award, Plus, Trash2, ChevronRight, Building2, Briefcase, Settings, Users, AlertTriangle } from 'lucide-react';

const ROW_THEMES = [
  {
    // Theme 1: Purple (Sales & Business)
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300",
    codeColor: "text-purple-600 dark:text-purple-400",
    deptBadgeBg: "bg-purple-100/70 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300",
    gradeBadge: "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300",
    nameHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    borderHover: "hover:border-purple-300 dark:hover:border-purple-800",
    arrowHover: "group-hover:bg-purple-600 group-hover:text-white shadow-purple-500/25",
    deptIcon: Briefcase
  },
  {
    // Theme 2: Blue (Engineering)
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
    codeColor: "text-blue-600 dark:text-blue-400",
    deptBadgeBg: "bg-blue-100/70 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
    gradeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300",
    nameHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    borderHover: "hover:border-blue-300 dark:hover:border-blue-800",
    arrowHover: "group-hover:bg-blue-600 group-hover:text-white shadow-blue-500/25",
    deptIcon: Settings
  },
  {
    // Theme 3: Emerald (Human Resources)
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    codeColor: "text-emerald-600 dark:text-emerald-400",
    deptBadgeBg: "bg-emerald-100/70 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    gradeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
    nameHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    borderHover: "hover:border-emerald-300 dark:hover:border-emerald-800",
    arrowHover: "group-hover:bg-emerald-600 group-hover:text-white shadow-emerald-500/25",
    deptIcon: Users
  },
  {
    // Theme 4: Amber (Sales & Marketing)
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    codeColor: "text-amber-600 dark:text-amber-400",
    deptBadgeBg: "bg-amber-100/70 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    gradeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300",
    nameHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    borderHover: "hover:border-amber-300 dark:hover:border-amber-800",
    arrowHover: "group-hover:bg-amber-600 group-hover:text-white shadow-amber-500/25",
    deptIcon: Briefcase
  }
];

export const Designations = () => {
  const { user } = useAuth();
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [designationToDelete, setDesignationToDelete] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', department: '', grade: 'L2' });

  const fetchData = async () => {
    try {
      const [desigRes, deptRes] = await Promise.all([
        api.get('/designations'),
        api.get('/departments')
      ]);
      setDesignations(desigRes.data.data.designations || []);
      setDepartments(deptRes.data.data.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetails = (d) => {
    setSelectedDesignation(d);
    setIsDetailsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/designations', formData);
      setIsCreateModalOpen(false);
      fetchData();
      setFormData({ name: '', code: '', department: '', grade: 'L2' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create designation');
    }
  };

  const handleDelete = (id) => {
    setDesignationToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!designationToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/designations/${designationToDelete}`);
      setIsDeleteConfirmOpen(false);
      setDesignationToDelete(null);
      setIsDetailsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to delete designation.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = async (id, data) => {
    await api.put(`/designations/${id}`, data);
    fetchData();
    // Refresh selectedDesignation with updated data
    const res = await api.get('/designations');
    const updated = (res.data.data.designations || []).find(d => d._id === id);
    if (updated) setSelectedDesignation(updated);
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-8">
      {/* Header & Action (Matching Image 1 Design) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/40 shadow-xs">
            <Award className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Designations</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Job titles, grades, and department mappings</p>
          </div>
        </div>

        {['HR', 'ADMIN', 'CEO', 'TEAM_LEAD'].includes(user?.role) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all w-full sm:w-auto justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Designation
          </button>
        )}
      </div>

      {/* Responsive Designation Cards Grid (Image 1 Style) */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-8 text-center text-slate-400 font-medium">Loading designations...</div>
        ) : designations.length > 0 ? (
          designations.map((d, index) => {
            const theme = ROW_THEMES[index % ROW_THEMES.length];
            const DeptIcon = theme.deptIcon;

            return (
              <div
                key={d._id}
                onClick={() => handleOpenDetails(d)}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 items-center gap-3 md:gap-4 cursor-pointer hover:shadow-md transition-all group ${theme.borderHover}`}
              >
                {/* Designation Name & Icon: 4 Columns */}
                <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-2xl ${theme.iconBg} shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                      <Award className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-extrabold text-slate-900 dark:text-white text-xs sm:text-base truncate capitalize tracking-tight ${theme.nameHover} transition-colors`}>
                        {d.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold truncate">{d.department?.name || 'Unassigned'}</p>
                    </div>
                  </div>

                  {/* Grade pill right-aligned on mobile */}
                  <div className="md:hidden shrink-0">
                    <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] ${theme.gradeBadge}`}>
                      {d.grade || 'L2'}
                    </span>
                  </div>
                </div>

                {/* Code Column: 3 Columns */}
                <div className={`hidden md:flex md:col-span-3 items-center font-mono text-xs font-black ${theme.codeColor}`}>
                  {d.code}
                </div>

                {/* Department Badge Column: 3 Columns */}
                <div className="hidden md:flex md:col-span-3 items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-full ${theme.deptBadgeBg} shrink-0`}>
                    <DeptIcon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                    {d.department?.name || '—'}
                  </span>
                </div>

                {/* Grade Pill & Action Arrow: 2 Columns */}
                <div className="flex items-center justify-between md:justify-end gap-4 md:col-span-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="hidden md:block">
                    <span className={`px-3 py-1 rounded-full font-extrabold text-xs shadow-2xs ${theme.gradeBadge}`}>
                      {d.grade || 'L2'}
                    </span>
                  </div>

                  <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center transition-all shrink-0 shadow-xs ${theme.arrowHover}`}>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 text-center text-slate-400 font-medium">
            No designations configured.
          </div>
        )}
      </div>

      {/* Designation Details Interactive Modal */}
      <DesignationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        designation={selectedDesignation}
        currentUser={user}
        onDelete={handleDelete}
        onEdit={handleEdit}
        departments={departments}
      />

      {/* Add Designation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="max-w-lg"
        hideCloseButton={true}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/40 shadow-xs">
                <Award className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Add Designation
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure new job title, code, and department mapping
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors shrink-0"
            >
              <Award className="hidden" /> ✕
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                Designation Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. SFSE"
                  className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                >
                  <option value="">Select Dept</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
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
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => !deleteLoading && setIsDeleteConfirmOpen(false)} maxWidth="max-w-sm">
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Delete Designation?</h3>
            <p className="text-sm text-slate-500 mt-1">This action cannot be undone.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleConfirmDelete}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Award, Building2, Layers, Trash2, Edit3, Save, X } from 'lucide-react';

export const DesignationDetailsModal = ({ isOpen, onClose, designation, currentUser, onDelete, onEdit, departments = [] }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', code: '', department: '', grade: '' });

  const isHR = ['HR', 'ADMIN', 'CEO', 'TEAM_LEAD'].includes(currentUser?.role);

  useEffect(() => {
    if (designation) {
      setEditForm({
        name: designation.name || '',
        code: designation.code || '',
        department: designation.department?._id || designation.department || '',
        grade: designation.grade || 'L2'
      });
      setIsEditing(false);
    }
  }, [designation, isOpen]);

  if (!designation) return null;

  const handleDeleteClick = async () => {
    if (window.confirm(`Are you sure you want to delete ${designation.name}?`)) {
      setLoading(true);
      await onDelete(designation._id);
      setLoading(false);
      onClose();
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onEdit(designation._id, editForm);
      setIsEditing(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update designation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Designation Mapping Details" maxWidth="max-w-xl">
      <div className="space-y-6 pr-2 sm:pr-4 pb-6">
        {/* Header Overview Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-sky-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-primary text-white shadow-md shadow-primary/20 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {isEditing ? editForm.name || designation.name : designation.name}
              </h3>
              <p className="text-xs text-primary font-bold font-mono mt-1">
                CODE: {isEditing ? editForm.code || designation.code : (designation.code || 'N/A')}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Grade {isEditing ? editForm.grade : (designation.grade || 'L2')}
            </span>
          </div>
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <>
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" /> Assigned Department
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {designation.department?.name || 'Unassigned'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500" /> Job Level & Grade
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  Level {designation.grade || 'L2'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isHR && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Edit Designation
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDeleteClick}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete Designation
                </button>
              </div>
            )}
          </>
        ) : (
          /* Edit Mode Form */
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Designation Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                placeholder="e.g. Senior Engineer"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Code *</label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white outline-none focus:border-primary uppercase"
                  placeholder="e.g. SE"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Grade</label>
                <select
                  value={editForm.grade}
                  onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
                >
                  {['L1','L2','L3','L4','L5','L6'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Department</label>
              <select
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

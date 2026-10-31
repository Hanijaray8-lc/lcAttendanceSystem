import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserAvatar } from '../components/UserAvatar';
import { StatusBadge } from '../components/Badge';
import { ReportDetailsModal } from '../components/ReportDetailsModal';
import { BarChart3, Download, FileSpreadsheet, FileText, Filter, Calendar, ChevronRight } from 'lucide-react';

export const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCustomDate, setSelectedCustomDate] = useState('');
  const dateInputRef = React.useRef(null);

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const handleCustomDateChange = (e) => {
    const val = e.target.value;
    if (val) {
      setSelectedCustomDate(val);
      const pickedYear = new Date(val).getFullYear();
      setYear(pickedYear);
    }
  };

  const fetchReports = async () => {
    try {
      const params = { year };
      if (status) params.status = status;
      // If a specific date is selected, pass it as fromDate filter
      if (selectedCustomDate) params.date = selectedCustomDate;
      const res = await api.get('/reports', { params });
      setReports(res.data.data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [year, status, selectedCustomDate]);

  const handleOpenDetails = (r) => {
    setSelectedReport(r);
    setIsDetailsModalOpen(true);
  };

  const handleExport = async (format) => {
    try {
      const params = { year, format };
      if (status) params.status = status;
      if (selectedCustomDate) params.date = selectedCustomDate;

      const res = await api.get('/reports/export', { params });
      const data = res.data.data;

      if (!data || data.length === 0) {
        alert('No data available to export.');
        return;
      }

      if (format === 'pdf') {
        const printWindow = window.open('', '_blank');
        const rowsHtml = data
          .map(
            (r, idx) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${r['Employee ID'] || '-'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${r['Employee Name'] || '-'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${r['Leave Type'] || '-'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${r['From Date']} - ${r['To Date']}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${r['Days']}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${r['Status']}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${r['Reason'] || '-'}</td>
          </tr>
        `
          )
          .join('');

        printWindow.document.write(`
          <html>
            <head>
              <title>Enterprise Leave Report - ${year}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; }
                h1 { color: #0f172a; font-size: 22px; margin-bottom: 4px; }
                p { color: #64748b; font-size: 13px; margin-top: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
                tr:nth-child(even) { background-color: #f8fafc; }
              </style>
            </head>
            <body>
              <h1>Enterprise Leave Analytics Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()} | Total Records: ${data.length}</p>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Emp ID</th>
                    <th>Employee Name</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
              <script>
                window.onload = function() { window.print(); };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }

      // CSV / Excel Blob Download Trigger
      const keys = Object.keys(data[0] || {});
      const csvLines = [
        keys.join(','),
        ...data.map((row) =>
          keys
            .map((k) => {
              const val = String(row[k] ?? '').replace(/"/g, '""');
              return `"${val}"`;
            })
            .join(',')
        )
      ].join('\r\n');

      const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Enterprise_Leave_Report_${year}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Export Error]', err);
      alert('Failed to generate export file: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-8">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Enterprise Leave Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Generate, analyze, and export comprehensive leave analytics</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => handleExport('csv')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel/CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden max-w-full">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto min-w-0">
          {/* Interactive Calendar Button with Overlay Date Input so picker opens right at the button */}
          <div className="relative inline-flex items-center shrink-0">
            <button
              type="button"
              className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 shadow-2xs"
              title="Click to pick date from calendar"
            >
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>

            {/* Invisible Native Date Input Overlay positioned directly on top of the button */}
            <input
              type="date"
              value={selectedCustomDate}
              onChange={handleCustomDateChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
          </div>

          <input
            type="number"
            min="2000"
            max="2100"
            step="1"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setSelectedCustomDate('');
            }}
            className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-2xs shrink-0"
            placeholder="Year"
          />

          {selectedCustomDate && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold shadow-2xs shrink-0 max-w-full overflow-hidden">
              <span className="truncate">{selectedCustomDate}</span>
              <button
                type="button"
                onClick={() => setSelectedCustomDate('')}
                className="hover:opacity-75 ml-1 text-xs font-black shrink-0"
                title="Clear date filter"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 min-w-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="HR_APPROVED">Approved Only</option>
            <option value="HR_REJECTED">Rejected Only</option>
            <option value="PENDING">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Responsive Compact Leave Report Cards (Zero Horizontal Scrolling!) */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-8 text-center text-slate-400 font-medium">Loading leave reports...</div>
        ) : reports.length > 0 ? (
          reports.map((r) => (
            <div
              key={r._id}
              onClick={() => handleOpenDetails(r)}
              className="glass-card p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 items-center gap-3 md:gap-4 cursor-pointer hover:border-primary/50 transition-all group"
            >
              {/* Employee Avatar & Info: 3 Columns on Tablet, 3 on Desktop */}
              <div className="md:col-span-3 xl:col-span-3 flex items-center justify-between md:justify-start gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={r.user} size="w-10 h-10 text-xs shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-xs sm:text-sm md:text-base truncate">
                      {r.user?.firstName} {r.user?.lastName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono font-semibold truncate">{r.user?.employeeId || 'N/A'}</p>
                  </div>
                </div>

                {/* Status Badge right-aligned on mobile */}
                <div className="md:hidden shrink-0">
                  <StatusBadge status={r.status} />
                </div>
              </div>

              {/* Leave Type & Days Column: 3 Columns on Tablet, 2 on Desktop */}
              <div className="hidden md:flex md:col-span-3 xl:col-span-2 items-center gap-2 min-w-0">
                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{r.leaveType?.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-extrabold shrink-0">
                  {r.daysCount} Day{r.daysCount > 1 ? 's' : ''}
                </span>
              </div>

              {/* Date Period Column: 3 Columns on Tablet, 4 on Desktop */}
              <div className="hidden md:flex md:col-span-3 xl:col-span-4 items-center text-xs font-mono font-semibold text-slate-500 min-w-0 shrink-0">
                {new Date(r.fromDate).toLocaleDateString()} - {new Date(r.toDate).toLocaleDateString()}
              </div>

              {/* Status & Action Arrow: 3 Columns on Tablet, 3 on Desktop */}
              <div className="flex items-center justify-between md:justify-end gap-2 md:col-span-3 xl:col-span-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 min-w-0">
                <div className="hidden md:block shrink-0">
                  <StatusBadge status={r.status} />
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white text-slate-400 flex items-center justify-center transition-all shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center text-slate-400 font-medium">
            No leave records found for selected filters.
          </div>
        )}
      </div>

      {/* Leave Report Record Interactive Modal */}
      <ReportDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        report={selectedReport}
      />
    </div>
  );
};

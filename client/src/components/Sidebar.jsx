import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './UserAvatar';
import { ASSETS } from '../assets';
import api from '../services/api';
import {
  LayoutDashboard,
  Clock,
  Users,
  Building2,
  Award,
  CalendarDays,
  FileCheck2,
  CalendarCheck,
  BarChart3,
  FileText,
  Bell,
  ShieldAlert,
  Settings,
  X,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || 'EMPLOYEE';
  const [unreadCount, setUnreadCount] = useState(0);

  // Fix 12: Proper role display labels
  const getRoleLabel = (r) => {
    const labels = {
      CEO: 'CEO',
      ADMIN: 'Admin',
      HR: 'HR',
      TEAM_LEAD: 'Team Lead',
      EMPLOYEE: 'Employee'
    };
    return labels[r] || r?.replace('_', ' ') || 'Employee';
  };

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        if (location.pathname === '/notifications') {
          if (isMounted) setUnreadCount(0);
          return;
        }
        const res = await api.get('/notifications');
        if (isMounted) {
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch (err) {
        // silent catch
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  const menuCategories = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD', 'EMPLOYEE'] },
        { label: 'Attendance & Punch', path: '/attendance', icon: Clock, roles: ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD', 'EMPLOYEE'] },
        { label: 'Leave Requests', path: '/leaves', icon: FileCheck2, roles: ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD', 'EMPLOYEE'] },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Employee Management', path: '/employees', icon: Users, roles: ['ADMIN', 'CEO', 'HR'] },
        { label: 'Departments', path: '/departments', icon: Building2, roles: ['ADMIN', 'CEO', 'HR'] },
        { label: 'Designations', path: '/designations', icon: Award, roles: ['ADMIN', 'CEO', 'HR'] },
      ]
    },
    {
      title: 'SETUP & REPORTS',
      items: [
        { label: 'Leave Types', path: '/leave-types', icon: CalendarDays, roles: ['ADMIN', 'CEO', 'HR'] },
        { label: 'Holidays', path: '/holidays', icon: CalendarCheck, roles: ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD', 'EMPLOYEE'] },
        { label: 'Daily Work Reports', path: '/daily-reports', icon: FileText, roles: ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD', 'EMPLOYEE'] },
        { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD'] },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD', 'EMPLOYEE'], badge: unreadCount > 0 ? { text: String(unreadCount), color: 'bg-rose-500 text-white font-black' } : null },
        { label: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['ADMIN', 'CEO', 'HR', 'TEAM_LEAD'], badge: { text: 'LIVE', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' } },
        { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN', 'CEO', 'HR'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 h-[100dvh] w-64 xl:w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo Brand Header matching Image 1 Design with Mobile Close 'X' Button */}
          <div className="h-20 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer shrink-0 flex items-center justify-center">
                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-400 via-sky-300 to-indigo-400 rounded-full blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-300 animate-pulse" />
                <div className="relative w-11 h-11 rounded-full bg-white shadow-[0_0_18px_rgba(59,130,246,0.4)] flex items-center justify-center p-1.5 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  <img src={ASSETS.logo} alt="Life Changers Ind Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <div>
                <h1 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight leading-none">
                  Life Changers <span className="text-primary">Ind</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">LCM Portal</p>
              </div>
            </div>

            {/* Mobile Close 'X' Button - Bold & Crystal Clear */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="lg:hidden w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-2xs shrink-0 active:scale-95"
              title="Close Menu"
            >
              <X className="w-4.5 h-4.5 stroke-[3]" />
            </button>
          </div>

          {/* Navigation Links Grouped by Categories */}
          <nav className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            {menuCategories.map((category) => {
              const items = category.items.filter((item) => item.roles.includes(role));
              if (items.length === 0) return null;

              return (
                <div key={category.title} className="space-y-1">
                  <p className="px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    {category.title}
                  </p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setIsOpen(false);
                          const mainEl = document.querySelector('main');
                          if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={({ isActive }) =>
                          `relative flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 translate-x-1'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-white rounded-r-full shadow-xs" />
                            )}
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4.5 h-4.5 transition-transform duration-200 ${isActive ? 'scale-110 text-white' : 'group-hover:scale-110 text-slate-400 dark:text-slate-400 group-hover:text-blue-600'}`} />
                              <span>{item.label}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.badge && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs ${item.badge.color}`}>
                                  {item.badge.text}
                                </span>
                              )}
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? 'text-white opacity-90 translate-x-0.5' : 'text-slate-400 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
                            </div>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile Summary (Clickable -> Profile Page) */}
        <div className="p-4 pb-8 sm:pb-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <NavLink
            to="/profile"
            onClick={() => {
              setIsOpen(false);
              const mainEl = document.querySelector('main');
              if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500/40 flex items-center gap-3 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="relative shrink-0">
              <UserAvatar user={user} size="w-9 h-9 text-xs" />
              {/* Online Green Pulse Indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800 animate-pulse" />
            </div>
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-black rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {user?.role === 'CEO' ? 'CEO' : (user?.designation?.name || getRoleLabel(role))}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </NavLink>
        </div>
      </aside>
    </>
  );
};

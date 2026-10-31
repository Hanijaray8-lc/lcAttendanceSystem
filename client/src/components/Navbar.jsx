import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserAvatar } from './UserAvatar';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import api from '../services/api';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onForegroundMessage } from '../firebase';

export const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState(null);

  // Fetch unread notification count
  useEffect(() => {
    let isMounted = true;
    const fetchUnreadNotifications = async () => {
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
        // Silently handle background notification poll errors
      }
    };

    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000);

    // Global listener for foreground push notifications
    const unsubscribePush = onForegroundMessage((payload) => {
      console.log('Global foreground notification:', payload);
      setUnreadCount((prev) => prev + 1);

      const title = payload?.notification?.title || 'LMS Update';
      const body = payload?.notification?.body || 'You have a new notification.';

      // Show In-App Toast
      setGlobalToast({ title, body });
      setTimeout(() => setGlobalToast(null), 5000);

      // Show native system notification like WhatsApp
      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          if (registration) {
            registration.showNotification(title, {
              body,
              icon: '/vite.svg'
            });
          } else {
            new Notification(title, {
              body,
              icon: '/vite.svg'
            });
          }
        }).catch(() => {
          new Notification(title, {
            body,
            icon: '/vite.svg'
          });
        });
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof unsubscribePush === 'function') unsubscribePush();
    };
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/employees?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="relative z-30 shrink-0 h-14 sm:h-16 lg:h-20 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-8 flex items-center justify-between transition-colors duration-200 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Animated Uiverse Hamburger Menu Button */}
        <label className="menuButton lg:hidden shrink-0" title="Toggle Sidebar Menu">
          <input
            type="checkbox"
            checked={!!sidebarOpen}
            onChange={onToggleSidebar}
          />
          <span className="top"></span>
          <span className="mid"></span>
          <span className="bot"></span>
        </label>

        {/* Global Search Bar — hidden for EMPLOYEE role */}
        {user?.role !== 'EMPLOYEE' && (
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-72 lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees, leaves, departments..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-blue-500 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 rounded-enterprise outline-none transition-all shadow-2xs"
            />
          </form>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Animated Uiverse Day/Night Theme Switcher */}
        <label className="theme-switch shrink-0" title="Toggle Light/Dark Theme">
          <input
            type="checkbox"
            className="theme-switch__checkbox"
            checked={isDarkMode}
            onChange={toggleTheme}
          />
          <div className="theme-switch__container">
            <div className="theme-switch__clouds"></div>
            <div className="theme-switch__stars-container">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z" fill="currentColor"></path>
              </svg>
            </div>
            <div className="theme-switch__circle-container">
              <div className="theme-switch__sun-moon-container">
                <div className="theme-switch__moon">
                  <div className="theme-switch__spot"></div>
                  <div className="theme-switch__spot"></div>
                  <div className="theme-switch__spot"></div>
                </div>
              </div>
            </div>
          </div>
        </label>

        {/* Notification Bell Button (Smaller on mobile phone size) */}
        <button
          type="button"
          onClick={() => {
            setUnreadCount(0);
            navigate('/notifications');
          }}
          className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary text-white hover:bg-blue-700 transition-all duration-200 shadow-md shrink-0"
          title="Notifications"
        >
          <svg viewBox="0 0 448 512" className="w-4 h-4 sm:w-4.5 sm:h-4.5">
            <path d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z" fill="currentColor" />
          </svg>
          {unreadCount > 0 && location.pathname !== '/notifications' && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 text-white text-[9px] font-black flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Symmetrical Pill Badge */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 p-1 sm:pl-1.5 sm:pr-4 rounded-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-primary/40 transition-all shrink-0"
          title="View Profile"
        >
          <UserAvatar user={user} size="w-8 h-8 text-xs shrink-0" />
          <div className="hidden sm:block text-left pr-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-none capitalize">
              {`${user?.firstName || ''} ${user?.lastName || ''}`.replace(/\d+/g, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim() || 'User'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
              {user?.role === 'CEO' ? 'CEO' : (user?.designation?.name || (user?.role === 'ADMIN' ? 'Admin' : user?.role === 'TEAM_LEAD' ? 'Team Lead' : user?.role === 'EMPLOYEE' ? 'Employee' : user?.role?.replace('_', ' ')))}
            </p>
          </div>
        </div>

        {/* Uiverse Animated Expandable Logout Button */}
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          title="Logout"
          className="group flex items-center justify-start w-9 h-9 sm:w-10 sm:h-10 bg-primary hover:bg-blue-700 text-white rounded-full cursor-pointer relative overflow-hidden transition-all duration-300 shadow-md hover:w-28 active:translate-x-0.5 active:translate-y-0.5 shrink-0"
        >
          <div className="flex items-center justify-center w-9 sm:w-10 shrink-0 transition-all duration-300 group-hover:justify-start group-hover:pl-3">
            <svg className="w-4 h-4 text-white" viewBox="0 0 512 512" fill="currentColor">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
            </svg>
          </div>
          <div className="absolute right-3.5 transform translate-x-full opacity-0 text-white text-xs font-bold transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Logout
          </div>
        </button>
      </div>

      {/* Logout Confirmation Dialog Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />
      {/* Global In-App Toast Notification (WhatsApp/Instagram style) */}
      {globalToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100000] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex items-start gap-3 w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{globalToast.title}</h4>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{globalToast.body}</p>
          </div>
          <button onClick={() => setGlobalToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
};

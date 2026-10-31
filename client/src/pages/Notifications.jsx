import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Bell,
  CheckCheck,
  BellRing,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  FileText,
  User,
  ShieldCheck,
  Users,
  Trash2
} from 'lucide-react';
import { requestFcmToken, onForegroundMessage } from '../firebase';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState('UNKNOWN');
  const [pushMessage, setPushMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchAndMarkNotifications = async (currentPage = 1) => {
    try {
      const res = await api.get('/notifications', { params: { page: currentPage, limit: LIMIT } });
      setNotifications(res.data.data.notifications || []);
      setTotal(res.data.data.pagination?.total || 0);
      setTotalPages(res.data.data.pagination?.pages || 1);

      // Auto-mark all notifications as read when opening Notifications page
      if (res.data.data.unreadCount > 0) {
        await api.patch('/notifications/all/read');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndMarkNotifications(page);

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushStatus('ENABLED');
      } else if (Notification.permission === 'denied') {
        setPushStatus('DENIED');
      }
    }

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Foreground notification received:', payload);
      setPushMessage(payload?.notification?.title || 'New Push Notification received!');
      fetchAndMarkNotifications();
      setTimeout(() => setPushMessage(''), 5000);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleEnablePush = async () => {
    setPushStatus('ENABLING');
    try {
      // 1. Request native browser notification permission first
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPushStatus('ENABLED');
        } else if (permission === 'denied') {
          setPushStatus('DENIED');
          return; // Stop if they explicitly blocked it
        }
      }

      // 2. Try to get FCM Token (Will fail silently if Firebase env vars are missing)
      const token = await requestFcmToken();
      if (token) {
        await api.post('/auth/fcm-token', { fcmToken: token });
        setPushMessage('Browser push notifications enabled successfully!');
        setTimeout(() => setPushMessage(''), 5000);
      }
    } catch (err) {
      console.error('Failed to enable push notifications:', err);
      if ('Notification' in window && Notification.permission === 'granted') {
        setPushStatus('ENABLED');
      } else {
        setPushStatus('UNKNOWN');
      }
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) return;
    try {
      await api.delete('/notifications/all');
      setNotifications([]);
      setTotal(0);
      setPage(1);
    } catch (err) {
      console.error(err);
      alert('Failed to clear all notifications.');
    }
  };

  const handleTestNotification = async () => {
    setPushMessage("🚀 Test Notification Triggered! Check your device popups & list.");
    setTimeout(() => setPushMessage(''), 5000);

    try {
      // Save test notification persistently into MongoDB database
      const res = await api.post('/notifications/test');
      if (res.data?.data?.notification) {
        setNotifications(prev => [res.data.data.notification, ...prev.filter(n => n._id !== res.data.data.notification._id)]);
        setTotal(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to save test notification in database:', err);
      const testItem = {
        _id: 'test-' + Date.now(),
        title: "🚀 Test Notification",
        message: "Push & In-App notifications are working properly on your device!",
        type: 'SYSTEM',
        isRead: true,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [testItem, ...prev]);
      setTotal(prev => prev + 1);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          await registration.showNotification("🚀 LCM Test Notification", {
            body: "This is a test notification. Push notifications are working on your device!",
            icon: "/vite.svg"
          });
        } else {
          new Notification("🚀 LCM Test Notification", {
            body: "This is a test notification. Push notifications are working on your device!",
            icon: "/vite.svg"
          });
        }
      } catch (err) {
        console.error('Test notification error:', err);
        try {
          new Notification("🚀 LCM Test Notification", {
            body: "This is a test notification. Push notifications are working on your device!",
            icon: "/vite.svg"
          });
        } catch (e) {
          console.error('Fallback notification error:', e);
        }
      }
    } else {
      alert("Please click 'Enable Push' first and allow notification permissions!");
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;

    // Handle local test notification items (id starting with 'test-') without making API call
    if (typeof id === 'string' && id.startsWith('test-')) {
      setNotifications(prev => prev.filter(n => n._id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      return;
    }

    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
      alert(`Failed to delete notification. Reason: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 sm:pb-8">
      {/* Toast Alert for Push Message */}
      {pushMessage && (
        <div className="p-4 rounded-2xl bg-indigo-600 text-white font-semibold text-sm shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5" />
            <span>{pushMessage}</span>
          </div>
        </div>
      )}

      {/* Header matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">In-app alerts, leave updates, and real-time push notifications</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
          {pushStatus === 'ENABLED' ? (
            <button className="group relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-3 sm:py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-50 overflow-hidden cursor-default">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
              <CheckCircle className="w-5 h-5 text-emerald-600 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
              <span className="relative z-10 text-[14px] tracking-wide whitespace-nowrap">Push Active</span>
            </button>
          ) : pushStatus === 'DENIED' ? (
            <button className="group relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-3 sm:py-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/60 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-50 overflow-hidden cursor-default">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-100/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
              <AlertCircle className="w-5 h-5 text-rose-600 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
              <span className="relative z-10 text-[14px] tracking-wide whitespace-nowrap">Push Blocked</span>
            </button>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={pushStatus === 'ENABLING'}
              className="group relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-3 sm:py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-purple-500/25 focus:outline-none focus:ring-4 focus:ring-purple-500/30 overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
              <BellRing className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
              <span className="relative z-10 text-[14px] tracking-wide whitespace-nowrap">
                {pushStatus === 'ENABLING' ? 'Enabling...' : 'Enable Push'}
              </span>
            </button>
          )}

          <button
            onClick={handleTestNotification}
            className="group relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-3 sm:py-2.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/60 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
            <Bell className="w-5 h-5 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
            <span className="relative z-10 text-[14px] tracking-wide whitespace-nowrap">Test Alert</span>
          </button>

          <button
            onClick={handleClearAll}
            className="group relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-3 sm:py-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/60 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-100/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
            <Trash2 className="w-5 h-5 text-rose-600 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
            <span className="relative z-10 text-[14px] tracking-wide whitespace-nowrap">Clear All</span>
          </button>
        </div>
      </div>

      {/* Notifications List matching Image 2 */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium animate-pulse">Loading notifications...</div>
        ) : notifications.length > 0 ? (
          notifications.map((n, idx) => {
            const titleLower = (n.title || '').toLowerCase();
            const msgLower = (n.message || '').toLowerCase();

            // Dynamic Palette & Icon Selection matching Image 2
            let palette = {
              leftBorder: 'border-l-[5px] border-l-purple-500',
              bellBg: 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300',
              dateColor: 'text-purple-600 dark:text-purple-400',
              rightIconBg: 'bg-purple-100/80 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300',
              rightIcon: FileText
            };

            if (titleLower.includes('approved') || titleLower.includes('final') || msgLower.includes('approved')) {
              palette = {
                leftBorder: 'border-l-[5px] border-l-emerald-500',
                bellBg: 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300',
                dateColor: 'text-emerald-600 dark:text-emerald-400',
                rightIconBg: 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300',
                rightIcon: ShieldCheck
              };
            } else if (titleLower.includes('hr') || titleLower.includes('manager') || msgLower.includes('manager')) {
              palette = {
                leftBorder: 'border-l-[5px] border-l-amber-500',
                bellBg: 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
                dateColor: 'text-amber-700 dark:text-amber-400',
                rightIconBg: 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
                rightIcon: Users
              };
            } else if (titleLower.includes('user') || titleLower.includes('employee') || msgLower.includes('employee')) {
              palette = {
                leftBorder: 'border-l-[5px] border-l-blue-500',
                bellBg: 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300',
                dateColor: 'text-blue-600 dark:text-blue-400',
                rightIconBg: 'bg-blue-100/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300',
                rightIcon: User
              };
            } else {
              // Fallback rotation palette matching Image 2
              const fallbackPalettes = [
                {
                  leftBorder: 'border-l-[5px] border-l-purple-500',
                  bellBg: 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300',
                  dateColor: 'text-purple-600 dark:text-purple-400',
                  rightIconBg: 'bg-purple-100/80 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300',
                  rightIcon: FileText
                },
                {
                  leftBorder: 'border-l-[5px] border-l-blue-500',
                  bellBg: 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300',
                  dateColor: 'text-blue-600 dark:text-blue-400',
                  rightIconBg: 'bg-blue-100/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300',
                  rightIcon: User
                },
                {
                  leftBorder: 'border-l-[5px] border-l-emerald-500',
                  bellBg: 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300',
                  dateColor: 'text-emerald-600 dark:text-emerald-400',
                  rightIconBg: 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300',
                  rightIcon: ShieldCheck
                },
                {
                  leftBorder: 'border-l-[5px] border-l-amber-500',
                  bellBg: 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
                  dateColor: 'text-amber-700 dark:text-amber-400',
                  rightIconBg: 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
                  rightIcon: Users
                }
              ];
              palette = fallbackPalettes[idx % fallbackPalettes.length];
            }

            const RightIcon = palette.rightIcon;

            return (
              <div
                key={n._id}
                className={`group relative bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800 ${palette.leftBorder} shadow-2xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
              >
                {/* Left Side: Bell Icon + Content */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className={`p-3 sm:p-3.5 rounded-2xl ${palette.bellBg} shrink-0 shadow-2xs`}>
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      {n.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <div className={`flex items-center gap-1.5 text-[11px] font-bold mt-2.5 ${palette.dateColor}`}>
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(n.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Category Circular Icon Badge matching Image 2 */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleDeleteNotification(n._id)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-900/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:opacity-100 shadow-sm"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${palette.rightIconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                    <RightIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <Bell className="w-10 h-10 mx-auto text-indigo-500/70 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">You have no active notifications at this time.</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Click 'Test Alert' or button below to send a real test notification to your account.</p>
            </div>
            <button
              onClick={handleTestNotification}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105"
            >
              <BellRing className="w-4 h-4" />
              <span>Send Test Notification</span>
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); fetchAndMarkNotifications(page - 1); }}
            disabled={page === 1}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center disabled:opacity-40 hover:bg-purple-600 hover:text-white transition-all shadow-2xs"
          >
            ‹
          </button>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages} <span className="text-slate-400 font-medium">({total} total)</span>
          </span>
          <button
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); fetchAndMarkNotifications(page + 1); }}
            disabled={page === totalPages}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center disabled:opacity-40 hover:bg-purple-600 hover:text-white transition-all shadow-2xs"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};


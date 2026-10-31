import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { ASSETS } from '../assets';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);

  // Scroll to top on every route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <div className="h-screen w-full max-w-full overflow-x-hidden overflow-y-hidden bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 xl:pl-72 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />

        {/* Page View Container with full application motion video background */}
        <main ref={mainRef} className="relative flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-h-0">
          {/* Global Background Motion Video (ezgif-512e6aff163f390f.mp4) across ALL modules & pages */}
          <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-75 dark:opacity-45"
            >
              <source src={ASSETS.bannerVideo} type="video/mp4" />
            </video>
            {/* Soft Glassmorphism Overlay Tint for Superb Readability & High Contrast */}
            <div className="absolute inset-0 bg-slate-50/75 dark:bg-slate-950/85 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-6 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar / Floating Speed Dial */}
      <MobileBottomNav onToggleSidebar={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />
    </div>
  );
};

import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { HRISProvider, useHRIS } from './context/HRISContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { GuruView } from './components/GuruView';
import { AdminView } from './components/AdminView';
import { KepsekView } from './components/KepsekView';
import { SessionTimeoutManager } from './components/SessionTimeoutManager';
import { LearningNeedManagement } from './components/LearningNeedManagement';
import { BadalManagement } from './components/BadalManagement';
import { GuruDeviceNotificationToast } from './components/GuruDeviceNotificationToast';

const MainContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, currentRole, currentPath, isLoading } = useHRIS();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Menyiapkan Data HRIS...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the clean login portal
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Dynamic router based on role and path matching user flow
  const renderDashboardByRole = () => {
    if (currentRole === 'GURU' || currentPath.startsWith('/dashboard/guru')) {
      if (currentPath === '/dashboard/guru/slip') {
        return <GuruView initialTab="slip_gaji" key="guru-slip" />;
      }
      if (currentPath === '/dashboard/guru/jadwal') {
        return <GuruView initialTab="jadwal" key="guru-jadwal" />;
      }
      if (currentPath === '/dashboard/guru/kebutuhan') {
        return <LearningNeedManagement key="guru-kebutuhan" />;
      }
      return <GuruView initialTab="clockin_journal" key="guru-clockin" />;
    }

    if (currentRole === 'ADMIN' || currentPath.startsWith('/dashboard/admin')) {
      if (currentPath === '/dashboard/admin/guru') {
        return <AdminView initialTab="guru_gaji" key="admin-guru" />;
      }
      if (currentPath === '/dashboard/admin/jadwal') {
        return <AdminView initialTab="master_jadwal" key="admin-jadwal" />;
      }
      if (currentPath === '/dashboard/admin/badal') {
        return <AdminView initialTab="guru_badal" key="admin-badal" />;
      }
      if (currentPath === '/dashboard/admin/payroll') {
        return <AdminView initialTab="generate_payroll" key="admin-payroll" />;
      }
      if (currentPath === '/dashboard/admin/audit') {
        return <AdminView initialTab="audit_logs" key="admin-audit" />;
      }
      if (currentPath === '/dashboard/admin/kebutuhan') {
        return <LearningNeedManagement key="admin-kebutuhan" />;
      }
      return <AdminView initialTab="dashboard" key="admin-dashboard" />;
    }

    if (currentRole === 'KEPALA_PESANTREN' || currentPath.startsWith('/dashboard/kepsek')) {
      if (currentPath === '/dashboard/kepsek/audit') {
        return <KepsekView initialTab="ketaatan_jurnal" key="kepsek-audit" />;
      }
      if (currentPath === '/dashboard/kepsek/badal') {
        return <BadalManagement key="kepsek-badal" />;
      }
      if (currentPath === '/dashboard/kepsek/kebutuhan') {
        return <LearningNeedManagement key="kepsek-kebutuhan" />;
      }
      return <KepsekView initialTab="ringkasan_kehadiran" key="kepsek-overview" />;
    }

    return <GuruView initialTab="clockin_journal" key="default-guru" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased transition-colors duration-300">
      {/* Sidebar & Topbar Shell */}
      <Header 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Real-time Guru Device Push Notification Floating Toast */}
      <GuruDeviceNotificationToast />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Spacer for Fixed Topbar */}
        <div className="h-16" />

        {/* Content Container */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-6 max-w-7xl w-full mx-auto space-y-5">
          {renderDashboardByRole()}
        </main>

        {/* Professional Institutional Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 py-4 text-xs text-slate-500 dark:text-slate-400 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                BQ
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Pesantren Baitul Qur'an Al-Ikhwan
              </span>
              <span className="text-slate-400 dark:text-slate-500 hidden md:inline">• HRIS & Kafa'ah Asatidz</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span>Tahun Ajaran 2026/2027</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Sistem Aktif</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <HRISProvider>
      <Toaster position="top-center" richColors />
      <SessionTimeoutManager />
      <MainContent />
    </HRISProvider>
  );
}

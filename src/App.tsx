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
import { CoreUIChartsView } from './components/pages/CoreUIChartsView';
import { Page404 } from './components/pages/Page404';
import { Page500 } from './components/pages/Page500';
import { isKepsekRole } from './types';

const MainContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarFolded, setSidebarFolded] = useState(false);
  const { isAuthenticated, currentRole, currentPath, isLoading } = useHRIS();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-slate-200 dark:border-slate-800 rounded-full"></div>
            <div className="w-12 h-12 border-t-2 border-indigo-600 dark:border-indigo-400 rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-slate-900 dark:text-slate-100 font-bold text-sm tracking-tight">Baitul Qur'an Al-Ikhwan</p>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-bold">HRIS & Kafa'ah System</p>
          </div>
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
    // CoreUI Showcase & Error Pages
    if (currentPath === '/dashboard/charts' || currentPath === '/pages/charts') {
      return <CoreUIChartsView key="coreui-charts" />;
    }
    if (currentPath === '/pages/404') {
      return <Page404 key="page-404" />;
    }
    if (currentPath === '/pages/500') {
      return <Page500 key="page-500" />;
    }

    if (currentRole === 'GURU' || currentPath.startsWith('/dashboard/guru')) {
      if (currentPath === '/dashboard/guru/slip') {
        return <GuruView initialTab="slip_gaji" key="guru-slip" />;
      }
      if (currentPath === '/dashboard/guru/jurnal') {
        return <GuruView initialTab="clockin_journal" key="guru-jurnal" />;
      }
      if (currentPath === '/dashboard/guru/materi') {
        return <GuruView initialTab="kelas_materi" key="guru-materi" />;
      }
      if (currentPath === '/dashboard/guru/penilaian') {
        return <GuruView initialTab="penilaian_tugas" key="guru-penilaian" />;
      }
      if (currentPath === '/dashboard/guru/analitik') {
        return <GuruView initialTab="presensi_analitik" key="guru-analitik" />;
      }
      if (currentPath === '/dashboard/guru/kebutuhan') {
        return <LearningNeedManagement key="guru-kebutuhan" />;
      }
      return <GuruView initialTab="overview" key="guru-overview" />;
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

    if (isKepsekRole(currentRole) || currentPath.startsWith('/dashboard/kepsek')) {
      if (currentPath === '/dashboard/kepsek/audit') {
        return <KepsekView initialTab="ketaatan_jurnal" key="kepsek-audit" />;
      }
      if (currentPath === '/dashboard/kepsek/badal') {
        return <BadalManagement key="kepsek-badal" />;
      }
      if (currentPath === '/dashboard/kepsek/kebutuhan') {
        return <LearningNeedManagement key="kepsek-kebutuhan" />;
      }
      if (currentPath === '/dashboard/kepsek' || currentPath === '/') {
        return <KepsekView initialTab="ringkasan_kehadiran" key="kepsek-overview" />;
      }
      return <Page404 key="page-404-fallback" />;
    }

    // Default route check
    if (currentPath === '/' || currentPath === '/dashboard') {
      return <GuruView initialTab="overview" key="default-guru" />;
    }

    // If path is unknown, show real 404 error page
    return <Page404 key="not-found-page" />;
  };

  return (
    <div className="min-h-screen bg-[#f3f6f4] dark:bg-[#09130f] text-slate-900 dark:text-slate-100 flex font-sans antialiased transition-colors duration-200">
      {/* Sidebar & Topbar Shell */}
      <Header 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarFolded={sidebarFolded}
        setSidebarFolded={setSidebarFolded}
      />

      {/* Real-time Guru Device Push Notification Floating Toast */}
      <GuruDeviceNotificationToast />

      {/* Main Workspace Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarFolded ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top Spacer for Fixed Header (h-16) */}
        <div className="h-16" />

        {/* Content Container */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-6 max-w-7xl w-full mx-auto space-y-5">
          {renderDashboardByRole()}
        </main>

        {/* Institutional Footer */}
        <footer className="bg-white dark:bg-[#0d1a15] border-t border-slate-200/80 dark:border-emerald-950/60 py-3.5 text-xs text-slate-500 dark:text-slate-400 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-emerald-100">Baitul Qur'an Al-Ikhwan</span>
              <span className="text-slate-300 dark:text-emerald-800">•</span>
              <span className="text-slate-500 dark:text-emerald-400/80 hidden md:inline">HRIS & Kafa'ah Asatidz</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 dark:text-emerald-400/60 text-[11px]">
              <span>Tahun Ajaran 2026/2027</span>
              <span>•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Sistem Aktif</span>
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

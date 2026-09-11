import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { motion } from 'motion/react';
import { HRISProvider, useHRIS } from './context/HRISContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { GuruView } from './components/GuruView';
import { AdminView } from './components/AdminView';
import { KepsekView } from './components/KepsekView';
import { StaffView } from './components/StaffView';
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
      <div className="min-h-screen bg-gradient-to-br from-[#065f46] via-[#044e3a] to-[#0f1713] flex items-center justify-center font-sans antialiased bqa-bg-pattern">
        <div className="flex flex-col items-center gap-5 relative z-10 animate-fade-up">
          <div className="relative">
            <div className="w-14 h-14 border-2 border-emerald-800/50 rounded-full"></div>
            <div className="w-14 h-14 border-t-2 border-amber-400 rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-arabic text-amber-300 text-sm tracking-widest drop-shadow-xs">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-emerald-100 font-display font-bold text-sm tracking-tight">Baitul Qur'an Al-Ikhwan</p>
            <p className="text-amber-300/80 text-[10px] uppercase tracking-widest font-bold">HRIS & Kafa'ah Asatidz</p>
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
      if (currentPath === '/dashboard/guru/kebutuhan') {
        return <LearningNeedManagement key="guru-kebutuhan" />;
      }
      if (currentPath === '/dashboard/guru/akademik') {
        return <GuruView initialTab="akademik" key="guru-akademik" />;
      }
      if (currentPath === '/dashboard/guru/catatan') {
        return <GuruView initialTab="buku_penghubung" key="guru-catatan" />;
      }
      return <GuruView initialTab="clockin_journal" key="guru-jurnal" />;
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
      if (currentPath === '/dashboard/admin/tahfidz-payroll') {
        return <AdminView initialTab="tahfidz_payroll" key="admin-tahfidz-payroll" />;
      }
      if (currentPath === '/dashboard/admin/laporan-staff') {
        return <AdminView initialTab="laporan_staff" key="admin-laporan-staff" />;
      }
      if (currentPath === '/dashboard/admin/audit') {
        return <AdminView initialTab="audit_logs" key="admin-audit" />;
      }
      if (currentPath === '/dashboard/admin/kebutuhan') {
        return <LearningNeedManagement key="admin-kebutuhan" />;
      }
      if (currentPath === '/dashboard/admin/settings' || currentPath === '/dashboard/admin/lokasi') {
        return <AdminView initialTab="settings_lokasi" key="admin-settings" />;
      }
      if (currentPath === '/dashboard/admin/santri') {
        return <AdminView initialTab="master_santri" key="admin-santri" />;
      }
      if (currentPath === '/dashboard/admin/wali') {
        return <AdminView initialTab="master_wali_santri" key="admin-wali" />;
      }
      if (currentPath === '/dashboard/admin/keuangan') {
        return <AdminView initialTab="verifikasi_keuangan" key="admin-keuangan" />;
      }
      if (currentPath === '/dashboard/admin/catatan') {
        return <AdminView initialTab="buku_penghubung" key="admin-catatan" />;
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

    if (currentRole === 'STAFF' || currentPath.startsWith('/dashboard/staff')) {
      if (currentPath === '/dashboard/staff/laporan') {
        return <StaffView initialTab="laporan" key="staff-laporan" />;
      }
      return <StaffView initialTab="presensi" key="staff-presensi" />;
    }

    // Default route check
    if (currentPath === '/' || currentPath === '/dashboard') {
      return <GuruView initialTab="clockin_journal" key="default-guru" />;
    }

    // If path is unknown, show real 404 error page
    return <Page404 key="not-found-page" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065f46] via-[#044e3a] to-[#0f1713] dark:from-[#092e22] dark:via-[#09221a] dark:to-[#09110d] bqa-bg-pattern text-slate-100 flex font-sans antialiased transition-colors duration-200">
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
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderDashboardByRole()}
          </motion.div>
        </main>

        {/* Institutional Footer */}
        <footer className="bg-white dark:bg-[#0d1a15] border-t border-[#e2e8f0] dark:border-emerald-950/60 py-3.5 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-display font-semibold text-[#1e293b] dark:text-emerald-100">Baitul Qur'an Al-Ikhwan</span>
              <span className="text-[#e2e8f0] dark:text-emerald-800">•</span>
              <span className="text-[#64748b] dark:text-emerald-400/80 hidden md:inline">HRIS & Kafa'ah Asatidz</span>
            </div>

            <div className="flex items-center gap-2 text-[#94a3b8] dark:text-emerald-400/60 text-[11px]">
              <span>Tahun Ajaran 2026/2027</span>
              <span>•</span>
              <span className="text-[#059669] dark:text-emerald-400 font-semibold">Sistem Aktif</span>
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

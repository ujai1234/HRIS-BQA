import React, { useState } from 'react';
import { HRISProvider, useHRIS } from './context/HRISContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { GuruView } from './components/GuruView';
import { AdminView } from './components/AdminView';
import { KepsekView } from './components/KepsekView';

const MainContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, currentRole, currentPath } = useHRIS();

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
      return <GuruView initialTab="clockin_journal" key="guru-clockin" />;
    }

    if (currentRole === 'ADMIN' || currentPath.startsWith('/dashboard/admin')) {
      if (currentPath === '/dashboard/admin/jadwal') {
        return <AdminView initialTab="master_jadwal" key="admin-jadwal" />;
      }
      if (currentPath === '/dashboard/admin/badal') {
        return <AdminView initialTab="guru_badal" key="admin-badal" />;
      }
      if (currentPath === '/dashboard/admin/payroll') {
        return <AdminView initialTab="generate_payroll" key="admin-payroll" />;
      }
      return <AdminView initialTab="guru_gaji" key="admin-guru" />;
    }

    if (currentRole === 'KEPALA_PESANTREN' || currentPath.startsWith('/dashboard/kepsek')) {
      if (currentPath === '/dashboard/kepsek/audit') {
        return <KepsekView initialTab="ketaatan_jurnal" key="kepsek-audit" />;
      }
      if (currentPath === '/dashboard/kepsek/laporan') {
        return <KepsekView initialTab="laporan_payroll" key="kepsek-laporan" />;
      }
      return <KepsekView initialTab="ringkasan_kehadiran" key="kepsek-overview" />;
    }

    return <GuruView initialTab="clockin_journal" key="default-guru" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar & Topbar Shell */}
      <Header 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Spacer for Fixed Topbar */}
        <div className="h-16" />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {renderDashboardByRole()}
        </main>

        {/* Professional Institutional Footer */}
        <footer className="bg-white border-t border-slate-200 py-5 text-xs text-slate-500 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                BQ
              </div>
              <span className="font-semibold text-slate-700">
                Pesantren Baitul Qur'an Al-Ikhwan
              </span>
              <span className="text-slate-400 hidden md:inline">• Sistem HRIS & Penggajian Guru</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span>Tahun Ajaran 2026/2027</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Sistem Aktif & Terverifikasi</span>
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
      <MainContent />
    </HRISProvider>
  );
}

import React, { useState } from 'react';
import { HRISProvider, useHRIS } from './context/HRISContext';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PayrollRecap } from './components/PayrollRecap';
import { SlipGajiView } from './components/SlipGajiView';
import { BadalManagement } from './components/BadalManagement';
import { MasterTeachers } from './components/MasterTeachers';
import { MasterSchedules } from './components/MasterSchedules';
import { KepsekAuditView } from './components/KepsekAuditView';
import { Building2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentRole } = useHRIS();

  // Route renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview setActiveTab={setActiveTab} />;
      case 'teacher_workbench':
        return <TeacherDashboard />;
      case 'payroll':
        return <PayrollRecap />;
      case 'slip_gaji':
        return <SlipGajiView />;
      case 'badal':
        return <BadalManagement />;
      case 'master_teachers':
        return <MasterTeachers />;
      case 'master_schedules':
        return <MasterSchedules />;
      case 'kepsek_audit':
        return <KepsekAuditView />;
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar & Topbar Shell */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Spacer for Fixed Topbar */}
        <div className="h-16" />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {renderTabContent()}
        </main>

        {/* Professional Footer */}
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


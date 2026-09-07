import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHRIS } from '../context/HRISContext';
import { AdminDashboard } from './AdminDashboard';
import { MasterTeachers } from './MasterTeachers';
import { MasterSchedules } from './MasterSchedules';
import { BadalManagement } from './BadalManagement';
import { PayrollRecap } from './PayrollRecap';
import { AdminSettingsView } from './AdminSettingsView';
import { TahfidzPayrollView } from './TahfidzPayrollView';
import { AdminStaffReportView } from './AdminStaffReportView';
import { MasterStudents } from './MasterStudents';
import { MasterParents } from './MasterParents';
import { AdminFinance } from './AdminFinance';

export type AdminTabType = 'dashboard' | 'guru_gaji' | 'master_jadwal' | 'guru_badal' | 'generate_payroll' | 'tahfidz_payroll' | 'laporan_staff' | 'settings_lokasi' | 'master_santri' | 'master_wali_santri' | 'verifikasi_keuangan';

interface AdminViewProps {
  initialTab?: AdminTabType;
}

export const AdminView: React.FC<AdminViewProps> = ({ initialTab = 'dashboard' }) => {
  const { setCurrentPath } = useHRIS();
  const [activeSubTab, setActiveSubTab] = useState<AdminTabType>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: AdminTabType) => {
    setActiveSubTab(tab);
    if (tab === 'dashboard') setCurrentPath('/dashboard/admin');
    else if (tab === 'guru_gaji') setCurrentPath('/dashboard/admin/guru');
    else if (tab === 'master_jadwal') setCurrentPath('/dashboard/admin/jadwal');
    else if (tab === 'guru_badal') setCurrentPath('/dashboard/admin/badal');
    else if (tab === 'generate_payroll') setCurrentPath('/dashboard/admin/payroll');
    else if (tab === 'tahfidz_payroll') setCurrentPath('/dashboard/admin/tahfidz-payroll');
    else if (tab === 'laporan_staff') setCurrentPath('/dashboard/admin/laporan-staff');
    else if (tab === 'settings_lokasi') setCurrentPath('/dashboard/admin/settings');
    else if (tab === 'master_santri') setCurrentPath('/dashboard/admin/santri');
    else if (tab === 'master_wali_santri') setCurrentPath('/dashboard/admin/wali');
    else if (tab === 'verifikasi_keuangan') setCurrentPath('/dashboard/admin/keuangan');
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Render Selected SubTab */}
          {activeSubTab === 'dashboard' && <AdminDashboard onNavigateTab={handleTabChange} />}
          {activeSubTab === 'guru_gaji' && <MasterTeachers />}
          {activeSubTab === 'master_jadwal' && <MasterSchedules />}
          {activeSubTab === 'guru_badal' && <BadalManagement />}
          {activeSubTab === 'generate_payroll' && <PayrollRecap />}
          {activeSubTab === 'tahfidz_payroll' && <TahfidzPayrollView />}
          {activeSubTab === 'laporan_staff' && <AdminStaffReportView />}
          {activeSubTab === 'settings_lokasi' && <AdminSettingsView />}
          {activeSubTab === 'master_santri' && <MasterStudents />}
          {activeSubTab === 'master_wali_santri' && <MasterParents />}
          {activeSubTab === 'verifikasi_keuangan' && <AdminFinance />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

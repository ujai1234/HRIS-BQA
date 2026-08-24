import React, { useState, useEffect } from 'react';
import { useHRIS } from '../context/HRISContext';
import { AdminDashboard } from './AdminDashboard';
import { MasterTeachers } from './MasterTeachers';
import { MasterSchedules } from './MasterSchedules';
import { BadalManagement } from './BadalManagement';
import { PayrollRecap } from './PayrollRecap';
import { AuditLogView } from './AuditLogView';

export type AdminTabType = 'dashboard' | 'guru_gaji' | 'master_jadwal' | 'guru_badal' | 'generate_payroll' | 'audit_logs';

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
    else if (tab === 'audit_logs') setCurrentPath('/dashboard/admin/audit');
  };

  return (
    <div className="space-y-4">
      {/* Render Selected SubTab */}
      {activeSubTab === 'dashboard' && <AdminDashboard onNavigateTab={handleTabChange} />}
      {activeSubTab === 'guru_gaji' && <MasterTeachers />}
      {activeSubTab === 'master_jadwal' && <MasterSchedules />}
      {activeSubTab === 'guru_badal' && <BadalManagement />}
      {activeSubTab === 'generate_payroll' && <PayrollRecap />}
      {activeSubTab === 'audit_logs' && <AuditLogView />}
    </div>
  );
};


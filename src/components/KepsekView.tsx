import React, { useState } from 'react';
import { 
  GraduationCap, 
  BarChart3, 
  CheckCircle2, 
  CreditCard, 
  FileCheck2, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  Printer
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { DashboardOverview } from './DashboardOverview';
import { KepsekAuditView } from './KepsekAuditView';
import { PayrollRecap } from './PayrollRecap';
import { formatRupiah } from '../utils/formatters';

interface KepsekViewProps {
  initialTab?: 'ringkasan_kehadiran' | 'ketaatan_jurnal' | 'laporan_payroll';
}

export const KepsekView: React.FC<KepsekViewProps> = ({ initialTab = 'ringkasan_kehadiran' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ringkasan_kehadiran' | 'ketaatan_jurnal' | 'laporan_payroll'>(initialTab);

  return (
    <div className="space-y-6">
      {/* Render Selected SubTab */}
      {activeSubTab === 'ringkasan_kehadiran' && (
        <DashboardOverview isReadOnly={true} setActiveTab={(tab) => {
          if (tab === 'kepsek_audit') setActiveSubTab('ketaatan_jurnal');
          else if (tab === 'payroll') setActiveSubTab('laporan_payroll');
        }} />
      )}
      {activeSubTab === 'ketaatan_jurnal' && <KepsekAuditView />}
      {activeSubTab === 'laporan_payroll' && <PayrollRecap />}
    </div>
  );
};

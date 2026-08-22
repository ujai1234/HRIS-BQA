import React, { useState } from 'react';
import { 
  Users, 
  CalendarDays, 
  UserCheck, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  FileSpreadsheet, 
  PlusCircle, 
  Clock, 
  Layers
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { MasterTeachers } from './MasterTeachers';
import { MasterSchedules } from './MasterSchedules';
import { BadalManagement } from './BadalManagement';
import { PayrollRecap } from './PayrollRecap';

interface AdminViewProps {
  initialTab?: 'guru_gaji' | 'master_jadwal' | 'guru_badal' | 'generate_payroll';
}

export const AdminView: React.FC<AdminViewProps> = ({ initialTab = 'guru_gaji' }) => {
  const { teachers, schedules, badalAssignments, selectedPeriod, calculateAllPayroll } = useHRIS();
  const [activeSubTab, setActiveSubTab] = useState<'guru_gaji' | 'master_jadwal' | 'guru_badal' | 'generate_payroll'>(initialTab);

  const payrollSummary = calculateAllPayroll(selectedPeriod);

  return (
    <div className="space-y-6">
      {/* Admin Flow Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-md border border-blue-400/30 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Portal Administrator & Tata Usaha
              </h2>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto text-xs">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Asatidz</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{teachers.length} Guru</span>
              <span className="text-[10px] text-blue-400">SMP, MA & Pesantren</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Jadwal</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{schedules.length} Sesi</span>
              <span className="text-[10px] text-slate-400">
                {schedules.reduce((acc, s) => acc + s.hours, 0)} JP / pekan
              </span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tugas Badal</span>
              <span className="text-lg font-bold text-purple-400 mt-0.5 block">{badalAssignments.length} Sesi</span>
              <span className="text-[10px] text-slate-400">Pergantian Guru</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Payroll</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">23 Guru</span>
              <span className="text-[10px] text-slate-400">Periode {selectedPeriod}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render Selected SubTab */}
      {activeSubTab === 'guru_gaji' && <MasterTeachers />}
      {activeSubTab === 'master_jadwal' && <MasterSchedules />}
      {activeSubTab === 'guru_badal' && <BadalManagement />}
      {activeSubTab === 'generate_payroll' && <PayrollRecap />}
    </div>
  );
};

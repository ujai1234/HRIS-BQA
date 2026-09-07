import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHRIS } from '../context/HRISContext';
import { InventoryModule } from './StaffModules/InventoryModule';
import { KitchenModule } from './StaffModules/KitchenModule';
import { StaffJournalForm } from './StaffModules/StaffJournalForm';
import { StaffExpenseForm } from './StaffModules/StaffExpenseForm';
import { Utensils, Wrench, Receipt, AlertCircle } from 'lucide-react';

interface StaffViewProps {
  initialTab?: 'presensi' | 'laporan';
}

export const StaffView: React.FC<StaffViewProps> = ({ initialTab = 'presensi' }) => {
  const { currentUser, currentPath } = useHRIS();
  const isDapur = currentUser?.position === 'Staff Dapur';
  const isSarpras = currentUser?.position === 'Staff Inventaris';
  const category = isDapur ? 'DAPUR' : 'SARPRAS';

  const activeTab = initialTab || (currentPath === '/dashboard/staff/laporan' ? 'laporan' : 'presensi');

  return (
    <div className="space-y-5">
      {/* Compact Clean Header Bar (No bloated greetings/subtitles) */}
      <div className="bg-white dark:bg-[#121f1a] p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-emerald-900/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#065f46] dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
            {activeTab === 'presensi' ? (
              isDapur ? <Utensils className="w-5 h-5" /> : <Wrench className="w-5 h-5" />
            ) : (
              <Receipt className="w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-emerald-50 tracking-tight">
              {activeTab === 'presensi' 
                ? (isDapur ? 'Presensi & Menu Dapur' : isSarpras ? 'Presensi & Perbaikan Sarpras' : 'Presensi & Operasional Staff')
                : (isDapur ? 'Jurnal Kerja & Belanja Dapur' : isSarpras ? 'Jurnal Kerja & Belanja Sarpras' : 'Jurnal Kerja & Pengajuan Belanja')}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-emerald-400/70">
              <span className="font-semibold text-slate-700 dark:text-emerald-200">{currentUser?.name}</span>
              <span>•</span>
              <span>{currentUser?.position || 'Staff'}</span>
              <span>•</span>
              <span className="font-mono text-[11px]">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
            {currentUser?.unit || 'PESANTREN'}
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${currentUser?.position}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'presensi' ? (
            isDapur ? (
              <KitchenModule showJournalAndExpense={false} />
            ) : isSarpras ? (
              <InventoryModule showJournalAndExpense={false} />
            ) : (
              <div className="p-8 text-center bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200 dark:border-emerald-900/40">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-emerald-400/60">Posisi staff belum dikonfigurasi.</p>
              </div>
            )
          ) : (
            <div className="space-y-5">
              <StaffJournalForm category={category} />
              <StaffExpenseForm category={category} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

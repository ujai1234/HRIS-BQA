import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHRIS } from '../context/HRISContext';
import { InventoryModule } from './StaffModules/InventoryModule';
import { KitchenModule } from './StaffModules/KitchenModule';
import { StaffJournalForm } from './StaffModules/StaffJournalForm';
import { StaffExpenseForm } from './StaffModules/StaffExpenseForm';
import { 
  Utensils, 
  Wrench, 
  Receipt, 
  AlertCircle, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  Check, 
  Play, 
  Send 
} from 'lucide-react';
import { toast } from 'sonner';

interface StaffViewProps {
  initialTab?: 'presensi' | 'laporan';
}

export const StaffView: React.FC<StaffViewProps> = ({ initialTab = 'presensi' }) => {
  const { 
    currentUser, 
    currentPath, 
    staffAssignments, 
    updateStaffAssignmentStatus 
  } = useHRIS();

  const isDapur = currentUser?.position === 'Staff Dapur' || currentUser?.position?.toLowerCase().includes('dapur');
  const isSarpras = currentUser?.position === 'Staff Inventaris' || currentUser?.position === 'Staff Sarpras' || currentUser?.position?.toLowerCase().includes('sarpras') || currentUser?.position?.toLowerCase().includes('inventaris');
  const category = isDapur ? 'DAPUR' : 'SARPRAS';

  const activeTab = initialTab || (currentPath === '/dashboard/staff/laporan' ? 'laporan' : 'presensi');

  // Filter tugas yang ditujukan khusus untuk staf ini atau kategorinya
  const myTasks = (staffAssignments || []).filter(t => 
    t.staffId === currentUser?.id || 
    (t.category === category && (!t.staffId || t.staffName?.toLowerCase().includes(currentUser?.name?.toLowerCase() || 'xyz')))
  );

  const pendingTasksCount = myTasks.filter(t => t.status !== 'COMPLETED').length;

  const [activeTaskCompletionId, setActiveTaskCompletionId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  const handleStartTask = async (taskId: string) => {
    await updateStaffAssignmentStatus(taskId, 'IN_PROGRESS');
  };

  const handleFinishTask = async (taskId: string) => {
    await updateStaffAssignmentStatus(taskId, 'COMPLETED', completionNotes.trim() || 'Telah diselesaikan oleh staf.');
    setActiveTaskCompletionId(null);
    setCompletionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Compact Clean Header Bar */}
      <div className="bg-white dark:bg-[#0B2B26] p-4 sm:p-5 rounded-[16px] border border-slate-200/90 dark:border-[#163832] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-emerald-50 dark:bg-[#163832] text-[#065f46] dark:text-[#8EB69B] flex items-center justify-center border border-emerald-200/60 dark:border-[#0B2B26] shrink-0">
            {activeTab === 'presensi' ? (
              isDapur ? <Utensils className="w-5 h-5" /> : <Wrench className="w-5 h-5" />
            ) : (
              <Receipt className="w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#DAF1DE] tracking-tight">
              {activeTab === 'presensi' 
                ? (isDapur ? 'Presensi & Menu Dapur' : isSarpras ? 'Presensi & Perbaikan Sarpras' : 'Presensi & Operasional Staff')
                : (isDapur ? 'Jurnal Kerja & Belanja Dapur' : isSarpras ? 'Jurnal Kerja & Belanja Sarpras' : 'Jurnal Kerja & Pengajuan Belanja')}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-[#8EB69B]">
              <span className="font-semibold text-slate-700 dark:text-[#DAF1DE]">{currentUser?.name}</span>
              <span>•</span>
              <span>{currentUser?.position || 'Staff'}</span>
              <span>•</span>
              <span className="font-mono text-[11px]">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {pendingTasksCount > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5 text-amber-600" /> {pendingTasksCount} Tugas Ketua Sarpras
            </span>
          )}
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-[8px] bg-emerald-50 dark:bg-[#163832] text-emerald-800 dark:text-[#8EB69B] border border-emerald-200/60 dark:border-[#0B2B26]">
            {currentUser?.unit || 'PESANTREN'}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION KHUSUS: DAFTAR TUGAS LANGSUNG DARI KETUA SARPRAS  */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#0B2B26] p-5 rounded-[16px] border border-slate-200/90 dark:border-[#163832] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#163832]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-[#163832] text-indigo-600 dark:text-[#8EB69B] flex items-center justify-center border border-indigo-200/60 dark:border-[#0B2B26]">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#DAF1DE]">
                Instruksi &amp; Tugas dari Ketua Sarpras
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">
                Kerjaan yang ditugaskan langsung oleh pimpinan sarpras untuk Anda
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold text-[#163832] dark:text-[#8EB69B]">
            {myTasks.length} Tugas Terdata
          </span>
        </div>

        {myTasks.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-[#8EB69B] italic font-semibold text-xs bg-slate-50 dark:bg-[#163832]/30 rounded-xl border border-slate-200/60 dark:border-[#163832]">
            Alhamdulillah, belum ada tugas khusus yang didelegasikan dari Ketua Sarpras saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {myTasks.map(task => (
              <div 
                key={task.id}
                className="bg-slate-50/70 dark:bg-[#163832]/50 border border-slate-200 dark:border-[#163832] p-4 rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700 font-extrabold' :
                        task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status === 'COMPLETED' ? '✓ Selesai' : task.status === 'IN_PROGRESS' ? '⚙ Sedang Dikerjakan' : '⌛ Menunggu'}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] font-mono">
                      Tenggat: {task.dueDate || '-'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-[#DAF1DE]">
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-[#DAF1DE] bg-white dark:bg-[#0B2B26] p-2.5 rounded-lg border border-slate-200/60 dark:border-[#0B2B26] leading-relaxed">
                    {task.description}
                  </p>

                  <div className="text-[10px] text-slate-500 dark:text-[#8EB69B] flex items-center justify-between">
                    <span>Dari: <strong>{task.assignedBy || 'Ketua Sarpras'}</strong></span>
                    <span>Tgl: {task.assignedDate}</span>
                  </div>

                  {task.completionNotes && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg text-[11px] text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40">
                      <strong>Laporan Anda:</strong> {task.completionNotes}
                    </div>
                  )}
                </div>

                {/* Tombol Tindakan Staf */}
                {task.status !== 'COMPLETED' && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-[#163832] space-y-2">
                    {activeTaskCompletionId === task.id ? (
                      <div className="space-y-2 bg-white dark:bg-[#0B2B26] p-2.5 rounded-lg border border-slate-200">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase">
                          Catatan Hasil Pengerjaan:
                        </label>
                        <input
                          type="text"
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          placeholder="Contoh: Sudah selesai diperbaiki dan ditest lancar"
                          className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setActiveTaskCompletionId(null)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleFinishTask(task.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Konfirmasi Selesai
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {task.status === 'PENDING' && (
                          <button
                            onClick={() => handleStartTask(task.id)}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" /> Mulai Kerjakan
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveTaskCompletionId(task.id);
                            setCompletionNotes('');
                          }}
                          className="flex-1 py-1.5 bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Selesai
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
              <div className="p-8 text-center bg-white dark:bg-[#0B2B26] rounded-[16px] border border-slate-200 dark:border-[#163832]">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-[#8EB69B]">Posisi staff belum dikonfigurasi.</p>
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


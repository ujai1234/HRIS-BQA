import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { PenTool, Plus, BookOpen, Clock, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

interface StaffJournalFormProps {
  category: 'SARPRAS' | 'DAPUR';
}

export const StaffJournalForm: React.FC<StaffJournalFormProps> = ({ category }) => {
  const { currentUser, staffJournals, addStaffJournal } = useHRIS();
  
  const [taskToday, setTaskToday] = useState('');
  const [taskTomorrow, setTaskTomorrow] = useState('');
  
  // Filter journals for today and current user
  const todayJournals = staffJournals.filter(
    j => j.staffId === currentUser?.id && j.date === new Date().toISOString().split('T')[0] && j.category === category
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToday.trim() || !taskTomorrow.trim()) {
      toast.error('Mohon lengkapi laporan hari ini dan rencana besok');
      return;
    }

    if (currentUser) {
      addStaffJournal({
        date: new Date().toISOString().split('T')[0],
        category,
        taskToday,
        taskTomorrow,
        staffId: currentUser.id,
        staffName: currentUser.name,
      });
      
      toast.success('Jurnal harian berhasil dicatat');
      setTaskToday('');
      setTaskTomorrow('');
    }
  };

  return (
    <div className="bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200/80 dark:border-emerald-900/40 shadow-xs p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/40 shrink-0">
          <PenTool className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-emerald-50 text-sm">Jurnal Pekerjaan Harian</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Jurnal */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {category === 'DAPUR' ? 'Menu / Pekerjaan Hari Ini' : 'Pekerjaan Hari Ini'}
              </label>
              <textarea
                value={taskToday}
                onChange={(e) => setTaskToday(e.target.value)}
                placeholder={category === 'DAPUR' ? "Contoh: Masak nasi 10kg, Sayur sop, Ayam goreng" : "Contoh: Perbaikan AC kelas 7A, ganti lampu asrama"}
                className="w-full bg-slate-50 dark:bg-[#111a16] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-slate-200 min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {category === 'DAPUR' ? 'Rencana Menu / Pekerjaan Besok' : 'Rencana Pekerjaan Besok'}
              </label>
              <textarea
                value={taskTomorrow}
                onChange={(e) => setTaskTomorrow(e.target.value)}
                placeholder={category === 'DAPUR' ? "Contoh: Menu besok: Nasi uduk, Telur balado" : "Contoh: Pengecatan pagar depan, Cek air tandon"}
                className="w-full bg-slate-50 dark:bg-[#111a16] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-slate-200 min-h-[80px]"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Simpan Jurnal
            </button>
          </form>
        </div>

        {/* Riwayat Hari Ini */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-emerald-900/30 pb-2">
            Riwayat Jurnal Hari Ini
          </h4>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {todayJournals.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4 italic">Belum ada jurnal hari ini</p>
            ) : (
              todayJournals.map(journal => (
                <div key={journal.id} className="bg-slate-50 dark:bg-[#111a16] p-4 rounded-xl border border-slate-100 dark:border-emerald-900/30 space-y-3">
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <ListChecks className="w-3.5 h-3.5 text-blue-500" /> Hari Ini:
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-[#16201b] p-2 rounded-lg border border-slate-100 dark:border-emerald-950/60">
                      {journal.taskToday}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Rencana Besok:
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-[#16201b] p-2 rounded-lg border border-slate-100 dark:border-emerald-950/60">
                      {journal.taskTomorrow}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

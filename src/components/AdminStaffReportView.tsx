import React, { useState } from 'react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah } from '../utils/formatters';
import { Receipt, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const AdminStaffReportView: React.FC = () => {
  const { expenses, updateExpenseStatus, staffJournals, attendances, teachers } = useHRIS();
  
  const [activeTab, setActiveTab] = useState<'BELANJA' | 'JURNAL'>('BELANJA');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'DAPUR' | 'SARPRAS'>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];
  const staffMembers = teachers.filter(t => t.role === 'STAFF');
  const staffAttendances = attendances.filter(a => a.date === todayStr && staffMembers.some(sm => sm.id === a.teacherId));

  const filteredExpenses = (expenses || [])
    .filter(e => filterCategory === 'ALL' || e.category === filterCategory)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStatusUpdate = (id: string, status: 'APPROVED' | 'REJECTED') => {
    updateExpenseStatus(id, status);
    toast.success(`Status belanja berhasil diubah menjadi ${status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-emerald-900/40 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Laporan Staff Non-Akademik</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitoring pengajuan belanja dapur dan inventaris</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 dark:bg-[#111a16] rounded-xl border border-slate-200/50 dark:border-emerald-950/60">
          <button
            onClick={() => setActiveTab('BELANJA')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'BELANJA'
                ? 'bg-white dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Pengajuan Belanja
          </button>
          <button
            onClick={() => setActiveTab('JURNAL')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'JURNAL'
                ? 'bg-white dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Jurnal & Kehadiran
          </button>
        </div>
      </div>

      {activeTab === 'BELANJA' && (
        <div className="bg-white dark:bg-[#16201b] rounded-2xl border border-slate-200/80 dark:border-emerald-950/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-emerald-900/30 flex justify-between items-center bg-slate-50/50 dark:bg-[#111a16]">
            <div className="flex gap-2">
              {(['ALL', 'DAPUR', 'SARPRAS'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                    filterCategory === cat
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-white dark:bg-[#16201b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-emerald-900/40 hover:bg-slate-50 dark:hover:bg-[#1a251f]'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#111a16] text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-emerald-900/30">
                  <th className="py-3 px-4 font-medium">Tanggal</th>
                  <th className="py-3 px-4 font-medium">Pengaju</th>
                  <th className="py-3 px-4 font-medium">Kategori</th>
                  <th className="py-3 px-4 font-medium text-right">Nominal</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/40">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                      Belum ada data pengajuan belanja
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-[#111a16]/50 transition-colors">
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {expense.date}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-200">
                        {expense.reporterName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          expense.category === 'DAPUR' 
                            ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                            : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(expense.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          expense.status === 'PENDING' ? 'text-amber-600 bg-amber-50 dark:text-amber-500 dark:bg-amber-900/30' :
                          expense.status === 'APPROVED' ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-500 dark:bg-emerald-900/30' :
                          'text-rose-600 bg-rose-50 dark:text-rose-500 dark:bg-rose-900/30'
                        }`}>
                          {expense.status === 'PENDING' ? <Clock className="w-3 h-3" /> : expense.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {expense.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {expense.status === 'PENDING' && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(expense.id, 'APPROVED')}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded transition-colors"
                              title="Setujui"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(expense.id, 'REJECTED')}
                              className="p-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded transition-colors"
                              title="Tolak"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'JURNAL' && (
        <div className="bg-white dark:bg-[#16201b] rounded-2xl border border-slate-200/80 dark:border-emerald-950/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-emerald-900/30 flex justify-between items-center bg-slate-50/50 dark:bg-[#111a16]">
            <div className="flex gap-2">
              {(['ALL', 'DAPUR', 'SARPRAS'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                    filterCategory === cat
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-white dark:bg-[#16201b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-emerald-900/40 hover:bg-slate-50 dark:hover:bg-[#1a251f]'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-emerald-900/30">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Kehadiran Staff Hari Ini
            </h3>
            {staffAttendances.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Belum ada staff yang absen masuk hari ini.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {staffAttendances.map(att => {
                  const staff = teachers.find(t => t.id === att.teacherId);
                  return (
                    <div key={att.id} className="flex items-center gap-2 bg-slate-50 dark:bg-[#111a16] border border-slate-200/60 dark:border-emerald-950/40 px-3 py-2 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${att.status === 'SELESAI' || att.status.includes('HADIR') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{staff?.name}</p>
                        <p className="text-xs text-slate-500 font-mono">Clock In: {att.clockInTime || '-'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            {(staffJournals || []).filter(j => filterCategory === 'ALL' || j.category === filterCategory).length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                Belum ada data jurnal pekerjaan
              </div>
            ) : (
              (staffJournals || [])
                .filter(j => filterCategory === 'ALL' || j.category === filterCategory)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(journal => (
                  <div key={journal.id} className="bg-slate-50 dark:bg-[#111a16] border border-slate-200/60 dark:border-emerald-950/40 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{journal.staffName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{journal.date}</p>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${
                        journal.category === 'DAPUR' 
                          ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                          : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {journal.category}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Dikerjakan Hari Ini
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-[#16201b] p-2.5 rounded-lg border border-slate-100 dark:border-emerald-900/20 leading-relaxed">
                          {journal.taskToday}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" /> Rencana Besok
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-[#16201b] p-2.5 rounded-lg border border-slate-100 dark:border-emerald-900/20 leading-relaxed">
                          {journal.taskTomorrow}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

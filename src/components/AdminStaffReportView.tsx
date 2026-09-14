import React, { useState } from 'react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah } from '../utils/formatters';
import { Receipt, CheckCircle, XCircle, Clock, Search, Filter, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

export const AdminStaffReportView: React.FC = () => {
  const { expenses, updateExpenseStatus, staffJournals, attendances, teachers } = useHRIS();
  
  const [activeTab, setActiveTab] = useState<'BELANJA' | 'JURNAL'>('BELANJA');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'DAPUR' | 'SARPRAS'>('ALL');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[16px] border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#051F20] tracking-tight">Laporan Staff Non-Akademik</h2>
          <p className="text-xs font-semibold text-[#8EB69B] mt-0.5">Monitoring pengajuan belanja dapur dan inventaris</p>
        </div>
        
        <div className="flex p-1 bg-slate-50 rounded-[12px] border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('BELANJA')}
            className={`px-4 py-2 text-xs font-bold rounded-[8px] transition-all uppercase tracking-wider cursor-pointer ${
              activeTab === 'BELANJA'
                ? 'bg-white text-[#163832] shadow-xs'
                : 'text-[#8EB69B] hover:text-[#051F20]'
            }`}
          >
            Pengajuan Belanja
          </button>
          <button
            onClick={() => setActiveTab('JURNAL')}
            className={`px-4 py-2 text-xs font-bold rounded-[8px] transition-all uppercase tracking-wider cursor-pointer ${
              activeTab === 'JURNAL'
                ? 'bg-white text-[#163832] shadow-xs'
                : 'text-[#8EB69B] hover:text-[#051F20]'
            }`}
          >
            Jurnal & Kehadiran
          </button>
        </div>
      </div>

      {activeTab === 'BELANJA' && (
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex gap-2">
              {(['ALL', 'DAPUR', 'SARPRAS'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[8px] transition-colors uppercase tracking-wider cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-slate-100 text-[#163832]'
                      : 'bg-white text-[#8EB69B] hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[#8EB69B] font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pengaju</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Bukti Nota</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#051F20]">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8EB69B] italic font-semibold">
                      Belum ada data pengajuan belanja
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#163832]">
                        {expense.date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#051F20]">
                        {expense.reporterName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-wider ${
                          expense.category === 'DAPUR' 
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#163832]">
                        {formatRupiah(expense.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-wider ${
                          expense.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                          expense.status === 'APPROVED' ? 'bg-[#DAF1DE] text-[#051F20]' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {expense.status === 'PENDING' ? <Clock className="w-3 h-3" /> : expense.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {expense.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {expense.receiptUrl ? (
                          <button
                            onClick={() => setSelectedImage(expense.receiptUrl!)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-[8px] hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} /> Lihat Bukti
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#8EB69B] italic">- Tidak ada -</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {expense.status === 'PENDING' && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(expense.id, 'APPROVED')}
                              className="p-1.5 text-[#163832] bg-[#DAF1DE] hover:bg-[#8EB69B] rounded-[8px] transition-colors cursor-pointer"
                              title="Setujui"
                            >
                              <CheckCircle className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(expense.id, 'REJECTED')}
                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-[8px] transition-colors cursor-pointer"
                              title="Tolak"
                            >
                              <XCircle className="w-4 h-4" strokeWidth={2} />
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
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex gap-2">
              {(['ALL', 'DAPUR', 'SARPRAS'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[8px] transition-colors uppercase tracking-wider cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-slate-100 text-[#163832]'
                      : 'bg-white text-[#8EB69B] hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-[#051F20] mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#163832]" strokeWidth={2} /> Kehadiran Staff Hari Ini
            </h3>
            {staffAttendances.length === 0 ? (
              <p className="text-xs text-[#8EB69B] italic font-semibold">Belum ada staff yang absen masuk hari ini.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {staffAttendances.map(att => {
                  const staff = teachers.find(t => t.id === att.teacherId);
                  return (
                    <div key={att.id} className="flex items-center gap-3 bg-white border border-slate-200 px-3 py-2 rounded-[12px] shadow-xs">
                      <div className={`w-2.5 h-2.5 rounded-full ${att.status === 'SELESAI' || att.status.includes('HADIR') ? 'bg-[#163832]' : 'bg-rose-500'}`}></div>
                      <div>
                        <p className="text-xs font-bold text-[#051F20]">{staff?.name}</p>
                        <p className="text-[10px] text-[#8EB69B] font-mono font-semibold">Clock In: {att.clockInTime || '-'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5 grid gap-4 grid-cols-1 md:grid-cols-2 bg-white">
            {(staffJournals || []).filter(j => filterCategory === 'ALL' || j.category === filterCategory).length === 0 ? (
              <div className="col-span-full py-8 text-center text-[#8EB69B] italic font-semibold text-xs">
                Belum ada data jurnal pekerjaan
              </div>
            ) : (
              (staffJournals || [])
                .filter(j => filterCategory === 'ALL' || j.category === filterCategory)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(journal => (
                  <div key={journal.id} className="bg-white border border-slate-200 rounded-[16px] p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-[#051F20]">{journal.staffName}</p>
                        <p className="text-[10px] text-[#8EB69B] font-mono font-semibold mt-0.5">{journal.date}</p>
                      </div>
                      <span className={`inline-block px-2.5 py-1 rounded-[8px] text-[9px] font-bold uppercase tracking-wider ${
                        journal.category === 'DAPUR' 
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {journal.category}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#8EB69B] mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5 text-[#163832]" strokeWidth={2} /> Dikerjakan Hari Ini
                        </p>
                        <p className="text-xs font-semibold text-[#051F20] bg-slate-50 p-3 rounded-[12px] border border-slate-100 leading-relaxed">
                          {journal.taskToday}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#8EB69B] mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} /> Rencana Besok
                        </p>
                        <p className="text-xs font-semibold text-[#051F20] bg-slate-50 p-3 rounded-[12px] border border-slate-100 leading-relaxed">
                          {journal.taskTomorrow}
                        </p>
                      </div>
                      {journal.photoUrl && (
                        <div>
                          <p className="text-[10px] font-bold text-[#8EB69B] mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} /> Lampiran Foto
                          </p>
                          <div 
                            className="relative rounded-[12px] overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImage(journal.photoUrl!)}
                          >
                            <img src={journal.photoUrl} alt="Foto Jurnal" className="w-full h-32 object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-200 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="bg-white dark:bg-[#111a16] p-2 rounded-2xl overflow-hidden shadow-2xl">
              <img src={selectedImage} alt="Bukti Lampiran" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

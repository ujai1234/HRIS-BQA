import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Book, Send, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useHRIS } from '../context/HRISContext';

export const TeacherNotes: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const [notesHistory, setNotesHistory] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'KEDISIPLINAN',
    note: ''
  });

  const { currentUserId } = useHRIS();
  const teacherId = currentUserId || 'TCH-001';

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const endpoint = readOnly ? '/api/students' : `/api/teachers/${teacherId}/students`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      }
      
      const notesRes = await fetch('/api/notes');
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotesHistory(data.data || []);
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, teacherId })
      });
      if (res.ok) {
        toast.success('Catatan berhasil dikirim ke wali santri');
        setShowModal(false);
        setFormData({ studentId: '', type: 'KEDISIPLINAN', note: '' });
        fetchData(); // Refresh history
      } else {
        toast.error('Gagal mengirim catatan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B2B26] p-5 rounded-[16px] border border-slate-200 dark:border-[#163832] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-[#DAF1DE]">Catatan dan Keterangan (Buku Penghubung)</h2>
          <p className="text-sm text-slate-500 dark:text-[#8EB69B] mt-1">Pantau catatan kedisiplinan atau prestasi ke wali santri.</p>
        </div>
        {!readOnly && (
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#163832] dark:bg-[#8EB69B] hover:bg-[#0B2B26] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] px-4 py-2.5 rounded-[12px] font-medium transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Tulis Catatan Baru
        </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white dark:bg-[#0B2B26] rounded-[16px] border border-slate-200 dark:border-[#163832] p-5 shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-[#DAF1DE] mb-4 flex items-center gap-2">
             <Book className="w-5 h-5 text-emerald-600 dark:text-[#8EB69B]" />
             Pilih Santri
           </h3>
           <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8EB69B]" />
            <input 
              type="text" 
              placeholder="Cari santri..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#163832] rounded-[12px] text-sm focus:ring-2 focus:ring-[#8EB69B] dark:text-[#DAF1DE] outline-none"
            />
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {filteredStudents.map(s => (
              <div 
                key={s.id} 
                onClick={() => {
                  if (readOnly) return;
                  setFormData({...formData, studentId: s.id});
                  setShowModal(true);
                }}
                className={`p-3 rounded-[12px] border border-slate-200 dark:border-[#163832] transition-all bg-slate-50 dark:bg-[#163832]/50 ${!readOnly ? 'hover:border-emerald-500 dark:hover:border-[#8EB69B] cursor-pointer' : ''}`}
              >
                <p className="font-medium text-slate-800 dark:text-[#DAF1DE] text-sm">{s.name}</p>
                <p className="text-xs text-slate-500 dark:text-[#8EB69B] mt-1">NIS: {s.nis} • {s.className}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-2 flex flex-col h-[500px]">
          <div className="bg-emerald-50 dark:bg-[#163832] rounded-[16px] border border-emerald-100 dark:border-[#0B2B26] p-5 mb-4 shrink-0 flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-[#8EB69B] hidden sm:block" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800 dark:text-[#DAF1DE]">Komunikasi Transparan</h3>
              <p className="text-xs text-emerald-600 dark:text-[#8EB69B] mt-1">
                Laporan kedisiplinan, prestasi, atau info akademik terkirim otomatis ke WA wali santri.
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#0B2B26] rounded-[16px] border border-slate-200 dark:border-[#163832] shadow-sm flex-1 overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-200 dark:border-[#163832] shrink-0">
               <h3 className="font-bold text-slate-800 dark:text-[#DAF1DE] text-sm">Riwayat Catatan</h3>
             </div>
             <div className="p-4 overflow-y-auto flex-1 space-y-3">
               {notesHistory.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-10">Belum ada catatan.</p>
               ) : (
                  notesHistory.map(note => {
                    const student = students.find(s => s.id === note.studentId);
                    return (
                      <div key={note.id} className="p-4 border border-slate-100 dark:border-[#163832] rounded-[12px] bg-slate-50 dark:bg-[#163832]/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-[#DAF1DE] text-sm">{student ? student.name : 'Santri tidak diketahui'}</span>
                            <span className={`text-[10px] ml-2 px-2 py-0.5 rounded-[8px] font-medium ${
                              note.type === 'KEDISIPLINAN' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200' :
                              note.type === 'PRESTASI' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                              'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                            }`}>{note.type}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-[#8EB69B]">{new Date(note.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#DAF1DE]">{note.note}</p>
                      </div>
                    )
                  })
               )}
             </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#0B2B26] rounded-[16px] shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 dark:border-[#163832] flex justify-between items-center bg-slate-50 dark:bg-[#163832]">
              <h3 className="font-bold text-slate-800 dark:text-[#DAF1DE]">Tulis Buku Penghubung</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#8EB69B] mb-1">Pilih Santri</label>
                <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-[12px] text-sm dark:text-[#DAF1DE] outline-none focus:border-[#8EB69B]">
                  <option value="">-- Pilih --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#8EB69B] mb-1">Kategori Catatan</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-[12px] text-sm dark:text-[#DAF1DE] outline-none focus:border-[#8EB69B]">
                  <option value="KEDISIPLINAN">Kedisiplinan & Pelanggaran</option>
                  <option value="PRESTASI">Prestasi & Apresiasi</option>
                  <option value="AKADEMIK">Info Akademik</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#8EB69B] mb-1">Isi Catatan</label>
                <textarea required rows={4} value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-[12px] text-sm dark:text-[#DAF1DE] outline-none focus:border-[#8EB69B]" placeholder="Ketikkan catatan untuk wali santri..." />
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-[#163832] flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-[#DAF1DE] dark:hover:bg-[#163832] rounded-[12px] transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white dark:text-[#051F20] bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] flex items-center gap-2 rounded-[12px] transition-colors shadow-sm">
                  <Send className="w-4 h-4" />
                  Kirim ke Wali
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

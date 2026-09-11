import React, { useState, useRef } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { PenTool, Plus, BookOpen, Clock, ListChecks, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '../../utils/imageUtils';

interface StaffJournalFormProps {
  category: 'SARPRAS' | 'DAPUR';
}

export const StaffJournalForm: React.FC<StaffJournalFormProps> = ({ category }) => {
  const { currentUser, staffJournals, addStaffJournal } = useHRIS();
  
  const [taskToday, setTaskToday] = useState('');
  const [taskTomorrow, setTaskTomorrow] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter journals for today and current user
  const todayJournals = staffJournals.filter(
    j => j.staffId === currentUser?.id && j.date === new Date().toISOString().split('T')[0] && j.category === category
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file, 800, 800, 0.7);
      setPhotoUrl(compressedBase64);
    } catch (error) {
      console.error('Failed to compress image:', error);
      toast.error('Gagal memproses gambar');
    }
  };

  const removeImage = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        photoUrl,
      });
      
      toast.success('Jurnal harian berhasil dicatat');
      setTaskToday('');
      setTaskTomorrow('');
      removeImage();
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

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unggah Lampiran Foto (Opsional)
              </label>
              {!photoUrl ? (
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-emerald-900/50 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#111a16] hover:bg-slate-100 dark:hover:bg-[#16201b] transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Klik untuk memilih foto (Max: 5MB)</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-xl border border-slate-200 dark:border-emerald-900/50 overflow-hidden bg-slate-100 dark:bg-[#111a16] aspect-video flex items-center justify-center">
                  <img src={photoUrl} alt="Preview Foto" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
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
          
          <div className="space-y-3 max-h-[38rem] overflow-y-auto pr-2">
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
                  {journal.photoUrl && (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-200 dark:border-emerald-900/40">
                      <img src={journal.photoUrl} alt="Foto Jurnal" className="w-full h-auto max-h-48 object-cover" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

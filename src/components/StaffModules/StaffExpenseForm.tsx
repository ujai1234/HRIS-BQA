import React, { useState, useRef } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { Receipt, Plus, CheckCircle, Clock, XCircle, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah, parseCurrencyInput, formatCurrencyInput } from '../../utils/formatters';
import { compressImage } from '../../utils/imageUtils';

interface StaffExpenseFormProps {
  category: 'SARPRAS' | 'DAPUR';
}

export const StaffExpenseForm: React.FC<StaffExpenseFormProps> = ({ category }) => {
  const { currentUser, expenses, addExpenseRecord } = useHRIS();
  
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter expenses for today and current user
  const todayExpenses = expenses.filter(
    e => e.reporterId === currentUser?.id && e.date === new Date().toISOString().split('T')[0] && e.category === category
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
      setReceiptUrl(compressedBase64);
    } catch (error) {
      console.error('Failed to compress image:', error);
      toast.error('Gagal memproses gambar');
    }
  };

  const removeImage = () => {
    setReceiptUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountInput.trim() || parseCurrencyInput(amountInput) <= 0) {
      toast.error('Mohon isi deskripsi dan nominal yang valid');
      return;
    }

    if (!receiptUrl) {
      toast.error('Mohon lampirkan foto bukti nota belanja');
      return;
    }

    if (currentUser) {
      addExpenseRecord({
        date: new Date().toISOString().split('T')[0],
        category,
        description,
        amount: parseCurrencyInput(amountInput),
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        receiptUrl,
      });
      
      toast.success('Pengajuan belanja berhasil dikirim');
      setDescription('');
      setAmountInput('');
      removeImage();
    }
  };

  return (
    <div className="bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200/80 dark:border-emerald-900/40 shadow-xs p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/40 shrink-0">
          <Receipt className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-emerald-50 text-sm">Laporan Belanja &amp; Pengeluaran</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Pengajuan */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Deskripsi Belanja
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Beli Beras 50kg, Minyak Goreng 5L"
                className="w-full bg-slate-50 dark:bg-[#111a16] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Biaya (Rp)
              </label>
              <input
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(formatCurrencyInput(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-[#111a16] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-slate-200 font-mono"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unggah Bukti Nota Belanja
              </label>
              {!receiptUrl ? (
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-emerald-900/50 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#111a16] hover:bg-slate-100 dark:hover:bg-[#16201b] transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Klik untuk memilih foto nota (Max: 5MB)</span>
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
                  <img src={receiptUrl} alt="Preview Nota" className="max-h-full max-w-full object-contain" />
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
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajukan Belanja
            </button>
          </form>
        </div>

        {/* Riwayat Hari Ini */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-emerald-900/30 pb-2">
            Riwayat Pengajuan Hari Ini
          </h4>
          
          <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-2">
            {todayExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4 italic">Belum ada pengajuan belanja hari ini</p>
            ) : (
              todayExpenses.map(expense => (
                <div key={expense.id} className="bg-slate-50 dark:bg-[#111a16] p-3 rounded-xl border border-slate-100 dark:border-emerald-900/30">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                      {expense.description}
                    </p>
                    <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap ml-2">
                      {formatRupiah(expense.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {expense.status === 'PENDING' ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Menunggu Validasi
                      </span>
                    ) : expense.status === 'APPROVED' ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Disetujui
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Ditolak
                      </span>
                    )}
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

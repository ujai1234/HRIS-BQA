import React, { useState } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { Receipt, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah, parseCurrencyInput, formatCurrencyInput } from '../../utils/formatters';

interface StaffExpenseFormProps {
  category: 'SARPRAS' | 'DAPUR';
}

export const StaffExpenseForm: React.FC<StaffExpenseFormProps> = ({ category }) => {
  const { currentUser, expenses, addExpenseRecord } = useHRIS();
  
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  
  // Filter expenses for today and current user
  const todayExpenses = expenses.filter(
    e => e.reporterId === currentUser?.id && e.date === new Date().toISOString().split('T')[0] && e.category === category
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountInput.trim() || parseCurrencyInput(amountInput) <= 0) {
      toast.error('Mohon isi deskripsi dan nominal yang valid');
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
      });
      
      toast.success('Pengajuan belanja berhasil dikirim');
      setDescription('');
      setAmountInput('');
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
          
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
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

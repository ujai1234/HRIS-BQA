import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminFinance: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || data || []);
      }
    } catch (error) {
      toast.error('Gagal memuat data pembayaran');
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LUNAS' })
      });
      if (res.ok) {
        toast.success('Pembayaran berhasil diverifikasi');
        fetchPayments();
      } else {
        toast.error('Gagal memverifikasi pembayaran');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const filteredPayments = payments.filter(p => 
    p.billingMonth.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.studentId.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#121f1a] p-5 rounded-2xl border border-slate-200 dark:border-emerald-900/40 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-emerald-50">Verifikasi Keuangan</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-400/70 mt-1">Tinjau bukti transfer dan verifikasi pembayaran SPP santri.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari ID Santri atau Bulan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#121f1a] border border-slate-200 dark:border-emerald-900/40 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-emerald-100 outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200 dark:border-emerald-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0f1a15] text-slate-500 dark:text-emerald-400/80 border-b border-slate-200 dark:border-emerald-900/40">
              <tr>
                <th className="px-6 py-4 font-semibold">Bulan Tagihan</th>
                <th className="px-6 py-4 font-semibold">ID Santri</th>
                <th className="px-6 py-4 font-semibold">Nominal</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Bukti Transfer</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Tidak ada data tagihan.</td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-[#162720]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-emerald-50">{pay.billingMonth}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-emerald-300/80">{pay.studentId}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-emerald-100">Rp {pay.amount.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      {pay.status === 'LUNAS' ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full w-max">
                          <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS
                        </span>
                      ) : pay.status === 'MENUNGGU VERIFIKASI' || pay.status === 'MENUNGGU_VERIFIKASI' ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full w-max">
                          <Clock className="w-3.5 h-3.5" /> MENUNGGU VERIFIKASI
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full w-max">
                          <AlertCircle className="w-3.5 h-3.5" /> BELUM LUNAS
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {pay.receiptUrl ? (
                        <button 
                          onClick={() => {
                            const newTab = window.open();
                            newTab?.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;"><img src="${pay.receiptUrl}" style="max-width:100%;max-height:100vh;"/></body></html>`);
                          }}
                          className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Belum diunggah</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(pay.status === 'MENUNGGU VERIFIKASI' || pay.status === 'MENUNGGU_VERIFIKASI') && (
                        <button 
                          onClick={() => handleVerify(pay.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Verifikasi Lunas
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

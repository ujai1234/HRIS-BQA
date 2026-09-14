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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bqa-card p-6">
        <div>
          <h2 className="text-xl font-bold text-[#051F20]">Verifikasi Keuangan</h2>
          <p className="text-sm text-[#8EB69B] mt-1 font-medium">Tinjau bukti transfer dan verifikasi pembayaran SPP santri.</p>
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
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-[12px] text-sm focus:ring-2 focus:ring-[#163832] outline-none"
          />
        </div>
      </div>

      <div className="bqa-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[#8EB69B] border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Bulan Tagihan</th>
                <th className="px-6 py-4 font-semibold">ID Santri</th>
                <th className="px-6 py-4 font-semibold">Nominal</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Bukti Transfer</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#8EB69B] font-medium">Memuat data...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#8EB69B] font-medium">Tidak ada data tagihan.</td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#051F20]">{pay.billingMonth}</td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-[#8EB69B]">{pay.studentId}</td>
                    <td className="px-6 py-4 font-semibold text-[#051F20]">Rp {pay.amount.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      {pay.status === 'LUNAS' ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#163832] bg-[#DAF1DE] px-2.5 py-1 rounded-[8px] w-max uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> LUNAS
                        </span>
                      ) : pay.status === 'MENUNGGU VERIFIKASI' || pay.status === 'MENUNGGU_VERIFIKASI' ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-[8px] w-max uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> VERIFIKASI
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-[8px] w-max uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" /> BELUM LUNAS
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
                          className="bg-[#163832] hover:bg-[#0B2B26] text-[#DAF1DE] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-[8px] transition-colors"
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

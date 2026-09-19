import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const AdminFinance: React.FC = () => {
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFinanceData = async () => {
    try {
      setIsLoading(true);
      const [sumRes, txRes] = await Promise.all([
        fetch('/api/finance/summary'),
        fetch('/api/finance/transactions')
      ]);
      
      if (sumRes.ok && txRes.ok) {
        setSummary(await sumRes.json());
        setTransactions(await txRes.json());
      }
    } catch (error) {
      toast.error('Gagal memuat data keuangan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bqa-card p-6">
        <div>
          <h2 className="text-xl font-bold text-[#051F20]">Laporan Keuangan (Read-Only)</h2>
          <p className="text-sm text-[#8EB69B] mt-1 font-medium">Pencatatan kas dan verifikasi pembayaran SPP kini dikelola melalui Aplikasi Keuangan BQA.</p>
        </div>
        <a 
          href="http://localhost:5500/Keuangan-BQA/index.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#163832] hover:bg-[#0B2B26] text-[#DAF1DE] px-5 py-2.5 rounded-[12px] text-sm font-bold transition-colors"
        >
          Buka Aplikasi Keuangan <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 border-l-4 border-l-emerald-500">
          <h3 className="text-slate-500 text-sm font-medium">Total Pemasukan</h3>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatRp(summary.income)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 border-l-4 border-l-rose-500">
          <h3 className="text-slate-500 text-sm font-medium">Total Pengeluaran</h3>
          <p className="text-2xl font-bold text-rose-600 mt-2">{formatRp(summary.expense)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 border-l-4 border-l-blue-500">
          <h3 className="text-slate-500 text-sm font-medium">Saldo Kas Aktif</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatRp(summary.balance)}</p>
        </div>
      </div>

      <div className="bqa-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">Riwayat Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[#8EB69B] border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Deskripsi</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#8EB69B] font-medium">Memuat data...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#8EB69B] font-medium">Belum ada transaksi di database kas.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-600">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-bold text-[#051F20]">{tx.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-[10px] bg-slate-100 font-medium tracking-wide">
                        {tx.category_name || 'UMUM'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold text-right ${tx.category_type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.category_type === 'INCOME' ? '+' : '-'}{formatRp(tx.amount)}
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

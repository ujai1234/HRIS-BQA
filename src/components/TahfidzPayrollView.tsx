import React, { useState, useEffect } from 'react';
import { useHRIS } from '../context/HRISContext';
import { 
  Download, 
  Printer, 
  RefreshCw, 
  Sun,
  Moon,
  Banknote,
  Users,
  Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

export const TahfidzPayrollView: React.FC = () => {
  const { fetchTahfidzPayroll, tahfidzPayroll, checkTahfidzConnection } = useHRIS();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isFetching, setIsFetching] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const loadData = async () => {
    setIsFetching(true);
    try {
      const connected = await checkTahfidzConnection();
      setIsConnected(connected);
      await fetchTahfidzPayroll(selectedMonth, selectedYear);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const handleExportCSV = () => {
    if (!tahfidzPayroll || tahfidzPayroll.items.length === 0) return;
    
    const headers = [
      'No', 'Nama Ustadz', 'Halqah', 'Hadir Subuh', 'Hadir Maghrib', 
      'Total JP', 'Tarif per JP', 'Total Honor'
    ];
    
    const rows = tahfidzPayroll.items.map((item, idx) => [
      idx + 1,
      item.teacherName,
      item.halqah || '-',
      item.totalSubuhHadir,
      item.totalMaghribHadir,
      item.totalJP,
      item.ratePerJP,
      item.totalHonor
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Payroll_Tahfidz_${tahfidzPayroll.period.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    if (!tahfidzPayroll || tahfidzPayroll.items.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Rekapitulasi Kafa\'ah Tahfidz BQA', 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${tahfidzPayroll.period} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 27);

    const tableColumn = ["No", "Nama Ustadz", "Halqah", "Subuh", "Maghrib", "Total JP", "Honor (Rp)"];
    
    const tableRows = tahfidzPayroll.items.map((item, idx) => [
      idx + 1,
      item.teacherName,
      item.halqah || '-',
      item.totalSubuhHadir,
      item.totalMaghribHadir,
      item.totalJP,
      item.totalHonor.toLocaleString('id-ID')
    ]);

    tableRows.push([
      '', 'TOTAL KESELURUHAN', '', 
      tahfidzPayroll.totalSubuhJP.toString(), 
      tahfidzPayroll.totalMaghribJP.toString(), 
      tahfidzPayroll.totalJP.toString(), 
      tahfidzPayroll.totalHonor.toLocaleString('id-ID')
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [6, 95, 70] }
    });

    doc.save(`Payroll_Tahfidz_${tahfidzPayroll.period.replace(' ', '_')}.pdf`);
  };

  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-5">
      {/* Minimal Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#16201b] p-4 rounded-2xl border border-slate-200/80 dark:border-emerald-950/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-[#047857] dark:text-emerald-400 font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Payroll Tahfidz</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${isConnected ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isConnected ? 'Terhubung API' : 'Mode Sinkron'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Rp 40.000 / JP (Subuh & Maghrib)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 dark:bg-[#111a16] border border-slate-200 dark:border-emerald-900/50 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 dark:bg-[#111a16] border border-slate-200 dark:border-emerald-900/50 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button 
            onClick={loadData}
            disabled={isFetching}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/50 rounded-xl border border-slate-200 dark:border-emerald-900/50 transition-colors"
            title="Sinkronkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sleek Minimal Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bqa-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Ustadz</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
              {tahfidzPayroll?.totalUstadz || 0}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-emerald-950/40 flex items-center justify-center text-slate-600 dark:text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bqa-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hadir Subuh</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 flex items-baseline gap-1">
              {tahfidzPayroll?.totalSubuhJP || 0} <span className="text-xs font-normal text-slate-400">JP</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
        </div>

        <div className="bqa-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hadir Maghrib</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 flex items-baseline gap-1">
              {tahfidzPayroll?.totalMaghribJP || 0} <span className="text-xs font-normal text-slate-400">JP</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Moon className="w-4 h-4" />
          </div>
        </div>

        <div className="bqa-card p-4 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Honor</span>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              Rp {(tahfidzPayroll?.totalHonor || 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Modern Compact Table */}
      <div className="bg-white dark:bg-[#16201b] rounded-2xl border border-slate-200/80 dark:border-emerald-950/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-emerald-900/30 flex justify-between items-center bg-slate-50/50 dark:bg-[#111a16]">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-emerald-400 uppercase">
            Rincian Honor Ustadz — {tahfidzPayroll?.period}
          </h2>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleExportCSV}
              disabled={!tahfidzPayroll || tahfidzPayroll.items.length === 0}
              className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-emerald-900/40 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button 
              onClick={handlePrintPDF}
              disabled={!tahfidzPayroll || tahfidzPayroll.items.length === 0}
              className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-emerald-900/40 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
              title="Cetak PDF"
            >
              <Printer className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/80 dark:bg-[#0d1612] border-b border-slate-100 dark:border-emerald-950">
              <tr>
                <th className="px-5 py-3">Nama Ustadz</th>
                <th className="px-5 py-3 text-center">Subuh</th>
                <th className="px-5 py-3 text-center">Maghrib</th>
                <th className="px-5 py-3 text-center">Total JP</th>
                <th className="px-5 py-3 text-right">Honor (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/20">
              {tahfidzPayroll?.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-[#111a16]/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{item.teacherName}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">{item.halqah}</div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                      {item.totalSubuhHadir}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold">
                      {item.totalMaghribHadir}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {item.totalJP} JP
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    Rp {item.totalHonor.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
            {tahfidzPayroll && tahfidzPayroll.items.length > 0 && (
              <tfoot className="bg-slate-50/80 dark:bg-[#0d1612] font-semibold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-emerald-900/40">
                <tr>
                  <td className="px-5 py-3 font-bold uppercase text-[11px] text-slate-500">Total</td>
                  <td className="px-5 py-3 text-center">{tahfidzPayroll.totalSubuhJP}</td>
                  <td className="px-5 py-3 text-center">{tahfidzPayroll.totalMaghribJP}</td>
                  <td className="px-5 py-3 text-center font-bold text-emerald-600">{tahfidzPayroll.totalJP} JP</td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    Rp {tahfidzPayroll.totalHonor.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

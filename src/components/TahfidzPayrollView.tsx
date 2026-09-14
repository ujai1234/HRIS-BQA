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
      <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-slate-50 border border-slate-200 flex items-center justify-center text-[#163832] font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#051F20] tracking-tight">Payroll Tahfidz</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${isConnected ? 'bg-[#DAF1DE] text-[#051F20]' : 'bg-rose-100 text-rose-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#163832] animate-pulse' : 'bg-rose-500'}`} />
                {isConnected ? 'Terhubung API' : 'Mode Sinkron'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#8EB69B] mt-0.5">Rp 40.000 / JP (Subuh & Maghrib)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-[12px] text-xs font-bold text-[#051F20] focus:outline-none focus:ring-2 focus:ring-[#163832]"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-[12px] text-xs font-bold text-[#051F20] focus:outline-none focus:ring-2 focus:ring-[#163832]"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button 
            onClick={loadData}
            disabled={isFetching}
            className="p-2.5 text-[#051F20] hover:bg-slate-100 rounded-[12px] border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Sinkronkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sleek Minimal Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EB69B] block uppercase tracking-wider">Total Ustadz</span>
            <div className="text-base sm:text-lg font-bold text-[#051F20] tracking-tight mt-1 font-sans">
              {tahfidzPayroll?.totalUstadz || 0}
            </div>
          </div>
          <div className="w-9 h-9 rounded-[12px] bg-slate-50 flex items-center justify-center text-[#163832]">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EB69B] block uppercase tracking-wider">Hadir Subuh</span>
            <div className="text-base sm:text-lg font-bold text-[#051F20] tracking-tight mt-1 font-sans flex items-baseline gap-1">
              {tahfidzPayroll?.totalSubuhJP || 0} <span className="text-[10px] font-bold text-[#8EB69B]">JP</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-[12px] bg-slate-50 flex items-center justify-center text-[#8EB69B]">
            <Sun className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EB69B] block uppercase tracking-wider">Hadir Maghrib</span>
            <div className="text-base sm:text-lg font-bold text-[#051F20] tracking-tight mt-1 font-sans flex items-baseline gap-1">
              {tahfidzPayroll?.totalMaghribJP || 0} <span className="text-[10px] font-bold text-[#8EB69B]">JP</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-[12px] bg-slate-50 flex items-center justify-center text-[#051F20]">
            <Moon className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs flex items-center justify-between border-l-4 border-l-[#163832]">
          <div>
            <span className="text-[11px] font-bold text-[#163832] block uppercase tracking-wider">Total Honor</span>
            <div className="text-base sm:text-lg font-bold text-[#163832] tracking-tight mt-1 font-sans truncate">
              Rp {(tahfidzPayroll?.totalHonor || 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-[12px] bg-[#DAF1DE] flex items-center justify-center text-[#163832]">
            <Banknote className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Modern Compact Table */}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xs font-bold tracking-wider text-[#051F20] uppercase">
            Rincian Honor Ustadz — {tahfidzPayroll?.period}
          </h2>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportCSV}
              disabled={!tahfidzPayroll || tahfidzPayroll.items.length === 0}
              className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-[#051F20] px-3 py-1.5 rounded-[8px] text-[10px] font-bold border border-slate-200 transition-all cursor-pointer shadow-xs uppercase tracking-wider disabled:opacity-40"
              title="Export CSV"
            >
              <Download className="w-3 h-3 text-[#051F20]" strokeWidth={2} /> CSV
            </button>
            <button 
              onClick={handlePrintPDF}
              disabled={!tahfidzPayroll || tahfidzPayroll.items.length === 0}
              className="inline-flex items-center justify-center gap-1.5 bg-[#051F20] hover:bg-[#163832] text-white px-3 py-1.5 rounded-[8px] text-[10px] font-bold shadow-xs transition-all cursor-pointer uppercase tracking-wider disabled:opacity-40"
              title="Cetak PDF"
            >
              <Printer className="w-3 h-3 text-white" strokeWidth={2} /> PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[#8EB69B] font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Nama Ustadz</th>
                <th className="px-5 py-3 text-center">Subuh</th>
                <th className="px-5 py-3 text-center">Maghrib</th>
                <th className="px-5 py-3 text-center">Total JP</th>
                <th className="px-5 py-3 text-right">Honor (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tahfidzPayroll?.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-[#051F20]">{item.teacherName}</div>
                    <div className="text-[10px] text-[#8EB69B] font-semibold mt-0.5">{item.halqah}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-slate-100 text-[#163832] font-bold font-mono">
                      {item.totalSubuhHadir}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-slate-100 text-[#051F20] font-bold font-mono">
                      {item.totalMaghribHadir}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold font-mono text-[#163832]">
                    {item.totalJP} JP
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold font-mono text-[#163832]">
                    Rp {item.totalHonor.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
            {tahfidzPayroll && tahfidzPayroll.items.length > 0 && (
              <tfoot className="bg-slate-50 font-bold text-[#051F20] border-t border-slate-200">
                <tr>
                  <td className="px-5 py-4 font-bold uppercase text-[11px] text-[#8EB69B] tracking-wider">Total Keseluruhan</td>
                  <td className="px-5 py-4 text-center font-mono">{tahfidzPayroll.totalSubuhJP}</td>
                  <td className="px-5 py-4 text-center font-mono">{tahfidzPayroll.totalMaghribJP}</td>
                  <td className="px-5 py-4 text-center font-bold text-[#163832] font-mono">{tahfidzPayroll.totalJP} JP</td>
                  <td className="px-5 py-4 text-right font-bold text-[#051F20] text-sm font-mono">
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

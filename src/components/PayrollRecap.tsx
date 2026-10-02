import React, { useState } from 'react';
import { Calendar, Download, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, exportToCSV } from '../utils/formatters';
import { AdminOfficialReportModal } from './AdminOfficialReportModal';

const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028];

export const PayrollRecap: React.FC = () => {
  const { 
    calculateAllPayroll, 
    selectedPeriod, 
    setSelectedPeriod 
  } = useHRIS();

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [showOfficialPdfModal, setShowOfficialPdfModal] = useState(false);

  // Parse current selected month & year from selectedPeriod (e.g. "September 2026")
  const periodParts = selectedPeriod.trim().split(/\s+/);
  const currentMonthNum = MONTH_OPTIONS.find(
    (m) => m.label.toLowerCase() === periodParts[0]?.toLowerCase()
  )?.value || 9;
  const currentYearNum = parseInt(periodParts[1]) || 2026;

  const handleMonthChange = (newMonthNum: number) => {
    const m = MONTH_OPTIONS.find((opt) => opt.value === newMonthNum);
    if (m) {
      setSelectedPeriod(`${m.label} ${currentYearNum}`);
    }
  };

  const handleYearChange = (newYearNum: number) => {
    const m = MONTH_OPTIONS.find((opt) => opt.value === currentMonthNum);
    const label = m ? m.label : 'September';
    setSelectedPeriod(`${label} ${newYearNum}`);
  };

  const payrollSummary = calculateAllPayroll(selectedPeriod);

  // Filter items
  const filteredItems = payrollSummary.items.filter((item) => {
    const teacherName = item.teacher?.name || '';
    const teacherNip = item.teacher?.nip || '';
    const teacherPos = item.teacher?.position || '';
    const matchesSearch =
      teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacherNip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacherPos.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnit = unitFilter === 'ALL' || item.teacher?.unit === unitFilter;

    return matchesSearch && matchesUnit;
  });

  const handleExportExcel = () => {
    const headers = [
      'No',
      'NIP',
      'Nama Guru',
      'Jabatan',
      'Unit',
      'Gaji Pokok',
      'Jam Mengajar (JP)',
      'Honor Mengajar',
      'Honor Tahfidz',
      'Hari Hadir',
      'Uang Transport',
      'Potongan Terlambat',
      'Potongan Jurnal Kosong',
      'Potongan Alpa',
      'Total Potongan',
      'Gaji Bersih',
      'Periode'
    ];

    const rows = filteredItems.map((item, index) => [
      index + 1,
      item.teacher.nip,
      item.teacher.name,
      item.teacher.position,
      item.teacher.unit,
      item.baseSalary,
      item.totalTaughtHours,
      item.teachingHonorarium,
      item.tahfidzHonorarium || 0,
      item.totalPresentDays,
      item.totalTransport,
      item.latePenaltyTotal,
      item.emptyJournalPenalty,
      item.alphaPenalty,
      item.totalDeductions,
      item.netSalary,
      item.period,
    ]);

    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      payrollSummary.items.reduce((s, i) => s + i.baseSalary, 0),
      payrollSummary.totalTeachingHours,
      payrollSummary.items.reduce((s, i) => s + i.teachingHonorarium, 0),
      payrollSummary.items.reduce((s, i) => s + (i.tahfidzHonorarium || 0), 0),
      payrollSummary.items.reduce((s, i) => s + i.totalPresentDays, 0),
      payrollSummary.items.reduce((s, i) => s + i.totalTransport, 0),
      payrollSummary.items.reduce((s, i) => s + i.latePenaltyTotal, 0),
      payrollSummary.items.reduce((s, i) => s + i.emptyJournalPenalty, 0),
      payrollSummary.items.reduce((s, i) => s + i.alphaPenalty, 0),
      payrollSummary.totalDeductions,
      payrollSummary.totalNet,
      payrollSummary.period,
    ]);

    exportToCSV(`Rekapitulasi_Gaji_${selectedPeriod.replace(/\s+/g, '_')}.csv`, [
      headers,
      ...rows,
    ]);

    toast.success('Laporan penggajian berhasil diekspor ke CSV');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Period Filter */}
      <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-slate-50 border border-slate-200 flex items-center justify-center text-[#163832] font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#051F20] tracking-tight">Generate Payroll & Kafa'ah</h1>
              <span className="bg-[#DAF1DE] text-[#051F20] font-bold px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                Periode {selectedPeriod}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#8EB69B] mt-0.5">
              Kalkulasi otomatis per bulan dari jam KBM, presensi, badal & honor tahfidz
            </p>
          </div>
        </div>

        {/* Filter Bulan & Tahun Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[12px]">
            <span className="text-[10px] font-bold text-[#8EB69B] uppercase tracking-wider">Bulan:</span>
            <select
              value={currentMonthNum}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-[#051F20] focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[12px]">
            <span className="text-[10px] font-bold text-[#8EB69B] uppercase tracking-wider">Tahun:</span>
            <select
              value={currentYearNum}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-[#051F20] focus:outline-none cursor-pointer"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate Payroll Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-[#8EB69B] uppercase tracking-wider block">Gaji Pokok</span>
          <p className="text-base sm:text-lg font-bold text-[#051F20] tracking-tight mt-1 truncate">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.baseSalary, 0))}
          </p>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-[#8EB69B] uppercase tracking-wider block">Honor Mengajar</span>
          <p className="text-base sm:text-lg font-bold text-[#163832] tracking-tight mt-1 truncate">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.teachingHonorarium, 0))}
          </p>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-[#8EB69B] uppercase tracking-wider block">Uang Transport</span>
          <p className="text-base sm:text-lg font-bold text-[#051F20] tracking-tight mt-1 truncate">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.totalTransport, 0))}
          </p>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">Potongan SOP</span>
          <p className="text-base sm:text-lg font-bold text-rose-600 tracking-tight mt-1 truncate">
            -{formatRupiah(payrollSummary.totalDeductions)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs col-span-2 sm:col-span-1 border-l-4 border-l-[#163832]">
          <span className="text-[11px] font-bold text-[#163832] uppercase tracking-wider block">Total Bersih</span>
          <p className="text-base sm:text-lg font-bold text-[#163832] tracking-tight mt-1 truncate">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
        </div>
      </div>

      {/* Filter and Action Toolbar */}
      <div className="bg-white p-4 rounded-[16px] border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-[#8EB69B] absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari guru..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-[12px] text-xs font-bold text-[#051F20] focus:outline-none focus:ring-2 focus:ring-[#163832]"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-[12px] border border-slate-200 shrink-0">
            {['ALL', 'SMP', 'MA', 'PESANTREN'].map((unit) => (
              <button
                key={unit}
                onClick={() => setUnitFilter(unit)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  unitFilter === unit
                    ? 'bg-white text-[#163832] shadow-xs'
                    : 'text-[#8EB69B] hover:text-[#051F20]'
                }`}
              >
                {unit === 'ALL' ? 'Semua' : unit}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-[#051F20] px-4 py-2.5 rounded-[12px] text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-xs uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5 text-[#051F20]" strokeWidth={2} />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setShowOfficialPdfModal(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-[#051F20] hover:bg-[#163832] text-white px-4 py-2.5 rounded-[12px] text-xs font-bold shadow-xs transition-all cursor-pointer uppercase tracking-wider"
          >
            <Printer className="w-3.5 h-3.5 text-white" strokeWidth={2} />
            <span>Cetak Rekap PDF</span>
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-[16px] border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#8EB69B] font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-9">No</th>
                <th className="py-3 px-4">Nama & NIP</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Gaji Pokok</th>
                <th className="py-3 px-4 text-center">JP</th>
                <th className="py-3 px-4 text-right">Honor JP</th>
                <th className="py-3 px-4 text-right">Honor Tahfidz</th>
                <th className="py-3 px-4 text-center">Hadir</th>
                <th className="py-3 px-4 text-right">Transport</th>
                <th className="py-3 px-4 text-right">Potongan</th>
                <th className="py-3 px-4 text-right">Gaji Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#051F20]">
              {filteredItems.map((item, idx) => (
                <tr key={item.teacher.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#051F20]">{item.teacher.name}</p>
                    <p className="text-[10px] text-[#8EB69B] font-semibold font-mono mt-0.5">{item.teacher.nip}</p>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[9px] font-bold text-[#163832] bg-slate-100 px-2 py-1 rounded-[8px] uppercase tracking-wider">
                      {item.teacher.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#051F20]">
                    {formatRupiah(item.baseSalary)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#163832]">
                    {item.totalTaughtHours}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#8EB69B]">
                    {formatRupiah(item.teachingHonorarium)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#8EB69B]">
                    {formatRupiah(item.tahfidzHonorarium || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#163832]">
                    {item.totalPresentDays}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#051F20]">
                    {formatRupiah(item.totalTransport)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-500">
                    {item.totalDeductions > 0 ? `-${formatRupiah(item.totalDeductions)}` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#163832] whitespace-nowrap">
                    {formatRupiah(item.netSalary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official PDF Report Modal */}
      {showOfficialPdfModal && (
        <AdminOfficialReportModal
          initialType="payroll_recap"
          onClose={() => setShowOfficialPdfModal(false)}
        />
      )}
    </div>
  );
};

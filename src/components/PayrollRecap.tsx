import React, { useState } from 'react';
import { Download, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, exportToCSV } from '../utils/formatters';
import { AdminOfficialReportModal } from './AdminOfficialReportModal';

export const PayrollRecap: React.FC = () => {
  const { 
    calculateAllPayroll, 
    selectedPeriod, 
    setSelectedPeriod 
  } = useHRIS();

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [showOfficialPdfModal, setShowOfficialPdfModal] = useState(false);

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
      {/* Aggregate Payroll Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Gaji Pokok</span>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.baseSalary, 0))}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Honor Mengajar</span>
          <p className="text-base font-semibold text-emerald-800 dark:text-emerald-400 mt-1 font-mono">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.teachingHonorarium, 0))}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Uang Transport</span>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.totalTransport, 0))}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Potongan SOP</span>
          <p className="text-base font-semibold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            -{formatRupiah(payrollSummary.totalDeductions)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Total Bersih</span>
          <p className="text-base font-semibold text-emerald-800 dark:text-emerald-400 mt-1 font-mono">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
        </div>
      </div>

      {/* Filter and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari guru..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            {['ALL', 'SMP', 'MA', 'PESANTREN'].map((unit) => (
              <button
                key={unit}
                onClick={() => setUnitFilter(unit)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  unitFilter === unit
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {unit === 'ALL' ? 'Semua' : unit}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setShowOfficialPdfModal(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap PDF</span>
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/70 dark:border-slate-700">
                <th className="py-2.5 px-3 text-center w-9">No</th>
                <th className="py-2.5 px-4">Nama & NIP</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                <th className="py-2.5 px-3 text-center">JP</th>
                <th className="py-2.5 px-3 text-right">Honor JP</th>
                <th className="py-2.5 px-3 text-center">Hadir</th>
                <th className="py-2.5 px-3 text-right">Transport</th>
                <th className="py-2.5 px-3 text-right">Potongan</th>
                <th className="py-2.5 px-4 text-right">Gaji Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredItems.map((item, idx) => (
                <tr key={item.teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-center text-slate-400 dark:text-slate-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.teacher.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{item.teacher.nip}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {item.teacher.unit}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                    {formatRupiah(item.baseSalary)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-900 dark:text-slate-100">
                    {item.totalTaughtHours}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400 font-medium">
                    {formatRupiah(item.teachingHonorarium)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-900 dark:text-slate-100">
                    {item.totalPresentDays}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                    {formatRupiah(item.totalTransport)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                    {item.totalDeductions > 0 ? `-${formatRupiah(item.totalDeductions)}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-800 dark:text-emerald-400 whitespace-nowrap">
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

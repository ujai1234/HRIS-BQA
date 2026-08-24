import React, { useState } from 'react';
import { Download, Printer, Search } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, exportToCSV } from '../utils/formatters';

export const PayrollRecap: React.FC = () => {
  const { 
    calculateAllPayroll, 
    selectedPeriod, 
    setSelectedPeriod 
  } = useHRIS();

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');

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

  // Handle Export to Excel / CSV
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
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Aggregate Payroll Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Total Gaji Pokok</span>
          <p className="text-base font-bold text-slate-900 mt-1">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.baseSalary, 0))}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Honor Mengajar</span>
          <p className="text-base font-bold text-emerald-800 mt-1">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.teachingHonorarium, 0))}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Transport</span>
          <p className="text-base font-bold text-slate-800 mt-1">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.totalTransport, 0))}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Potongan Disiplin</span>
          <p className={`text-base font-bold mt-1 ${payrollSummary.totalDeductions > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {payrollSummary.totalDeductions > 0 ? `-${formatRupiah(payrollSummary.totalDeductions)}` : 'Rp 0'}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-900 block">Total Gaji Bersih</span>
          <p className="text-base font-bold text-emerald-950 mt-1">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama guru, NIP, atau jabatan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
          </div>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-600 shadow-2xs cursor-pointer"
          >
            <option value="Agustus 2026">Agustus 2026</option>
            <option value="Juli 2026">Juli 2026</option>
            <option value="Juni 2026">Juni 2026</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor</span>
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          {['ALL', 'SMP', 'MA', 'PESANTREN', 'UMUM'].map((unit) => (
            <button
              key={unit}
              onClick={() => setUnitFilter(unit)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                unitFilter === unit
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {unit === 'ALL' ? 'Semua' : unit}
            </button>
          ))}
        </div>
      </div>

      {/* Payroll Table without Slip Column */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-semibold">
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-4 min-w-[170px]">Nama & NIP</th>
                <th className="py-2.5 px-3">Jabatan & Unit</th>
                <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                <th className="py-2.5 px-3 text-center">JP</th>
                <th className="py-2.5 px-3 text-right">Honor</th>
                <th className="py-2.5 px-3 text-center">Hadir</th>
                <th className="py-2.5 px-3 text-right">Transport</th>
                <th className="py-2.5 px-3 text-right">Potongan</th>
                <th className="py-2.5 px-4 text-right font-bold text-slate-900">
                  Gaji Bersih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item, index) => (
                <tr
                  key={item.teacher.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-4">
                    <p className="font-semibold text-slate-900">
                      {item.teacher?.name || '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {item.teacher?.nip || '-'}
                    </p>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-slate-800">{item.teacher.position}</p>
                    <p className="text-[10px] text-slate-400">{item.teacher.unit}</p>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                    {formatRupiah(item.baseSalary)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium">
                    {item.totalTaughtHours}
                    {item.totalBadalHours > 0 && (
                      <span className="text-[10px] text-purple-700 block">
                        (+{item.totalBadalHours})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-emerald-800">
                    {formatRupiah(item.teachingHonorarium)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {item.totalPresentDays} hr
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                    {formatRupiah(item.totalTransport)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {item.totalDeductions > 0 ? (
                      <span className="font-semibold text-rose-600">
                        -{formatRupiah(item.totalDeductions)}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-900">
                    {formatRupiah(item.netSalary)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Footer */}
            <tfoot>
              <tr className="bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200/80">
                <td colSpan={3} className="py-2.5 px-4 text-left text-xs">
                  Total ({filteredItems.length} Guru)
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatRupiah(filteredItems.reduce((s, i) => s + i.baseSalary, 0))}
                </td>
                <td className="py-2.5 px-3 text-center font-mono">
                  {filteredItems.reduce((s, i) => s + i.totalTaughtHours, 0)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-800">
                  {formatRupiah(filteredItems.reduce((s, i) => s + i.teachingHonorarium, 0))}
                </td>
                <td className="py-2.5 px-3 text-center font-mono">
                  {filteredItems.reduce((s, i) => s + i.totalPresentDays, 0)} hr
                </td>
                <td className="py-2.5 px-3 text-right text-slate-800">
                  {formatRupiah(filteredItems.reduce((s, i) => s + i.totalTransport, 0))}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700">
                  -{formatRupiah(filteredItems.reduce((s, i) => s + i.totalDeductions, 0))}
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-950 font-bold">
                  {formatRupiah(filteredItems.reduce((s, i) => s + i.netSalary, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  CreditCard, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  ChevronRight, 
  FileSpreadsheet, 
  Building2, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { TeacherPayrollItem } from '../types';
import { SalarySlipModal } from './SalarySlipModal';
import { formatRupiah, formatNumber, exportToCSV } from '../utils/formatters';

export const PayrollRecap: React.FC = () => {
  const { 
    calculateAllPayroll, 
    selectedPeriod, 
    setSelectedPeriod 
  } = useHRIS();

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [selectedTeacherPayroll, setSelectedTeacherPayroll] = useState<TeacherPayrollItem | null>(null);

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
      'Gaji Bersih (Take Home Pay)',
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

    // Summary row
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

    exportToCSV(`Rekapitulasi_Gaji_Pesantren_Baitul_Quran_${selectedPeriod.replace(/\s+/g, '_')}.csv`, [
      headers,
      ...rows,
    ]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <span>Laporan & Rekapitulasi Gaji</span>
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-800 font-bold"
            >
              <option value="Agustus 2026">Agustus 2026</option>
              <option value="Juli 2026">Juli 2026</option>
              <option value="Juni 2026">Juni 2026</option>
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Aggregate Payroll Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Gaji Pokok
          </span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.baseSalary, 0))}
          </p>
          <span className="text-[10px] text-slate-400">23 Guru / Asatidz</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Honor Mengajar
          </span>
          <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.teachingHonorarium, 0))}
          </p>
          <span className="text-[10px] text-slate-400">
            {payrollSummary.totalTeachingHours} Total Jam Pelajaran (JP)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Uang Transport
          </span>
          <p className="text-lg sm:text-xl font-bold text-teal-700 mt-1">
            {formatRupiah(payrollSummary.items.reduce((s, i) => s + i.totalTransport, 0))}
          </p>
          <span className="text-[10px] text-slate-400">Rp 10.000 per hari hadir</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Potongan Denda
          </span>
          <p className={`text-lg sm:text-xl font-bold mt-1 ${payrollSummary.totalDeductions > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {payrollSummary.totalDeductions > 0 ? `-${formatRupiah(payrollSummary.totalDeductions)}` : 'Rp 0'}
          </p>
          <span className="text-[10px] text-slate-400">Terlambat & Jurnal Kosong</span>
        </div>

        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-slate-900 p-4 rounded-xl text-white shadow-xs border border-slate-800">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Total Gaji Bersih
          </span>
          <p className="text-lg sm:text-xl font-bold text-white mt-1">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <span className="text-[10px] text-slate-400">Anggaran Payroll Periode Ini</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, atau jabatan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Unit Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-1">Unit:</span>
          {['ALL', 'SMP', 'MA', 'PESANTREN', 'UMUM'].map((unit) => (
            <button
              key={unit}
              onClick={() => setUnitFilter(unit)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                unitFilter === unit
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {unit === 'ALL' ? 'Semua Unit' : unit}
            </button>
          ))}
        </div>
      </div>

      {/* Full Payroll Table of 23 Teachers */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-4 min-w-[200px]">NIP & Nama Guru</th>
                <th className="py-3 px-3 min-w-[140px]">Jabatan & Unit</th>
                <th className="py-3 px-3 text-right">Gaji Pokok</th>
                <th className="py-3 px-3 text-center">Jam (JP)</th>
                <th className="py-3 px-3 text-right">Honor Jam</th>
                <th className="py-3 px-3 text-center">Hadir</th>
                <th className="py-3 px-3 text-right">Transport</th>
                <th className="py-3 px-3 text-right text-rose-600">Potongan</th>
                <th className="py-3 px-4 text-right text-emerald-800 bg-emerald-50/50 font-bold">
                  Gaji Bersih
                </th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item, index) => (
                <tr
                  key={item.teacher.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-3 px-3 text-center text-slate-400 font-mono">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${item.teacher?.avatarColor || 'bg-emerald-600'} flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs`}>
                        {item.teacher?.name ? item.teacher.name.split(' ')[0]?.[0] : 'U'}
                        {item.teacher?.name ? (item.teacher.name.split(' ')[1]?.[0] || 'A') : 'A'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.teacher?.name || '-'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {item.teacher?.nip || '-'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800 block">{item.teacher.position}</span>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                      {item.teacher.unit}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {formatRupiah(item.baseSalary)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                    {item.totalTaughtHours} JP
                    {item.totalBadalHours > 0 && (
                      <span className="block text-[10px] text-purple-600 font-semibold">
                        (+{item.totalBadalHours} Badal)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                    {formatRupiah(item.teachingHonorarium)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                    {item.totalPresentDays} hr
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-teal-700">
                    {formatRupiah(item.totalTransport)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {item.totalDeductions > 0 ? (
                      <div>
                        <span className="font-bold text-rose-600">
                          -{formatRupiah(item.totalDeductions)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {item.latePenaltyTotal > 0 && `T:${formatNumber(item.latePenaltyTotal)} `}
                          {item.emptyJournalPenalty > 0 && `J:${formatNumber(item.emptyJournalPenalty)} `}
                          {item.alphaPenalty > 0 && `A:${formatNumber(item.alphaPenalty)}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-900 bg-emerald-50/30 text-xs">
                    {formatRupiah(item.netSalary)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedTeacherPayroll(item)}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-semibold text-xs transition-colors shadow-2xs"
                      title="Lihat & Cetak Slip Gaji"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Footer / Aggregates */}
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td colSpan={3} className="py-3.5 px-4 text-left uppercase tracking-wider text-xs">
                  TOTAL KESELURUHAN ({filteredItems.length} GURU)
                </td>
                <td className="py-3.5 px-3 text-right">
                  {formatRupiah(filteredItems.reduce((s, i) => s + i.baseSalary, 0))}
                </td>
                <td className="py-3.5 px-3 text-center font-mono">
                  {filteredItems.reduce((s, i) => s + i.totalTaughtHours, 0)} JP
                </td>
                <td className="py-3.5 px-3 text-right text-emerald-800">
                  {formatRupiah(filteredItems.reduce((s, i) => s + i.teachingHonorarium, 0))}
                </td>
                <td className="py-3.5 px-3 text-center font-mono">
                  {filteredItems.reduce((s, i) => s + i.totalPresentDays, 0)} hr
                </td>
                <td className="py-3.5 px-3 text-right text-teal-800">
                  {formatRupiah(filteredItems.reduce((s, i) => s + i.totalTransport, 0))}
                </td>
                <td className="py-3.5 px-3 text-right text-rose-700">
                  -{formatRupiah(filteredItems.reduce((s, i) => s + i.totalDeductions, 0))}
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-950 font-bold text-xs bg-emerald-100/60">
                  {formatRupiah(filteredItems.reduce((s, i) => s + i.netSalary, 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>


      {/* Salary Slip Modal */}
      {selectedTeacherPayroll && (
        <SalarySlipModal
          payroll={selectedTeacherPayroll}
          onClose={() => setSelectedTeacherPayroll(null)}
        />
      )}
    </div>
  );
};

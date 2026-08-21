import React, { useState } from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  Calendar, 
  Printer, 
  Download,
  AlertTriangle,
  Building2,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { SalarySlipModal } from './SalarySlipModal';
import { TeacherPayrollItem } from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';

export const KepsekAuditView: React.FC = () => {
  const { 
    teachers, 
    attendances, 
    schedules, 
    selectedPeriod, 
    calculateAllPayroll,
    currentUser 
  } = useHRIS();

  const [selectedSlip, setSelectedSlip] = useState<TeacherPayrollItem | null>(null);
  const payrollSummary = calculateAllPayroll(selectedPeriod);

  // Analytics
  const totalRecorded = attendances.length;
  const completedJournals = attendances.filter((a) => a.status === 'SELESAI').length;
  const pendingJournals = attendances.filter((a) => a.status === 'HADIR_JURNAL_KOSONG').length;
  const journalComplianceRate = totalRecorded > 0 ? Math.round((completedJournals / totalRecorded) * 100) : 95;

  const onTimeAttendance = attendances.filter((a) => a.lateCategory === 'TEPAT_WAKTU').length;
  const punctualityRate = totalRecorded > 0 ? Math.round((onTimeAttendance / totalRecorded) * 100) : 92;

  return (
    <div className="space-y-6">
      {/* Leadership Header Banner */}
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl p-6 text-white shadow-xs border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-emerald-600/20 flex items-center justify-center text-white border border-emerald-500/30">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Dashboard Pimpinan Lembaga
                </span>
                <span className="text-xs text-slate-300">
                  Kepala Sekolah & Kepesantrenan
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Audit Ketaatan Jurnal & Ringkasan Eksekutif
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pimpinan Aktif: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.position}) • Periode: {selectedPeriod}
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan Ketaatan (PDF)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tingkat Ketaatan Jurnal</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {journalComplianceRate}%
            </p>
            <span className="text-[11px] text-slate-400">
              {completedJournals} terisi dari {totalRecorded} sesi
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kedisiplinan Waktu</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">
              {punctualityRate}%
            </p>
            <span className="text-[11px] text-slate-400">
              {onTimeAttendance} sesi tepat waktu (≤4 min)
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Jurnal Tertunda</p>
            <p className={`text-2xl font-bold mt-1 ${pendingJournals > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {pendingJournals} Sesi
            </p>
            <span className="text-[11px] text-slate-400">Potensi potongan 50% honor</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Anggaran Payroll</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {formatRupiah(payrollSummary.totalNet)}
            </p>
            <span className="text-[11px] text-slate-400">23 Tenaga Pendidik</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Leadership Audit Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Daftar Kepatuhan & Disiplin Guru (23 Asatidz)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluasi kinerja asatidz: beban mengajar, kehadiran, pengisian jurnal, dan gaji bersih.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-4">Nama Asatidz & NIP</th>
                <th className="py-3 px-3">Jabatan & Unit</th>
                <th className="py-3 px-3 text-center">Beban Jam (JP)</th>
                <th className="py-3 px-3 text-center">Kehadiran</th>
                <th className="py-3 px-3 text-center">Kepatuhan Jurnal</th>
                <th className="py-3 px-3 text-right">Potongan Denda</th>
                <th className="py-3 px-4 text-right">Gaji Bersih</th>
                <th className="py-3 px-3 text-center">Slip Gaji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payrollSummary.items.map((item, index) => {
                const hasPendingJournal = item.emptyJournalCount > 0;

                return (
                  <tr key={item.teacher.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${item.teacher.avatarColor || 'bg-emerald-600'} flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs`}>
                          {item.teacher.name.split(' ')[0]?.[0]}
                          {item.teacher.name.split(' ')[1]?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.teacher.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{item.teacher.nip}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 block">{item.teacher.position}</span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/80">
                        {item.teacher.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                      {item.totalTaughtHours} JP
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-700">
                      {item.totalPresentDays} Hari
                    </td>
                    <td className="py-3 px-3 text-center">
                      {hasPendingJournal ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          {item.emptyJournalCount} Tertunda
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          100% Taat
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">
                      {item.totalDeductions > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          -{formatRupiah(item.totalDeductions)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Rp 0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-950 bg-emerald-50/40">
                      {formatRupiah(item.netSalary)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedSlip(item)}
                        className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold shadow-xs"
                      >
                        <span>Lihat Slip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Modal */}
      {selectedSlip && (
        <SalarySlipModal
          payroll={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}
    </div>
  );
};

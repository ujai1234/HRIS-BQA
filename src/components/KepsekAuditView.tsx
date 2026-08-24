import React from 'react';
import { 
  Printer, 
  Search
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah } from '../utils/formatters';

export const KepsekAuditView: React.FC = () => {
  const { 
    attendances, 
    selectedPeriod, 
    calculateAllPayroll
  } = useHRIS();

  const payrollSummary = calculateAllPayroll(selectedPeriod);

  // Analytics
  const totalRecorded = attendances.length;
  const completedJournals = attendances.filter((a) => a.status === 'SELESAI').length;
  const pendingJournals = attendances.filter((a) => a.status === 'HADIR_JURNAL_KOSONG').length;
  const journalComplianceRate = totalRecorded > 0 ? Math.round((completedJournals / totalRecorded) * 100) : 95;

  const onTimeAttendance = attendances.filter((a) => a.lateCategory === 'TEPAT_WAKTU').length;
  const punctualityRate = totalRecorded > 0 ? Math.round((onTimeAttendance / totalRecorded) * 100) : 92;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Tingkat Ketaatan Jurnal</span>
          <p className="text-xl font-bold text-emerald-800 mt-1">
            {journalComplianceRate}%
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {completedJournals} terisi dari {totalRecorded} sesi
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Kedisiplinan Waktu</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {punctualityRate}%
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {onTimeAttendance} sesi tepat waktu (≤4 min)
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Jurnal Tertunda</span>
          <p className={`text-xl font-bold mt-1 ${pendingJournals > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
            {pendingJournals} Sesi
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Potensi denda 50% honor KBM</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Kafa'ah Terhitung</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">23 Tenaga Pendidik</span>
        </div>
      </div>

      {/* Leadership Audit Table without Slip Column */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-4">Nama Asatidz & NIP</th>
                <th className="py-2.5 px-3">Jabatan & Unit</th>
                <th className="py-2.5 px-3 text-center">Beban (JP)</th>
                <th className="py-2.5 px-3 text-center">Kehadiran</th>
                <th className="py-2.5 px-3 text-center">Kepatuhan Jurnal</th>
                <th className="py-2.5 px-3 text-right">Potongan Disiplin</th>
                <th className="py-2.5 px-4 text-right">Gaji Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payrollSummary.items.map((item, index) => {
                const hasPendingJournal = item.emptyJournalCount > 0;

                return (
                  <tr key={item.teacher?.id || index} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-slate-900">{item.teacher?.name || 'Guru'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{item.teacher?.nip || '-'}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-800">{item.teacher?.position || '-'}</p>
                      <p className="text-[10px] text-slate-400">{item.teacher?.unit || '-'}</p>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-800">
                      {item.totalTaughtHours} JP
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                      {item.totalPresentDays} Hari
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasPendingJournal ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {item.emptyJournalCount} Tertunda
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Lengkap
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {item.totalDeductions > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          -{formatRupiah(item.totalDeductions)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-950">
                      {formatRupiah(item.netSalary)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

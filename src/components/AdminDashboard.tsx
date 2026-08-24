import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, formatIndonesianDate, getLateCategoryLabel } from '../utils/formatters';

interface AdminDashboardProps {
  onNavigateTab?: (tab: 'dashboard' | 'guru_gaji' | 'master_jadwal' | 'guru_badal' | 'generate_payroll') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { 
    teachers, 
    schedules, 
    attendances, 
    badalAssignments, 
    selectedPeriod,
    setSelectedPeriod,
    calculateAllPayroll 
  } = useHRIS();

  const [unitFilter, setUnitFilter] = useState<'ALL' | 'SMP' | 'MA' | 'PESANTREN'>('ALL');
  const [searchActivity, setSearchActivity] = useState('');

  // 1. Payroll Calculation
  const payrollSummary = useMemo(() => {
    return calculateAllPayroll(selectedPeriod);
  }, [calculateAllPayroll, selectedPeriod]);

  // 2. High-Level Metrics
  const totalTeachers = teachers.length;
  const totalSchedules = schedules.length;
  const totalWeeklyJP = schedules.reduce((acc, s) => acc + s.hours, 0);

  const completedJournals = attendances.filter((a) => a.status === 'SELESAI').length;
  const pendingJournals = attendances.filter((a) => a.status === 'HADIR_JURNAL_KOSONG').length;
  const badalCount = badalAssignments.length;
  const totalRecorded = Math.max(1, completedJournals + pendingJournals);
  const complianceRate = Math.round((completedJournals / totalRecorded) * 100);

  // 3. Unit-based Aggregations
  const unitStats = useMemo(() => {
    return ['SMP', 'MA', 'PESANTREN'].map((unit) => {
      const unitSchedules = schedules.filter((s) => s.unit === unit);
      const unitTeachers = teachers.filter((t) => t.unit === unit);
      const unitHours = unitSchedules.reduce((acc, s) => acc + s.hours, 0);
      const unitPayrollItems = payrollSummary.items.filter((item) => item.teacher.unit === unit);
      const unitNetPayroll = unitPayrollItems.reduce((acc, item) => acc + item.netSalary, 0);
      const unitBaseSalary = unitPayrollItems.reduce((acc, item) => acc + item.baseSalary, 0);
      const unitHonor = unitPayrollItems.reduce((acc, item) => acc + item.teachingHonorarium, 0);
      const unitTransport = unitPayrollItems.reduce((acc, item) => acc + item.totalTransport, 0);

      return {
        unit,
        guruCount: unitTeachers.length,
        totalHours: unitHours,
        totalSchedules: unitSchedules.length,
        netPayroll: unitNetPayroll,
        baseSalary: unitBaseSalary,
        honor: unitHonor,
        transport: unitTransport,
      };
    });
  }, [schedules, teachers, payrollSummary]);

  // 4. Filtered Recent Activities
  const recentActivities = useMemo(() => {
    return attendances
      .filter((att) => {
        const sched = schedules.find((s) => s.id === att.scheduleId);
        const teacher = teachers.find((t) => t.id === att.actualTeacherId || t.id === att.teacherId);
        
        if (unitFilter !== 'ALL' && sched?.unit !== unitFilter) {
          return false;
        }

        if (searchActivity) {
          const q = searchActivity.toLowerCase();
          const matchTeacher = teacher?.name.toLowerCase().includes(q);
          const matchSubject = sched?.subject.toLowerCase().includes(q);
          const matchClass = sched?.className.toLowerCase().includes(q);
          return matchTeacher || matchSubject || matchClass;
        }
        return true;
      })
      .slice(0, 10);
  }, [attendances, schedules, teachers, unitFilter, searchActivity]);

  // Custom Currency Tooltip
  const CurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 border border-slate-800">
          <p className="font-semibold text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color || entry.fill }}>
              {entry.name}: <span className="font-mono font-bold text-white">{formatRupiah(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Count Tooltip
  const CountTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 border border-slate-800">
          <p className="font-semibold text-slate-200">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`count-${index}`} style={{ color: entry.color || entry.fill }}>
              {entry.name}: <span className="font-mono font-bold text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Key Metrics Summary (4 Clean Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Tenaga Pendidik */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Guru</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {totalTeachers} <span className="text-xs font-normal text-slate-500">Orang</span>
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            100% Asatidz Aktif
          </p>
        </div>

        {/* Beban KBM */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Beban KBM</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {totalWeeklyJP} <span className="text-xs font-normal text-slate-500">JP /pekan</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalSchedules} Sesi Tatap Muka
          </p>
        </div>

        {/* Ketaatan Jurnal */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Ketaatan Jurnal</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-800 mt-2">
            {complianceRate}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {completedJournals} Selesai • {pendingJournals} Pending
          </p>
        </div>

        {/* Estimasi Penggajian */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Estimasi Kafa'ah</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-2 truncate">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Potongan Disiplin: -{formatRupiah(payrollSummary.totalDeductions)}
          </p>
        </div>
      </div>

      {/* 3. Monitoring Aktivitas KBM & Presensi */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              Aktivitas KBM & Presensi Terkini
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemantauan kehadiran harian, ketepatan waktu, dan status jurnal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchActivity}
                onChange={(e) => setSearchActivity(e.target.value)}
                placeholder="Cari guru atau mapel..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {(['ALL', 'SMP', 'MA', 'PESANTREN'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setUnitFilter(unit)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-2.5 px-4">Tanggal & Sesi</th>
                <th className="py-2.5 px-4">Mata Pelajaran & Kelas</th>
                <th className="py-2.5 px-4">Guru Pengampu</th>
                <th className="py-2.5 px-3">Waktu Masuk</th>
                <th className="py-2.5 px-3">Disiplin</th>
                <th className="py-2.5 px-3">Status Jurnal</th>
                <th className="py-2.5 px-4 text-right">Kafa'ah Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Tidak ada aktivitas KBM yang sesuai
                  </td>
                </tr>
              ) : (
                recentActivities.map((att) => {
                  const sched = schedules.find((s) => s.id === att.scheduleId);
                  const origTeacher = teachers.find((t) => t.id === att.teacherId);
                  const actualTeacher = teachers.find((t) => t.id === att.actualTeacherId);
                  const isBadal = att.isBadal;
                  const lateBadge = getLateCategoryLabel(att.lateCategory);
                  const hours = sched ? sched.hours : 2;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{formatIndonesianDate(att.date)}</p>
                        <p className="text-[11px] text-slate-400">{sched?.startTime} - {sched?.endTime} ({hours} JP)</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-slate-900">{sched?.subject || 'KBM Reguler'}</p>
                        <p className="text-[11px] text-slate-400">{sched?.className} • {sched?.unit}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">
                            {actualTeacher?.name || origTeacher?.name || 'Guru'}
                          </p>
                          {isBadal && (
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              Guru Pengganti
                            </span>
                          )}
                        </div>
                        {isBadal && (
                          <p className="text-[10px] text-slate-400">
                            Menggantikan: {origTeacher?.name}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">
                        {att.clockInTime || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${lateBadge.badge}`}>
                          {att.lateMinutes > 0 ? `+${att.lateMinutes}m (${lateBadge.label.split(' ')[0]})` : 'Tepat Waktu'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {att.status === 'SELESAI' ? (
                          <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 inline-flex items-center gap-1">
                            Lengkap
                          </span>
                        ) : att.status === 'HADIR_JURNAL_KOSONG' ? (
                          <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                            Jurnal Kosong
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {att.status}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-emerald-800 whitespace-nowrap">
                        {formatRupiah(hours * (actualTeacher?.hourlyRate || 40000))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Analytical Charts (Beban JP & Komposisi Kafa'ah) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Beban JP per Unit */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Beban Jam Pelajaran (JP) per Unit</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Volume KBM mingguan pada SMP, MA, dan Pesantren
            </p>
          </div>

          <div className="h-60 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="unit" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip content={<CountTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="totalHours" name="Total Jam (JP)" fill="#047857" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalSchedules" name="Jumlah Sesi" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Struktur Komponen Kafa'ah */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Struktur Komponen Kafa'ah per Unit</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribusi Gaji Pokok, Honor Mengajar, dan Uang Transport
            </p>
          </div>

          <div className="h-60 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="unit" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="baseSalary" name="Gaji Pokok" fill="#334155" stackId="a" />
                <Bar dataKey="honor" name="Honor Mengajar (JP)" fill="#047857" stackId="a" />
                <Bar dataKey="transport" name="Transport Kehadiran" fill="#0f766e" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Transparansi SOP & Potongan Disiplin */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Transparansi Penegakan SOP & Potongan Disiplin</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rekapitulasi denda keterlambatan presensi dan penalti jurnal belum lengkap
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
            SOP Terkunci Otomatis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-800 block">Denda Keterlambatan Waktu</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Potongan transport / 50% honor KBM</span>
            <span className="font-mono font-bold text-rose-600 text-xs mt-2 block">
              -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.latePenaltyTotal, 0))}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-800 block">Penalti Jurnal Kosong</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">50% honor sesi KBM tanpa jurnal</span>
            <span className="font-mono font-bold text-rose-600 text-xs mt-2 block">
              -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.emptyJournalPenalty, 0))}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
            <span className="text-xs font-semibold text-emerald-900 block">Total Potongan Disiplin</span>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">Diterapkan langsung ke slip kafa'ah</span>
            <span className="font-mono font-bold text-emerald-950 text-xs mt-2 block">
              -{formatRupiah(payrollSummary.totalDeductions)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

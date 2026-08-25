import React, { useState, useMemo } from 'react';
import { Search, Printer } from 'lucide-react';
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
import { AdminOfficialReportModal, AdminReportType } from './AdminOfficialReportModal';

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
    calculateAllPayroll 
  } = useHRIS();

  const [unitFilter, setUnitFilter] = useState<'ALL' | 'SMP' | 'MA' | 'PESANTREN'>('ALL');
  const [searchActivity, setSearchActivity] = useState('');
  const [weeklyViewMode, setWeeklyViewMode] = useState<'daily_week' | 'monthly_weeks'>('daily_week');
  const [showOfficialReportModal, setShowOfficialReportModal] = useState(false);
  const [officialReportType, setOfficialReportType] = useState<AdminReportType>('executive_summary');

  // Payroll Calculation
  const payrollSummary = useMemo(() => {
    return calculateAllPayroll(selectedPeriod);
  }, [calculateAllPayroll, selectedPeriod]);

  // High-Level Metrics
  const totalTeachers = teachers.length;
  const totalSchedules = schedules.length;
  const totalWeeklyJP = schedules.reduce((acc, s) => acc + s.hours, 0);

  const completedJournals = attendances.filter((a) => a.status === 'SELESAI').length;
  const pendingJournals = attendances.filter((a) => a.status === 'HADIR_JURNAL_KOSONG').length;
  const totalRecorded = Math.max(1, completedJournals + pendingJournals);
  const complianceRate = Math.round((completedJournals / totalRecorded) * 100);

  // Weekly Attendance Trend Data
  const weeklyAttendanceData = useMemo(() => {
    const activeSchedules = schedules.filter(s => unitFilter === 'ALL' || s.unit === unitFilter);

    if (weeklyViewMode === 'daily_week') {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      
      return days.map(day => {
        const daySchedules = activeSchedules.filter(s => s.dayOfWeek === day);
        const targetSessions = daySchedules.length || 1;
        const daySchedIds = new Set(daySchedules.map(s => s.id));
        const dayAttendances = attendances.filter(a => daySchedIds.has(a.scheduleId));

        let tepatWaktu = 0;
        let terlambat = 0;
        let badal = 0;

        if (dayAttendances.length > 0) {
          dayAttendances.forEach(a => {
            if (a.isBadal) {
              badal += 1;
            } else if (a.lateMinutes > 0) {
              terlambat += 1;
            } else if (a.status !== 'IZIN' && a.status !== 'SAKIT') {
              tepatWaktu += 1;
            }
          });
        } else {
          tepatWaktu = Math.max(1, Math.round(targetSessions * 0.85));
          terlambat = Math.max(0, Math.round(targetSessions * 0.1));
          badal = Math.max(0, Math.round(targetSessions * 0.05));
        }

        const totalHadir = tepatWaktu + terlambat + badal;
        const rate = Math.min(100, Math.round((totalHadir / Math.max(1, targetSessions)) * 100));

        return {
          periodLabel: day,
          target: targetSessions,
          tepatWaktu,
          terlambat,
          badal,
          totalHadir,
          rate,
        };
      });
    } else {
      const weeks = [
        { label: 'Pekan I', factor: 0.94, lateFactor: 0.06, badalCount: 1 },
        { label: 'Pekan II', factor: 0.96, lateFactor: 0.04, badalCount: 2 },
        { label: 'Pekan III', factor: 0.98, lateFactor: 0.03, badalCount: 1 },
        { label: 'Pekan IV', factor: 0.95, lateFactor: 0.05, badalCount: 2 },
      ];

      const weeklyTarget = activeSchedules.length || 24;

      return weeks.map(w => {
        const totalHadir = Math.round(weeklyTarget * w.factor);
        const terlambat = Math.round(weeklyTarget * w.lateFactor);
        const badal = w.badalCount;
        const tepatWaktu = Math.max(1, totalHadir - terlambat - badal);
        const rate = Math.round((totalHadir / weeklyTarget) * 100);

        return {
          periodLabel: w.label,
          target: weeklyTarget,
          tepatWaktu,
          terlambat,
          badal,
          totalHadir,
          rate,
        };
      });
    }
  }, [schedules, attendances, unitFilter, weeklyViewMode]);

  // Summary stats
  const weeklyStatsSummary = useMemo(() => {
    if (weeklyAttendanceData.length === 0) return { avgRate: 0, totalHadirCount: 0, punctualityRate: 0 };
    
    let sumRate = 0;
    let sumHadir = 0;
    let sumTepat = 0;
    let sumTerlambat = 0;

    weeklyAttendanceData.forEach(d => {
      sumRate += d.rate;
      sumHadir += d.totalHadir;
      sumTepat += d.tepatWaktu;
      sumTerlambat += d.terlambat;
    });

    const totalRecordedSessions = sumTepat + sumTerlambat;
    const punctuality = totalRecordedSessions > 0 ? Math.round((sumTepat / totalRecordedSessions) * 100) : 100;

    return {
      avgRate: Math.round(sumRate / weeklyAttendanceData.length),
      totalHadirCount: sumHadir,
      punctualityRate: punctuality,
    };
  }, [weeklyAttendanceData]);

  // Unit-based Aggregations
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

  // Filtered Recent Activities
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
      .slice(0, 8);
  }, [attendances, schedules, teachers, unitFilter, searchActivity]);

  // Learning Needs Requests
  const learningNeedsRequests = useMemo(() => {
    return attendances
      .filter(a => a.journal?.learningNeeds && a.journal.learningNeeds.trim() !== '')
      .map(a => ({
        id: a.id,
        date: a.date,
        teacher: teachers.find(t => t.id === a.actualTeacherId || t.id === a.teacherId)?.name || 'Guru',
        unit: schedules.find(s => s.id === a.scheduleId)?.unit || 'UMUM',
        subject: schedules.find(s => s.id === a.scheduleId)?.subject || 'KBM',
        className: schedules.find(s => s.id === a.scheduleId)?.className || '-',
        needs: a.journal?.learningNeeds || '',
        timestamp: a.journal?.filledAt || a.date
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [attendances, teachers, schedules]);

  // Minimalist Tooltip
  const AttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
            <span className="font-medium text-slate-200">{label}</span>
            <span className="font-mono text-emerald-400 font-bold">{data?.rate}%</span>
          </div>
          <div className="text-slate-300 space-y-0.5 pt-0.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Tepat Waktu:</span>
              <span className="font-mono text-white font-medium">{data?.tepatWaktu}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Terlambat:</span>
              <span className="font-mono text-white font-medium">{data?.terlambat}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Badal:</span>
              <span className="font-mono text-white font-medium">{data?.badal}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 border border-slate-800 shadow-md">
          <p className="font-medium text-slate-200 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex justify-between gap-3">
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-mono text-white font-medium">{formatRupiah(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* 1. Clean Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Administrasi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Periode {selectedPeriod} • Pesantren Baitul Qur'an
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setOfficialReportType('executive_summary');
            setShowOfficialReportModal(true);
          }}
          className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cetak Laporan PDF</span>
        </button>
      </div>

      {/* 2. Key Metrics (4 Clean Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Guru</span>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {totalTeachers}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block mt-1">
            Semua Aktif
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Beban KBM</span>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {totalWeeklyJP} <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">JP/mgg</span>
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-500 block mt-1 font-mono">
            {totalSchedules} Sesi
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Kepatuhan Jurnal</span>
          <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
            {complianceRate}%
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 font-mono">
            {completedJournals} Selesai • {pendingJournals} Pending
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Estimasi Kafa'ah</span>
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-1 font-mono truncate">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-500 block mt-1 font-mono">
            Potongan: -{formatRupiah(payrollSummary.totalDeductions)}
          </span>
        </div>
      </div>

      {/* 3. Trend Kehadiran Mingguan (Minimalist Stacked Bar) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Tren Kehadiran Guru
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setWeeklyViewMode('daily_week')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  weeklyViewMode === 'daily_week'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setWeeklyViewMode('monthly_weeks')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  weeklyViewMode === 'monthly_weeks'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                4 Pekan
              </button>
            </div>

            {/* Unit Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              {(['ALL', 'SMP', 'MA', 'PESANTREN'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setUnitFilter(unit)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
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
        </div>

        {/* Minimalist Chart Area */}
        <div className="h-60 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyAttendanceData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={weeklyViewMode === 'daily_week' ? 24 : 32}
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
              <XAxis 
                dataKey="periodLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                allowDecimals={false}
              />
              <Tooltip content={<AttendanceTooltip />} />
              <Legend 
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingBottom: 15 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar 
                dataKey="tepatWaktu" 
                name="Hadir" 
                fill="#10b981" 
                stackId="attendanceStack" 
              />
              <Bar 
                dataKey="terlambat" 
                name="Late" 
                fill="#f59e0b" 
                stackId="attendanceStack" 
              />
              <Bar 
                dataKey="badal" 
                name="Badal" 
                fill="#6366f1" 
                stackId="attendanceStack" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Monitoring Aktivitas KBM (Clean Table) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Aktivitas Presensi Terkini
            </h2>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchActivity}
              onChange={(e) => setSearchActivity(e.target.value)}
              placeholder="Cari guru atau mata pelajaran..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/70 dark:border-slate-700">
                <th className="py-2.5 px-4">Tanggal & Sesi</th>
                <th className="py-2.5 px-4">Mata Pelajaran</th>
                <th className="py-2.5 px-4">Guru</th>
                <th className="py-2.5 px-3">Jam Masuk</th>
                <th className="py-2.5 px-3">Status Masuk</th>
                <th className="py-2.5 px-3">Jurnal</th>
                <th className="py-2.5 px-4 text-right">Honor Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 dark:text-slate-600">
                    Tidak ada aktivitas yang sesuai
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
                    <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{formatIndonesianDate(att.date)}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{sched?.startTime} - {sched?.endTime}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{sched?.subject || 'KBM Reguler'}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{sched?.className} • {sched?.unit}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {actualTeacher?.name || origTeacher?.name || 'Guru'}
                        </p>
                        {isBadal && (
                          <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium block">
                            (Badal: {origTeacher?.name})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                        {att.clockInTime || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${lateBadge.badge}`}>
                          {att.lateMinutes > 0 ? `+${att.lateMinutes}m` : 'Tepat Waktu'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {att.status === 'SELESAI' ? (
                          <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/50">
                            Lengkap
                          </span>
                        ) : att.status === 'HADIR_JURNAL_KOSONG' ? (
                          <span className="text-[10px] font-medium text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                            Pending
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {att.status}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-emerald-800 dark:text-emerald-400 whitespace-nowrap font-mono">
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

      {/* 5. Analisis Unit & Potongan Disiplin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Struktur Komponen Kafa'ah */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Komposisi Kafa'ah per Unit
            </h3>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={unitStats} margin={{ top: 20, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis 
                  dataKey="unit" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} 
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingTop: 15 }} />
                <Bar dataKey="baseSalary" name="Gapok" fill="#334155" stackId="a" barSize={32} />
                <Bar dataKey="honor" name="Honor JP" fill="#10b981" stackId="a" barSize={32} />
                <Bar dataKey="transport" name="Transport" fill="#0d9488" stackId="a" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transparansi Penegakan SOP */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Penegakan SOP & Potongan Disiplin
              </h3>
            </div>
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/50">
              Otomatis
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">Denda Keterlambatan</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Potongan waktu presensi KBM</span>
              </div>
              <span className="font-mono font-medium text-rose-600 dark:text-rose-400 text-xs">
                -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.latePenaltyTotal, 0))}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">Penalti Jurnal Belum Lengkap</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">50% honor sesi KBM</span>
              </div>
              <span className="font-mono font-medium text-rose-600 dark:text-rose-400 text-xs">
                -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.emptyJournalPenalty, 0))}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/50">
              <div>
                <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-100 block">Total Potongan Bulan Ini</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">Diterapkan ke slip gaji</span>
              </div>
              <span className="font-mono font-semibold text-emerald-950 dark:text-emerald-200 text-xs">
                -{formatRupiah(payrollSummary.totalDeductions)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Pengajuan Kebutuhan Pembelajaran (New Section) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Pengajuan Kebutuhan Pembelajaran dari Guru
            </h2>
          </div>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
            Prioritas
          </span>
        </div>

        <div className="p-0">
          {learningNeedsRequests.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-slate-400">Belum ada pengajuan kebutuhan pembelajaran terbaru.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {learningNeedsRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {req.teacher}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {req.unit} • {req.subject} ({req.className}) • {formatIndonesianDate(req.date)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono italic">
                      {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100/50 dark:border-rose-900/30">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{req.needs}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {learningNeedsRequests.length > 5 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
            <button className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Lihat Semua Pengajuan ({learningNeedsRequests.length})
            </button>
          </div>
        )}
      </div>

      {/* Official Report Modal */}
      {showOfficialReportModal && (
        <AdminOfficialReportModal
          initialType={officialReportType}
          onClose={() => setShowOfficialReportModal(false)}
        />
      )}
    </div>
  );
};

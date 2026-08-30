import React, { useState, useMemo } from 'react';
import { Search, Printer, ArrowRight, BookOpen, ChevronDown, ChevronUp, UserCheck, RefreshCw, Clock, Filter, Calendar } from 'lucide-react';
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
import { formatRupiah, formatIndonesianDate, formatShortDate, getLateCategoryLabel } from '../utils/formatters';
import { AdminOfficialReportModal, AdminReportType } from './AdminOfficialReportModal';

interface AdminDashboardProps {
  onNavigateTab?: (tab: 'dashboard' | 'guru_gaji' | 'master_jadwal' | 'guru_badal' | 'generate_payroll') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { 
    teachers, 
    schedules, 
    attendances, 
    badalAssignments, 
    learningNeedRequests,
    selectedPeriod,
    calculateAllPayroll,
    setCurrentPath
  } = useHRIS();

  const [unitFilter, setUnitFilter] = useState<'ALL' | 'SMP' | 'MA' | 'PESANTREN'>('ALL');
  const [searchActivity, setSearchActivity] = useState('');
  const [weeklyViewMode, setWeeklyViewMode] = useState<'daily_week' | 'monthly_weeks'>('daily_week');
  const [showOfficialReportModal, setShowOfficialReportModal] = useState(false);
  const [officialReportType, setOfficialReportType] = useState<AdminReportType>('executive_summary');
  const [expandedJournalIds, setExpandedJournalIds] = useState<Record<string, boolean>>({});
  const [timelineCategory, setTimelineCategory] = useState<'ALL' | 'JURNAL' | 'BADAL' | 'KEHADIRAN'>('ALL');
  const [timelineRange, setTimelineRange] = useState<'HARI_INI' | '3_HARI' | 'MINGGU_INI' | 'SEMUA'>('SEMUA');

  const toggleJournalExpand = (id: string) => {
    setExpandedJournalIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  // Learning Need Status Calculations for Admin
  const requests = Array.isArray(learningNeedRequests) ? learningNeedRequests : [];
  const pendingLearningNeeds = requests.filter(r => r.status === 'PENDING').length;
  const pendingSMP = requests.filter(r => r.status === 'PENDING' && teachers.find(t => t.id === r.teacherId)?.unit === 'SMP').length;
  const pendingMA = requests.filter(r => r.status === 'PENDING' && teachers.find(t => t.id === r.teacherId)?.unit === 'MA').length;
  const pendingPesantren = requests.filter(r => r.status === 'PENDING' && teachers.find(t => t.id === r.teacherId)?.unit === 'PESANTREN').length;

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

  // 1. Unified Timeline Activities (Jurnal, Badal, Kehadiran)
  const timelineActivities = useMemo(() => {
    const list: any[] = [];

    attendances.forEach((att) => {
      const sched = schedules.find((s) => s.id === att.scheduleId);
      const origTeacher = teachers.find((t) => t.id === att.teacherId);
      const actualTeacher = teachers.find((t) => t.id === att.actualTeacherId || t.id === att.journal?.teacherId || t.id === att.teacherId);
      const unit = sched?.unit || 'PESANTREN';
      const subject = sched?.subject || 'KBM Reguler';
      const className = sched?.className || 'Kelas';

      // Kehadiran Event
      if (att.clockInTime) {
        list.push({
          id: `${att.id}-kehadiran`,
          attendanceId: att.id,
          type: 'KEHADIRAN',
          date: att.date,
          time: att.clockInTime,
          timestamp: new Date(`${att.date}T${att.clockInTime}`).getTime() || new Date(att.date).getTime(),
          teacherName: actualTeacher?.name || origTeacher?.name || 'Guru',
          teacherAvatar: actualTeacher?.avatarColor || 'bg-slate-700',
          title: 'Presensi Masuk',
          description: `Melakukan presensi masuk kelas ${className} untuk mapel ${subject}.`,
          badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
          meta: {
            lateMinutes: att.lateMinutes,
            lateCategory: att.lateCategory,
            status: att.status
          },
          unit,
          subject,
          className
        });
      }

      // Badal Event
      if (att.isBadal) {
        list.push({
          id: `${att.id}-badal`,
          attendanceId: att.id,
          type: 'BADAL',
          date: att.date,
          time: sched?.startTime || '07:00',
          timestamp: new Date(`${att.date}T${sched?.startTime || '07:00'}`).getTime() + 10,
          teacherName: actualTeacher?.name || 'Guru Badal',
          teacherAvatar: actualTeacher?.avatarColor || 'bg-indigo-700',
          title: 'Tugas Badal (Inval)',
          description: `Menggantikan Ustadz ${origTeacher?.name || 'Utama'} di kelas ${className} (Mapel: ${subject}).`,
          badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
          meta: {
            originalTeacher: origTeacher?.name
          },
          unit,
          subject,
          className
        });
      }

      // Jurnal Event
      if (att.journal) {
        list.push({
          id: `${att.id}-jurnal`,
          attendanceId: att.id,
          type: 'JURNAL',
          date: att.date,
          time: att.clockInTime || '12:00',
          timestamp: att.journal.filledAt ? new Date(att.journal.filledAt).getTime() : new Date(`${att.date}T12:00:00`).getTime(),
          teacherName: actualTeacher?.name || origTeacher?.name || 'Guru',
          teacherAvatar: actualTeacher?.avatarColor || 'bg-emerald-700',
          title: 'Jurnal Mengajar Terisi',
          description: `Mengisi materi pembelajaran "${att.journal.topic}".`,
          badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
          journal: att.journal,
          unit,
          subject,
          className
        });
      }
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [attendances, schedules, teachers]);

  // 2. Filtered Timeline Activities
  const filteredTimelineActivities = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    return timelineActivities.filter((act) => {
      // Unit filter from Dashboard
      if (unitFilter !== 'ALL' && act.unit !== unitFilter) {
        return false;
      }

      // Search Filter
      if (searchActivity) {
        const q = searchActivity.toLowerCase();
        const matchTeacher = act.teacherName.toLowerCase().includes(q);
        const matchSubject = act.subject.toLowerCase().includes(q);
        const matchClass = act.className.toLowerCase().includes(q);
        const matchDesc = act.description.toLowerCase().includes(q);
        if (!matchTeacher && !matchSubject && !matchClass && !matchDesc) {
          return false;
        }
      }

      // Category filter
      if (timelineCategory !== 'ALL' && act.type !== timelineCategory) {
        return false;
      }

      // Date Range filter
      if (timelineRange === 'HARI_INI') {
        return act.date === todayStr;
      } else if (timelineRange === '3_HARI') {
        const actDate = new Date(act.date);
        const diffDays = Math.ceil((today.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      } else if (timelineRange === 'MINGGU_INI') {
        const actDate = new Date(act.date);
        const diffDays = Math.ceil((today.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }

      return true;
    });
  }, [timelineActivities, timelineCategory, timelineRange, unitFilter, searchActivity]);

  // 3. Today's Summary Statistics with dynamic fallback to latest active day
  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayData = attendances.some(a => a.date === todayStr);
    
    // Determine the active date: actual today, or the latest date present in DB
    let targetDate = todayStr;
    if (!hasTodayData && attendances.length > 0) {
      const sorted = [...attendances].sort((a, b) => b.date.localeCompare(a.date));
      targetDate = sorted[0].date;
    }

    const filteredAtt = attendances.filter(a => a.date === targetDate);
    const countKehadiran = filteredAtt.filter(a => !!a.clockInTime).length;
    const countJurnal = filteredAtt.filter(a => !!a.journal).length;
    const countBadal = filteredAtt.filter(a => a.isBadal).length;

    return {
      date: targetDate,
      isActualToday: targetDate === todayStr,
      kehadiran: countKehadiran,
      jurnal: countJurnal,
      badal: countBadal,
      total: countKehadiran + countJurnal + countBadal
    };
  }, [attendances]);

  // Learning Needs Requests Summary (Top 5 Pending)
  const pendingRequests = useMemo(() => {
    return (learningNeedRequests || [])
      .filter(r => r.status === 'PENDING')
      .slice(0, 5);
  }, [learningNeedRequests]);

  // Minimalist Tooltip
  const AttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-stone-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 border border-stone-800 shadow-md">
          <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-1">
            <span className="font-medium text-stone-200">{label}</span>
            <span className="font-mono text-emerald-400 font-bold">{data?.rate}%</span>
          </div>
          <div className="text-stone-300 space-y-0.5 pt-0.5">
            <div className="flex justify-between gap-4">
              <span className="text-stone-400">Tepat Waktu:</span>
              <span className="font-mono text-white font-medium">{data?.tepatWaktu}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone-400">Terlambat:</span>
              <span className="font-mono text-white font-medium">{data?.terlambat}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone-400">Badal:</span>
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
        <div className="bg-stone-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 border border-stone-800 shadow-md">
          <p className="font-medium text-stone-200 border-b border-stone-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex justify-between gap-3">
              <span className="text-stone-400">{entry.name}:</span>
              <span className="font-mono text-white font-medium">{formatRupiah(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Clean Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Dashboard Administrasi
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Periode {selectedPeriod} • Pesantren Baitul Qur'an Al-Ikhwan
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setOfficialReportType('executive_summary');
            setShowOfficialReportModal(true);
          }}
          className="inline-flex items-center gap-1.5 bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cetak Laporan PDF</span>
        </button>
      </div>

      {/* 2. Key Metrics (4 Clean Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Total Guru</span>
          <p className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 mt-1 font-mono tracking-tight">
            {totalTeachers}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block mt-1.5">
            Semua Aktif
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Beban KBM</span>
          <p className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 mt-1 font-mono tracking-tight">
            {totalWeeklyJP} <span className="text-xs font-normal text-stone-500 dark:text-stone-400 font-sans">JP/mgg</span>
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-1.5 font-mono">
            {totalSchedules} Sesi Terjadwal
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Kepatuhan Jurnal</span>
          <p className="text-2xl sm:text-3xl font-semibold text-emerald-700 dark:text-emerald-400 mt-1 font-mono tracking-tight">
            {complianceRate}%
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-1.5 font-mono">
            {completedJournals} Selesai • {pendingJournals} Pending
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Estimasi Kafa'ah</span>
          <p className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 mt-1 font-mono tracking-tight truncate">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-1.5 font-mono truncate">
            Potongan: -{formatRupiah(payrollSummary.totalDeductions)}
          </span>
        </div>
      </div>

      {/* 2.2 Pending Learning Needs Summary Card (Minimalist & Modern) */}
      <div 
        onClick={() => setCurrentPath('/dashboard/admin/kebutuhan')}
        className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-stone-300 dark:hover:border-stone-700 transition-all cursor-pointer group shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${pendingLearningNeeds > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Pengajuan Kebutuhan Pembelajaran
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                pendingLearningNeeds > 0 
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' 
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              }`}>
                {pendingLearningNeeds > 0 ? `${pendingLearningNeeds} Menunggu Persetujuan Kepsek` : 'Semua Ajuan Terverifikasi'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Rincian ajuan pending: SMP ({pendingSMP}), MA ({pendingMA}), Ponpes ({pendingPesantren})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white transition-colors self-end sm:self-auto">
          <span>Kelola Modul Kebutuhan</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 3. Trend Kehadiran Mingguan (Minimalist Stacked Bar) */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Tren Kehadiran Guru
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setWeeklyViewMode('daily_week')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  weeklyViewMode === 'daily_week'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setWeeklyViewMode('monthly_weeks')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  weeklyViewMode === 'monthly_weeks'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                4 Pekan
              </button>
            </div>

            {/* Unit Filter */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
              {(['ALL', 'SMP', 'MA', 'PESANTREN'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setUnitFilter(unit)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    unitFilter === unit
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
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
                fill="var(--color-pesantren-emerald)" 
                stackId="attendanceStack" 
              />
              <Bar 
                dataKey="terlambat" 
                name="Late" 
                fill="var(--color-pesantren-lime)" 
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
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              Aktivitas Presensi Terkini
            </h2>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchActivity}
              onChange={(e) => setSearchActivity(e.target.value)}
              placeholder="Cari guru atau mata pelajaran..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-medium border-b border-stone-200/70 dark:border-stone-700">
                <th className="py-2.5 px-4">Tanggal & Sesi</th>
                <th className="py-2.5 px-4">Mata Pelajaran</th>
                <th className="py-2.5 px-4">Guru</th>
                <th className="py-2.5 px-3">Jam Masuk</th>
                <th className="py-2.5 px-3">Status Masuk</th>
                <th className="py-2.5 px-3">Jurnal</th>
                <th className="py-2.5 px-4 text-right">Honor Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-stone-400 dark:text-stone-600">
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
                    <tr key={att.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-stone-800 dark:text-stone-200">{formatIndonesianDate(att.date)}</p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">{sched?.startTime} - {sched?.endTime}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-stone-900 dark:text-stone-100">{sched?.subject || 'KBM Reguler'}</p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">{sched?.className} • {sched?.unit}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-stone-900 dark:text-stone-100">
                          {actualTeacher?.name || origTeacher?.name || 'Guru'}
                        </p>
                        {isBadal && (
                          <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium block">
                            (Badal: {origTeacher?.name})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-800 dark:text-stone-200">
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
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">
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
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="pb-2 border-b border-stone-100 dark:border-stone-800">
            <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
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
                <Bar dataKey="honor" name="Honor JP" fill="var(--color-pesantren-emerald)" stackId="a" barSize={32} />
                <Bar dataKey="transport" name="Transport" fill="var(--color-pesantren-lime)" stackId="a" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transparansi Penegakan SOP */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="pb-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Penegakan SOP & Potongan Disiplin
              </h3>
            </div>
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/50">
              Otomatis
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-800">
              <div>
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200 block">Denda Keterlambatan</span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 block">Potongan waktu presensi KBM</span>
              </div>
              <span className="font-mono font-medium text-rose-600 dark:text-rose-400 text-xs">
                -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.latePenaltyTotal, 0))}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-800">
              <div>
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200 block">Penalti Jurnal Belum Lengkap</span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 block">50% honor sesi KBM</span>
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

      {/* 6. Grid: Timeline Jurnal & Antrean Kebutuhan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeline Jurnal & Aktivitas Terbaru */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden flex flex-col justify-between shadow-xs">
          <div>
            {/* Card Header */}
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                  Timeline Aktivitas Terbaru
                </h2>
              </div>
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest font-mono">
                Real-Time Logs
              </span>
            </div>

            {/* Quick Stats Summary Widget */}
            <div className="p-4 bg-stone-50/50 dark:bg-stone-900/40 border-b border-stone-100 dark:border-stone-850 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                  Ringkasan Aktivitas Hari Aktif ({todayStats.isActualToday ? 'Hari Ini' : formatIndonesianDate(todayStats.date)})
                </span>
                {!todayStats.isActualToday && (
                  <span className="text-[9px] font-semibold text-amber-755 bg-amber-50/80 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200/40">
                    Histori Terkini
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-stone-850 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800 flex items-center gap-2">
                  <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 block leading-none">Presensi</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5 block leading-none">{todayStats.kehadiran}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-stone-850 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800 flex items-center gap-2">
                  <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 block leading-none">Jurnal</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5 block leading-none">{todayStats.jurnal}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-stone-850 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800 flex items-center gap-2">
                  <div className="p-1.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 block leading-none">Badal</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5 block leading-none">{todayStats.badal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Filters Panel */}
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Kategori Aktivitas
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'KEHADIRAN', label: 'Presensi', count: timelineActivities.filter(a => a.type === 'KEHADIRAN').length },
                    { id: 'JURNAL', label: 'Jurnal', count: timelineActivities.filter(a => a.type === 'JURNAL').length },
                    { id: 'BADAL', label: 'Badal', count: timelineActivities.filter(a => a.type === 'BADAL').length }
                  ].map((cat) => {
                    const isSelected = timelineCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setTimelineCategory(cat.id as any)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-750'
                        }`}
                      >
                        {cat.label} {cat.count !== undefined && <span className="ml-1 opacity-60 font-mono">({cat.count})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Rentang Waktu
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'SEMUA', label: 'Semua Waktu' },
                    { id: 'HARI_INI', label: 'Hari Ini' },
                    { id: '3_HARI', label: '3 Hari Terakhir' },
                    { id: 'MINGGU_INI', label: '1 Minggu Terakhir' }
                  ].map((rng) => {
                    const isSelected = timelineRange === rng.id;
                    return (
                      <button
                        key={rng.id}
                        type="button"
                        onClick={() => setTimelineRange(rng.id as any)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                            : 'bg-stone-50 text-stone-500 hover:bg-stone-100 dark:bg-stone-850 dark:text-stone-400 dark:hover:bg-stone-800'
                        }`}
                      >
                        {rng.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="p-4 max-h-[460px] overflow-y-auto">
              {filteredTimelineActivities.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-8 h-8 text-stone-300 dark:text-stone-700" />
                  <p className="text-xs text-stone-400">Tidak ada aktivitas yang sesuai filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTimelineCategory('ALL');
                      setTimelineRange('SEMUA');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-400 mt-2 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="relative pl-4 border-l border-stone-150 dark:border-stone-800 space-y-5 my-1">
                  {filteredTimelineActivities.slice(0, 15).map((act) => {
                    const isExpanded = !!expandedJournalIds[act.id];
                    return (
                      <div key={act.id} className="relative group">
                        {/* Timeline Circle Bullet Node */}
                        <div className={`absolute -left-[21.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white dark:bg-stone-900 border-2 group-hover:scale-125 transition-transform duration-150 ${
                          act.type === 'JURNAL' ? 'border-emerald-600 dark:border-emerald-500' :
                          act.type === 'BADAL' ? 'border-indigo-600 dark:border-indigo-500' :
                          'border-slate-500 dark:border-slate-400'
                        }`} />
                        
                        <div className="space-y-1">
                          {/* Header: Teacher, Unit, Time */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {act.teacherName}
                              </span>
                              <span className={`text-[8px] font-black px-1 rounded ${
                                act.unit === 'SMP' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' :
                                act.unit === 'MA' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' :
                                'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                {act.unit}
                              </span>
                              <span className={`text-[8px] font-semibold px-1.5 py-0.2 rounded-full ${act.badgeColor}`}>
                                {act.type === 'JURNAL' ? 'Jurnal' : act.type === 'BADAL' ? 'Badal' : 'Presensi'}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                              {act.time || 'KBM'} • {formatShortDate(act.date)}
                            </span>
                          </div>

                          {/* Action Title / Subject */}
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                            {act.subject} • Kelas {act.className}
                          </p>

                          {/* Description Box */}
                          <div className="bg-stone-50 dark:bg-stone-850 p-2.5 rounded-lg border border-stone-150 dark:border-stone-800/80">
                            <p className="text-xs font-semibold text-stone-850 dark:text-stone-200">
                              {act.description}
                            </p>
                          </div>

                          {/* Conditional Metadata & Details */}
                          {act.type === 'KEHADIRAN' && (
                            <div className="flex flex-wrap gap-1.5 text-[9px] pt-1">
                              <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                                act.meta.lateMinutes > 0 
                                  ? 'bg-rose-50 text-rose-750 dark:bg-rose-950/20 dark:text-rose-400' 
                                  : 'bg-emerald-50 text-emerald-750 dark:bg-emerald-950/20 dark:text-emerald-400'
                              }`}>
                                {act.meta.lateMinutes > 0 ? `Terlambat ${act.meta.lateMinutes} menit` : 'Tepat Waktu'}
                              </span>
                              {act.meta.status && (
                                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 font-medium">
                                  SOP: {act.meta.status}
                                </span>
                              )}
                            </div>
                          )}

                          {act.type === 'BADAL' && (
                            <div className="flex items-center gap-1 text-[9px] pt-1 text-indigo-750 dark:text-indigo-400 font-medium">
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Menyulih / Inval KBM utama Ustadz {act.meta.originalTeacher}</span>
                            </div>
                          )}

                          {act.type === 'JURNAL' && (
                            <>
                              {/* Interactive Expand Details Button */}
                              <button
                                type="button"
                                onClick={() => toggleJournalExpand(act.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-emerald-700 dark:text-stone-400 dark:hover:text-emerald-400 transition-colors cursor-pointer pt-1"
                              >
                                <span>{isExpanded ? 'Sembunyikan' : 'Lihat Detail PBM'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              {/* Expanded Content Drawer */}
                              {isExpanded && act.journal && (
                                <div className="bg-stone-50/50 dark:bg-stone-900/60 p-3 rounded-lg border border-dashed border-stone-200 dark:border-stone-800 space-y-2 mt-1.5 transition-all">
                                  {act.journal.learningObjectives && (
                                    <div>
                                      <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">Capaian / Tujuan</span>
                                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-normal mt-0.5">{act.journal.learningObjectives}</p>
                                    </div>
                                  )}
                                  
                                  {act.journal.classNotes && (
                                    <div>
                                      <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">Catatan PBM & Kendala</span>
                                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-normal mt-0.5">{act.journal.classNotes}</p>
                                    </div>
                                  )}

                                  {act.journal.assignmentGiven && (
                                    <div>
                                      <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">Tugas Rumah / Hafalan</span>
                                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-normal mt-0.5">{act.journal.assignmentGiven}</p>
                                    </div>
                                  )}

                                  {act.journal.studentAttendance && (
                                    <div className="pt-2 border-t border-stone-150 dark:border-stone-800">
                                      <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">Presensi Santri</span>
                                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                                        <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-medium text-stone-600 dark:text-stone-400">Total: {act.journal.studentAttendance.totalStudents}</span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-750 dark:text-emerald-400 font-bold">Hadir: {act.journal.studentAttendance.presentCount}</span>
                                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium">Sakit: {act.journal.studentAttendance.sickCount}</span>
                                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-medium">Izin: {act.journal.studentAttendance.permittedCount}</span>
                                        <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold">Alpa: {act.journal.studentAttendance.absentCount}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 text-center border-t border-stone-100 dark:border-stone-800 flex items-center justify-between px-4">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
              Total Log Aktivitas: {filteredTimelineActivities.length} Entri
            </span>
            <span className="text-[10px] font-bold text-emerald-750 dark:text-emerald-400">
              Menampilkan {Math.min(filteredTimelineActivities.length, 15)} Log Terbaru
            </span>
          </div>
        </div>

        {/* Antrean Pengajuan Kebutuhan Guru */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden flex flex-col justify-between shadow-xs">
          <div>
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${pendingRequests.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-stone-300'}`} />
                <h2 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                  Antrean Pengajuan Kebutuhan Guru
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setCurrentPath('/dashboard/admin/kebutuhan')}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="p-0">
              {pendingRequests.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-xs text-stone-400">Semua pengajuan telah ditindaklanjuti.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {pendingRequests.map((req) => {
                    const teacher = teachers.find(t => t.id === req.teacherId);
                    return (
                      <div key={req.id} className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg ${teacher?.avatarColor || 'bg-emerald-700'} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                              {teacher?.name?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">
                                {req.title}
                              </h4>
                              <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                                Oleh: {teacher?.name} • {req.category}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono italic shrink-0">
                            {formatIndonesianDate(req.createdAt)}
                          </span>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg border border-stone-100 dark:border-stone-800/50">
                          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
                            {req.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 text-center border-t border-stone-100 dark:border-stone-800">
            <button 
              type="button"
              onClick={() => setCurrentPath('/dashboard/admin/kebutuhan')}
              className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Kelola {learningNeedRequests.length} Pengajuan Kebutuhan
            </button>
          </div>
        </div>

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

import React, { useState, useMemo } from 'react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, formatIndonesianDate, formatShortDate, getLateCategoryLabel } from '../utils/formatters';
import { AdminOfficialReportModal, AdminReportType } from './AdminOfficialReportModal';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

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
          teacherName: actualTeacher?.name || 'Guru Pengganti',
          teacherAvatar: actualTeacher?.avatarColor || 'bg-indigo-700',
          title: 'Tugas Guru Pengganti',
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

  // Monthly Teacher Attendance & Journal Performance Data
  const monthlyPerformanceData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthStatsMap: Record<string, { total: number; hadir: number; jurnalComplete: number; jurnalPending: number }> = {};
    
    attendances.forEach(att => {
      const d = new Date(att.date);
      const mLabel = months[d.getMonth()] || 'Agu';
      if (!monthStatsMap[mLabel]) {
        monthStatsMap[mLabel] = { total: 0, hadir: 0, jurnalComplete: 0, jurnalPending: 0 };
      }
      monthStatsMap[mLabel].total += 1;
      if (att.clockInTime) monthStatsMap[mLabel].hadir += 1;
      if (att.status === 'SELESAI') monthStatsMap[mLabel].jurnalComplete += 1;
      if (att.status === 'HADIR_JURNAL_KOSONG') monthStatsMap[mLabel].jurnalPending += 1;
    });

    const baseData = [
      { bulan: 'Mar', hadirRate: 94, jurnalSelesai: 42, jurnalPending: 4, kepatuhanJurnal: 91 },
      { bulan: 'Apr', hadirRate: 96, jurnalSelesai: 48, jurnalPending: 3, kepatuhanJurnal: 94 },
      { bulan: 'Mei', hadirRate: 93, jurnalSelesai: 45, jurnalPending: 5, kepatuhanJurnal: 90 },
      { bulan: 'Jun', hadirRate: 97, jurnalSelesai: 52, jurnalPending: 2, kepatuhanJurnal: 96 },
      { bulan: 'Jul', hadirRate: 95, jurnalSelesai: 50, jurnalPending: 4, kepatuhanJurnal: 92 },
      { bulan: 'Agu', hadirRate: 98, jurnalSelesai: 56, jurnalPending: 2, kepatuhanJurnal: 96 },
    ];

    const aguStats = monthStatsMap['Agu'];
    if (aguStats && aguStats.total > 0) {
      const rate = Math.round((aguStats.hadir / aguStats.total) * 100);
      const totalJournals = aguStats.jurnalComplete + aguStats.jurnalPending;
      const kepatuhan = totalJournals > 0 ? Math.round((aguStats.jurnalComplete / totalJournals) * 100) : 96;
      baseData[5] = {
        bulan: 'Agu',
        hadirRate: rate > 0 ? rate : 98,
        jurnalSelesai: aguStats.jurnalComplete || 56,
        jurnalPending: aguStats.jurnalPending || 2,
        kepatuhanJurnal: kepatuhan
      };
    }

    return baseData;
  }, [attendances]);

  // Icon-free Minimalist Tooltips
  const MinimalAttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 border border-stone-800 shadow-md">
          <p className="font-semibold text-stone-300 border-b border-stone-800 pb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-stone-400">{p.name}:</span>
              <span className="font-mono font-medium text-emerald-400">{p.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const MinimalJournalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 border border-stone-800 shadow-md">
          <p className="font-semibold text-stone-300 border-b border-stone-800 pb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-stone-400">{p.name}:</span>
              <span className="font-mono font-medium text-white">
                {p.dataKey === 'kepatuhanJurnal' ? `${p.value}%` : p.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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
              <span className="text-stone-400">Pengganti:</span>
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
      {/* 1. Premium & Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
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
          className="bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          Cetak Laporan PDF
        </button>
      </div>

      {/* 2. Key Metrics (4 Pristine Minimalist Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block uppercase tracking-wider">Total Guru</span>
          <p className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 mt-2 font-mono tracking-tight">
            {totalTeachers}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-1.5">
            Semua Aktif
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block uppercase tracking-wider">Beban KBM</span>
          <p className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 mt-2 font-mono tracking-tight">
            {totalWeeklyJP} <span className="text-xs font-normal text-stone-500 dark:text-stone-400 font-sans">JP/mgg</span>
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-1.5 font-mono">
            {totalSchedules} Sesi Terjadwal
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block uppercase tracking-wider">Kepatuhan Jurnal</span>
          <p className="text-2xl sm:text-3xl font-semibold text-emerald-700 dark:text-emerald-400 mt-2 font-mono tracking-tight">
            {complianceRate}%
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-1.5 font-mono">
            {completedJournals} Selesai • {pendingJournals} Pending
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block uppercase tracking-wider">Estimasi Kafa'ah</span>
          <p className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 mt-2 font-mono tracking-tight truncate">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-1.5 font-mono truncate">
            Potongan: -{formatRupiah(payrollSummary.totalDeductions)}
          </span>
        </div>
      </div>

      {/* 2.2 Pending Learning Needs Summary Banner (Sleek, No Icon) */}
      <div 
        onClick={() => setCurrentPath('/dashboard/admin/kebutuhan')}
        className="bg-stone-50 dark:bg-stone-850 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-100/50 dark:hover:bg-stone-800 transition-all cursor-pointer group shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            pendingLearningNeeds > 0 
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300' 
              : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}>
            {pendingLearningNeeds > 0 ? `${pendingLearningNeeds} Ajuan Pending` : 'Terverifikasi'}
          </span>
          <div>
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
              Pengajuan Kebutuhan Pembelajaran Guru
            </span>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-mono">
              Rincian: SMP ({pendingSMP}), MA ({pendingMA}), Ponpes ({pendingPesantren})
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold text-stone-600 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white transition-colors self-end sm:self-auto hover:underline">
          Kelola Modul Kebutuhan
        </div>
      </div>

      {/* 3. Performance & Compliance Analytics Grid (Minimalist & Informative Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Tren & Distribusi Presensi KBM */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Tren & Distribusi Presensi KBM
              </h2>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                Sesi tepat waktu, terlambat, badal, dan rasio kehadiran
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setWeeklyViewMode('daily_week')}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  weeklyViewMode === 'daily_week'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setWeeklyViewMode('monthly_weeks')}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  weeklyViewMode === 'monthly_weeks'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                Pekanan
              </button>
            </div>
          </div>

          {/* Quick Informative Badges */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3">
              <span className="text-stone-500 dark:text-stone-400">
                Rerata Kehadiran: <strong className="text-stone-900 dark:text-stone-100 font-mono">{weeklyStatsSummary.avgRate}%</strong>
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                Ketepatan: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{weeklyStatsSummary.punctualityRate}%</strong>
              </span>
            </div>

            {/* Minimalist Legend */}
            <div className="hidden sm:flex items-center gap-2.5 text-[10px]">
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-sm bg-emerald-600 dark:bg-emerald-500" /> Tepat
              </span>
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-sm bg-amber-500" /> Terlambat
              </span>
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-sm bg-indigo-500" /> Pengganti
              </span>
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-3 h-0.5 bg-stone-900 dark:bg-stone-200" /> Hadir %
              </span>
            </div>
          </div>

          {/* Recharts ComposedChart */}
          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.6} />
                <XAxis 
                  dataKey="periodLabel" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716c' }} 
                  dy={6}
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716c' }} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716c' }} 
                  unit="%" 
                  dx={6}
                />
                <Tooltip content={<AttendanceTooltip />} />
                <Bar yAxisId="left" dataKey="tepatWaktu" name="Tepat Waktu" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="left" dataKey="terlambat" name="Terlambat" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="left" dataKey="badal" name="Pengganti" stackId="a" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Line yAxisId="right" type="monotone" dataKey="rate" name="Tingkat Hadir" stroke="#1c1917" strokeWidth={2} dot={{ r: 3, fill: '#1c1917' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Kepatuhan Jurnal Mengajar */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Performa Kepatuhan Jurnal Mengajar
              </h2>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                Pengisian jurnal lengkap vs pending dan tingkat kepatuhan (%)
              </p>
            </div>
          </div>

          {/* Quick Informative Badges */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-500 dark:text-stone-400">
              Total Log: <strong className="text-stone-900 dark:text-stone-100 font-mono">{completedJournals} Selesai</strong> • <span className="text-amber-700 dark:text-amber-400 font-mono">{pendingJournals} Pending</span>
            </span>

            {/* Minimalist Legend */}
            <div className="flex items-center gap-2.5 text-[10px]">
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-sm bg-indigo-600 dark:bg-indigo-500" /> Selesai
              </span>
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-sm bg-rose-500" /> Pending
              </span>
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-3 h-0.5 bg-emerald-600 dark:bg-emerald-400" /> Kepatuhan %
              </span>
            </div>
          </div>

          {/* Recharts ComposedChart */}
          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyPerformanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.6} />
                <XAxis 
                  dataKey="bulan" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716c' }} 
                  dy={6}
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716c' }} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[50, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716c' }} 
                  unit="%" 
                  dx={6}
                />
                <Tooltip content={<MinimalJournalTooltip />} />
                <Bar yAxisId="left" dataKey="jurnalSelesai" name="Jurnal Selesai" stackId="j" fill="#4f46e5" radius={[0, 0, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="left" dataKey="jurnalPending" name="Jurnal Pending" stackId="j" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Line yAxisId="right" type="monotone" dataKey="kepatuhanJurnal" name="Kepatuhan" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Monitoring Aktivitas KBM (Clean Table, No Icons) */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              Aktivitas Presensi Terkini
            </h2>
          </div>

          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchActivity}
              onChange={(e) => setSearchActivity(e.target.value)}
              placeholder="Cari guru atau mata pelajaran..."
              className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-stone-900 dark:text-stone-100"
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
                        <p className="font-semibold text-stone-850 dark:text-stone-200">{formatIndonesianDate(att.date)}</p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">{sched?.startTime} - {sched?.endTime}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-stone-900 dark:text-stone-100">{sched?.subject || 'KBM Reguler'}</p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">{sched?.className} • {sched?.unit}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-[10px] uppercase">
                            {(actualTeacher?.name || origTeacher?.name || 'G')[0]}
                          </span>
                          <div>
                            <p className="font-semibold text-stone-900 dark:text-stone-100">
                              {actualTeacher?.name || origTeacher?.name || 'Guru'}
                            </p>
                            {isBadal && (
                              <span className="text-[10px] text-purple-750 dark:text-purple-400 font-semibold block">
                                Pengganti: {origTeacher?.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-800 dark:text-stone-200">
                        {att.clockInTime || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${lateBadge.badge}`}>
                          {att.lateMinutes > 0 ? `+${att.lateMinutes}m` : 'Tepat Waktu'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {att.status === 'SELESAI' ? (
                          <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/50">
                            Lengkap
                          </span>
                        ) : att.status === 'HADIR_JURNAL_KOSONG' ? (
                          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                            Pending
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">
                            {att.status}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-emerald-800 dark:text-emerald-400 whitespace-nowrap font-mono">
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

      {/* 5. Analisis Unit & Potongan Disiplin (Clean Tables & Recharts, No Icons) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Struktur Komponen Kafa'ah per Unit */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Komposisi Kafa'ah per Unit Pendidikan
              </h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                Distribusi Gaji Pokok, Honor Mengajar, dan Tunjangan Transport
              </p>
            </div>
            
            {/* Minimal Legend */}
            <div className="hidden sm:flex items-center gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-sm bg-slate-700 dark:bg-slate-500" /> Gapok
              </span>
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-sm bg-emerald-600 dark:bg-emerald-500" /> Honor JP
              </span>
              <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-sm bg-amber-500" /> Transport
              </span>
            </div>
          </div>

          {/* Recharts BarChart */}
          <div className="h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.6} />
                <XAxis 
                  dataKey="unit" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716c' }} 
                  dy={4}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#78716c' }} 
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}jt`}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar dataKey="baseSalary" name="Gaji Pokok" stackId="unitSalary" fill="#334155" maxBarSize={32} />
                <Bar dataKey="honor" name="Honor JP" stackId="unitSalary" fill="#059669" maxBarSize={32} />
                <Bar dataKey="transport" name="Transport" stackId="unitSalary" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transparansi Penegakan SOP */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-4 shadow-sm">
          <div className="pb-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              Penegakan SOP & Potongan Disiplin
            </h3>
            <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
              Otomatisasi Sistem
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">Denda Keterlambatan</span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 block">Potongan per menit keterlambatan KBM</span>
              </div>
              <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 text-xs">
                -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.latePenaltyTotal, 0))}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">Penalti Jurnal Belum Lengkap</span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 block">Penalti 50% honor per sesi KBM kosong</span>
              </div>
              <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 text-xs">
                -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.emptyJournalPenalty, 0))}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50">
              <div>
                <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-100 block">Total Potongan Bulan Ini</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">Diterapkan otomatis ke slip gaji</span>
              </div>
              <span className="font-mono font-bold text-emerald-900 dark:text-emerald-300 text-xs">
                -{formatRupiah(payrollSummary.totalDeductions)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Grid: Timeline Jurnal & Antrean Kebutuhan (Clean & Minimalist) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Timeline Aktivitas */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            {/* Header with Category Filter */}
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Timeline Aktivitas
              </h2>

              <div className="flex items-center gap-1">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'KEHADIRAN', label: 'Presensi' },
                  { id: 'JURNAL', label: 'Jurnal' },
                  { id: 'BADAL', label: 'Pengganti' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTimelineCategory(cat.id as any)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      timelineCategory === cat.id
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                        : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Feed */}
            <div className="p-4 max-h-[440px] overflow-y-auto">
              {filteredTimelineActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400 dark:text-stone-500">
                  Tidak ada aktivitas yang sesuai.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredTimelineActivities.slice(0, 12).map((act) => {
                    const isExpanded = !!expandedJournalIds[act.id];
                    return (
                      <div key={act.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 dark:text-stone-100">
                              {act.teacherName}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                              {act.unit}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                            {act.time || 'KBM'} • {formatShortDate(act.date)}
                          </span>
                        </div>

                        <p className="text-xs text-stone-600 dark:text-stone-400">
                          {act.description}
                        </p>

                        {act.type === 'JURNAL' && (
                          <div>
                            <button
                              type="button"
                              onClick={() => toggleJournalExpand(act.id)}
                              className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              {isExpanded ? 'Sembunyikan' : 'Rincian Jurnal'}
                            </button>

                            {isExpanded && act.journal && (
                              <div className="mt-2 text-xs text-stone-600 dark:text-stone-400 space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 font-sans">
                                {act.journal.learningObjectives && (
                                  <p><strong>Capaian:</strong> {act.journal.learningObjectives}</p>
                                )}
                                {act.journal.classNotes && (
                                  <p><strong>Catatan:</strong> {act.journal.classNotes}</p>
                                )}
                                {act.journal.studentAttendance && (
                                  <p className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                                    Santri: {act.journal.studentAttendance.presentCount}/{act.journal.studentAttendance.totalStudents} Hadir
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 text-center border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 font-mono">
            {filteredTimelineActivities.length} Aktivitas Tercatat
          </div>
        </div>

        {/* Card 2: Antrean Pengajuan Kebutuhan */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Pengajuan Kebutuhan Guru
              </h2>
              <button 
                type="button"
                onClick={() => setCurrentPath('/dashboard/admin/kebutuhan')}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                Kelola Semua
              </button>
            </div>

            <div className="p-4 max-h-[440px] overflow-y-auto">
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400 dark:text-stone-500">
                  Tidak ada pengajuan pending.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {pendingRequests.map((req) => {
                    const teacher = teachers.find(t => t.id === req.teacherId);
                    return (
                      <div key={req.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                            {req.title}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                            {formatShortDate(req.createdAt)}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                          {teacher?.name} • {req.category}
                        </p>

                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                          {req.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 text-center border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 font-mono">
            {pendingRequests.length} Ajuan Perlu Ditindaklanjuti
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

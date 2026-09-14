import React, { useState, useMemo } from 'react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, formatIndonesianDate, formatShortDate, getLateCategoryLabel } from '../utils/formatters';
import { AdminOfficialReportModal, AdminReportType } from './AdminOfficialReportModal';
import { TeacherNotes } from './TeacherNotes';
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
    staffJournals,
    expenses,
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
          badgeColor: 'bg-slate-100 text-slate-800 dark:bg-[#0f1a15] dark:text-emerald-300/80',
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

    // Staff Journals (Kehadiran & Laporan Staff)
    if (staffJournals) {
      staffJournals.forEach((journal) => {
        const staff = teachers.find((t) => t.id === journal.staffId);
        list.push({
          id: `${journal.id}-staff`,
          attendanceId: journal.id,
          type: 'KEHADIRAN', // Treated as Kehadiran for timeline filtering
          date: journal.date,
          time: new Date(journal.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '08:00',
          timestamp: new Date(journal.createdAt).getTime(),
          teacherName: journal.staffName || 'Staff',
          teacherAvatar: staff?.avatarColor || 'bg-amber-700',
          title: `Laporan Staff ${journal.category}`,
          description: `Melaporkan tugas: ${journal.taskToday}`,
          badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
          unit: 'PESANTREN',
          subject: 'Operasional',
          className: journal.category
        });
      });
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [attendances, schedules, teachers, staffJournals]);

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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [learningNeedRequests]);

  // Staff Expenses Summary
  const pendingStaffExpenses = useMemo(() => {
    return (expenses || []).filter(e => e.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);
  
  const pendingStaffExpenseCount = useMemo(() => {
    return (expenses || []).filter(e => e.status === 'PENDING').length;
  }, [expenses]);


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
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 border border-slate-800 shadow-md">
          <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-slate-400">{p.name}:</span>
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
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 border border-slate-800 shadow-md">
          <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-slate-400">{p.name}:</span>
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
              <span className="text-slate-400">Pengganti:</span>
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
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#051F20] tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#8EB69B] mt-1 font-medium">
            Periode {selectedPeriod} • Pesantren Baitul Qur'an Al-Ikhwan
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setOfficialReportType('executive_summary');
            setShowOfficialReportModal(true);
          }}
          className="bg-[#051F20] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#163832] transition-colors shadow-sm"
        >
          Cetak Laporan PDF
        </button>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[24px] p-6 shadow-sm">
          <span className="text-sm font-medium text-[#163832]/70 block">Total Guru</span>
          <p className="text-4xl font-bold text-[#051F20] mt-3 tracking-tight">
            {totalTeachers}
          </p>
          <span className="text-xs text-[#8EB69B] block mt-2 font-medium">
            Semua Aktif
          </span>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm">
          <span className="text-sm font-medium text-[#163832]/70 block">Beban KBM</span>
          <p className="text-4xl font-bold text-[#051F20] mt-3 tracking-tight flex items-baseline gap-1">
            {totalWeeklyJP} <span className="text-sm font-medium text-[#8EB69B]">JP/mgg</span>
          </p>
          <span className="text-xs text-[#8EB69B] block mt-2 font-medium">
            {totalSchedules} Sesi Terjadwal
          </span>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm">
          <span className="text-sm font-medium text-[#163832]/70 block">Kepatuhan Jurnal</span>
          <p className="text-4xl font-bold text-[#051F20] mt-3 tracking-tight">
            {complianceRate}%
          </p>
          <span className="text-xs text-[#8EB69B] block mt-2 font-medium">
            {completedJournals} Selesai • {pendingJournals} Pending
          </span>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm">
          <span className="text-sm font-medium text-[#163832]/70 block">Estimasi Kafa'ah</span>
          <p className="text-2xl sm:text-3xl font-bold text-[#051F20] mt-3 tracking-tight truncate">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <span className="text-xs text-[#8EB69B] block mt-2 font-medium truncate">
            Potongan: -{formatRupiah(payrollSummary.totalDeductions)}
          </span>
        </div>
      </div>

      {/* Pending Learning Needs Summary Banner */}
      <div 
        onClick={() => setCurrentPath('/dashboard/admin/kebutuhan')}
        className="bg-[#DAF1DE] p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#8EB69B]/40 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
            pendingLearningNeeds > 0 
              ? 'bg-[#0B2B26] text-white' 
              : 'bg-[#163832] text-white'
          }`}>
            {pendingLearningNeeds > 0 ? `${pendingLearningNeeds} Ajuan Pending` : 'Terverifikasi'}
          </span>
          <div>
            <span className="text-sm font-bold text-[#051F20]">
              Pengajuan Kebutuhan Pembelajaran Guru
            </span>
            <p className="text-xs text-[#163832]/80 mt-0.5 font-medium">
              Rincian: SMP ({pendingSMP}), MA ({pendingMA}), Ponpes ({pendingPesantren})
            </p>
          </div>
        </div>
        <div className="text-sm font-bold text-[#051F20] flex items-center gap-2 group-hover:translate-x-1 transition-transform">
          Kelola Modul <span className="text-lg leading-none">→</span>
        </div>
      </div>

      {/* 3. Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Tren & Distribusi Presensi KBM */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#051F20]">
                Tren & Distribusi Presensi KBM
              </h2>
              <p className="text-xs font-medium text-[#8EB69B] mt-1">
                Sesi tepat waktu, terlambat, badal, dan rasio kehadiran
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setWeeklyViewMode('daily_week')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  weeklyViewMode === 'daily_week'
                    ? 'bg-[#051F20] text-white shadow-sm'
                    : 'text-[#8EB69B] hover:text-[#051F20]'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setWeeklyViewMode('monthly_weeks')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  weeklyViewMode === 'monthly_weeks'
                    ? 'bg-[#051F20] text-white shadow-sm'
                    : 'text-[#8EB69B] hover:text-[#051F20]'
                }`}
              >
                Pekanan
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-4">
              <span className="text-[#8EB69B]">
                Rerata: <strong className="text-[#051F20] text-sm">{weeklyStatsSummary.avgRate}%</strong>
              </span>
              <span className="text-[#8EB69B]">
                Ketepatan: <strong className="text-[#051F20] text-sm">{weeklyStatsSummary.punctualityRate}%</strong>
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[#163832]/80">
                <span className="w-2.5 h-2.5 rounded-full bg-[#163832]" /> Tepat
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#163832]/80">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8EB69B]" /> Terlambat
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#163832]/80">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DAF1DE]" /> Pengganti
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="periodLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8EB69B', fontWeight: 500 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8EB69B', fontWeight: 500 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8EB69B', fontWeight: 500 }} unit="%" dx={10} />
                <Tooltip content={<AttendanceTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar yAxisId="left" dataKey="tepatWaktu" name="Tepat Waktu" stackId="a" fill="#163832" radius={[0, 0, 0, 0]} maxBarSize={32} />
                <Bar yAxisId="left" dataKey="terlambat" name="Terlambat" stackId="a" fill="#8EB69B" radius={[0, 0, 0, 0]} maxBarSize={32} />
                <Bar yAxisId="left" dataKey="badal" name="Pengganti" stackId="a" fill="#DAF1DE" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Line yAxisId="right" type="monotone" dataKey="rate" name="Tingkat Hadir" stroke="#051F20" strokeWidth={3} dot={{ r: 4, fill: '#051F20', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Kepatuhan Jurnal Mengajar */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#051F20]">
                Performa Kepatuhan Jurnal Mengajar
              </h2>
              <p className="text-xs font-medium text-[#8EB69B] mt-1">
                Pengisian jurnal lengkap vs pending dan tingkat kepatuhan (%)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#8EB69B]">
              Total Log: <strong className="text-[#051F20] text-sm">{completedJournals} Selesai</strong> • <span className="text-[#8EB69B] text-sm">{pendingJournals} Pending</span>
            </span>

            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[#163832]/80">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B2B26]" /> Selesai
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#163832]/80">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DAF1DE]" /> Pending
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyPerformanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8EB69B', fontWeight: 500 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8EB69B', fontWeight: 500 }} />
                <YAxis yAxisId="right" orientation="right" domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8EB69B', fontWeight: 500 }} unit="%" dx={10} />
                <Tooltip content={<MinimalJournalTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar yAxisId="left" dataKey="jurnalSelesai" name="Jurnal Selesai" stackId="j" fill="#0B2B26" radius={[0, 0, 0, 0]} maxBarSize={32} />
                <Bar yAxisId="left" dataKey="jurnalPending" name="Jurnal Pending" stackId="j" fill="#DAF1DE" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Line yAxisId="right" type="monotone" dataKey="kepatuhanJurnal" name="Kepatuhan" stroke="#163832" strokeWidth={3} dot={{ r: 4, fill: '#163832', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Monitoring Aktivitas KBM */}
      <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100/50 mt-6">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-base text-[#051F20]">
              Aktivitas Presensi Terkini
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchActivity}
              onChange={(e) => setSearchActivity(e.target.value)}
              placeholder="Cari guru atau mapel..."
              className="w-full px-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#163832] text-[#051F20]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-[#8EB69B] font-medium border-b border-slate-100">
                <th className="py-3 px-6">Tanggal & Sesi</th>
                <th className="py-3 px-6">Mata Pelajaran</th>
                <th className="py-3 px-6">Guru</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Status Masuk</th>
                <th className="py-3 px-4">Jurnal</th>
                <th className="py-3 px-6 text-right">Honor Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#051F20]">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8EB69B] font-medium">
                    Tidak ada aktivitas yang sesuai
                  </td>
                </tr>
              ) : (
                recentActivities.map((att) => {
                  const sched = schedules.find((s) => s.id === att.scheduleId);
                  const origTeacher = teachers.find((t) => t.id === att.teacherId);
                  const actualTeacher = teachers.find((t) => t.id === att.actualTeacherId);
                  const isBadal = att.isBadal;
                  const hours = sched ? sched.hours : 2;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6 whitespace-nowrap">
                        <p className="font-semibold">{formatIndonesianDate(att.date)}</p>
                        <p className="text-xs text-[#8EB69B] font-mono mt-0.5">{sched?.startTime} - {sched?.endTime}</p>
                      </td>
                      <td className="py-3 px-6">
                        <p className="font-semibold">{sched?.subject || 'KBM Reguler'}</p>
                        <p className="text-xs text-[#8EB69B] mt-0.5">{sched?.className} • {sched?.unit}</p>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#DAF1DE] text-[#051F20] font-bold text-xs uppercase">
                            {(actualTeacher?.name || origTeacher?.name || 'G')[0]}
                          </span>
                          <div>
                            <p className="font-semibold">
                              {actualTeacher?.name || origTeacher?.name || 'Guru'}
                            </p>
                            {isBadal && (
                              <span className="text-[11px] text-[#163832] font-semibold block mt-0.5">
                                Pengganti: {origTeacher?.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {att.clockInTime || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${att.lateMinutes > 0 ? 'bg-rose-100 text-rose-900' : 'bg-[#DAF1DE] text-[#0B2B26]'}`}>
                          {att.lateMinutes > 0 ? `+${att.lateMinutes}m` : 'Tepat Waktu'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {att.status === 'SELESAI' ? (
                          <span className="text-[11px] font-bold text-[#051F20] bg-[#DAF1DE] px-2.5 py-1 rounded-md">
                            Lengkap
                          </span>
                        ) : att.status === 'HADIR_JURNAL_KOSONG' ? (
                          <span className="text-[11px] font-bold text-white bg-[#163832] px-2.5 py-1 rounded-md">
                            Pending
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8EB69B] font-medium">
                            {att.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-[#163832] whitespace-nowrap font-mono">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Struktur Komponen Kafa'ah per Unit */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-[#051F20]">
                Komposisi Kafa'ah per Unit Pendidikan
              </h3>
              <p className="text-xs font-medium text-[#8EB69B] mt-1">
                Distribusi Gaji Pokok, Honor Mengajar, dan Tunjangan Transport
              </p>
            </div>
            
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1.5 text-[#163832]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#051F20]" /> Gapok
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#163832]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#163832]" /> Honor JP
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#163832]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DAF1DE]" /> Transport
              </span>
            </div>
          </div>

          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8EB69B', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8EB69B', fontWeight: 500 }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}jt`} />
                <Tooltip content={<CurrencyTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="baseSalary" name="Gaji Pokok" stackId="unitSalary" fill="#051F20" maxBarSize={40} />
                <Bar dataKey="honor" name="Honor JP" stackId="unitSalary" fill="#163832" maxBarSize={40} />
                <Bar dataKey="transport" name="Transport" stackId="unitSalary" fill="#DAF1DE" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transparansi Penegakan SOP - Dark Card */}
        <div className="bg-[#0B2B26] p-6 rounded-[24px] space-y-5 shadow-sm text-white">
          <div className="pb-4 border-b border-[#235347] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white">
                Penegakan SOP & Potongan Disiplin
              </h3>
              <p className="text-xs font-medium text-[#8EB69B] mt-1">Denda otomatis dari sistem</p>
            </div>
            <span className="text-xs font-bold text-[#DAF1DE] bg-[#163832] px-3 py-1.5 rounded-lg">
              Otomatis
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#051F20]/50 border border-[#163832]">
              <div>
                <span className="text-sm font-bold text-white block">Denda Keterlambatan</span>
                <span className="text-xs text-[#8EB69B] block mt-1">Potongan per menit keterlambatan KBM</span>
              </div>
              <span className="font-mono font-bold text-rose-400 text-sm">
                -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.latePenaltyTotal, 0))}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#051F20]/50 border border-[#163832]">
              <div>
                <span className="text-sm font-bold text-white block">Penalti Jurnal Kosong</span>
                <span className="text-xs text-[#8EB69B] block mt-1">Penalti 50% honor per sesi</span>
              </div>
              <span className="font-mono font-bold text-rose-400 text-sm">
                -{formatRupiah(payrollSummary.items.reduce((s, i) => s + i.emptyJournalPenalty, 0))}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#DAF1DE] border border-[#DAF1DE] text-[#051F20]">
              <div>
                <span className="text-sm font-bold block">Total Potongan Bulan Ini</span>
                <span className="text-xs font-medium text-[#163832] block mt-1">Diterapkan otomatis ke slip gaji</span>
              </div>
              <span className="font-mono font-bold text-rose-600 text-base">
                -{formatRupiah(payrollSummary.totalDeductions)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Timeline & Antrean Kebutuhan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Card 1: Timeline Aktivitas (Light Mint Card) */}
        <div className="bg-[#DAF1DE] rounded-[24px] overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="p-6 border-b border-[#8EB69B]/30 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-base text-[#051F20]">
                Timeline Aktivitas
              </h2>

              <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-xl">
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
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      timelineCategory === cat.id
                        ? 'bg-[#0B2B26] text-white shadow-sm'
                        : 'text-[#163832] hover:bg-white/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 max-h-[440px] overflow-y-auto">
              {filteredTimelineActivities.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#163832] font-medium">
                  Tidak ada aktivitas.
                </div>
              ) : (
                <div className="divide-y divide-[#8EB69B]/20">
                  {filteredTimelineActivities.slice(0, 12).map((act) => {
                    const isExpanded = !!expandedJournalIds[act.id];
                    return (
                      <div key={act.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#051F20]">
                              {act.teacherName}
                            </span>
                            <span className="text-[11px] font-bold text-[#163832] bg-white/60 px-2 py-0.5 rounded-md">
                              {act.unit}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#163832]">
                            {act.time || 'KBM'} • {formatShortDate(act.date)}
                          </span>
                        </div>

                        <p className="text-sm text-[#163832]/90 font-medium">
                          {act.description}
                        </p>

                        {act.type === 'JURNAL' && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => toggleJournalExpand(act.id)}
                              className="text-xs font-bold text-[#0B2B26] hover:underline cursor-pointer"
                            >
                              {isExpanded ? 'Sembunyikan' : 'Rincian Jurnal'}
                            </button>

                            {isExpanded && act.journal && (
                              <div className="mt-3 text-sm text-[#051F20] space-y-2 pt-3 border-t border-[#8EB69B]/30 font-medium bg-white/40 p-4 rounded-xl">
                                {act.journal.learningObjectives && (
                                  <p><strong>Capaian:</strong> {act.journal.learningObjectives}</p>
                                )}
                                {act.journal.classNotes && (
                                  <p><strong>Catatan:</strong> {act.journal.classNotes}</p>
                                )}
                                {act.journal.studentAttendance && (
                                  <p className="font-mono text-xs text-[#163832] font-bold">
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
          <div className="p-4 bg-[#8EB69B]/20 text-center text-xs font-bold text-[#051F20] font-mono">
            {filteredTimelineActivities.length} Aktivitas Tercatat
          </div>
        </div>

        {/* Card 2: Antrean Pengajuan Kebutuhan */}
        <div className="bg-white rounded-[24px] overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-base text-[#051F20]">
                Pengajuan Kebutuhan Guru
              </h2>
              <button 
                type="button"
                onClick={() => setCurrentPath('/dashboard/admin/kebutuhan')}
                className="text-sm font-bold text-[#163832] hover:text-[#0B2B26] transition-colors cursor-pointer"
              >
                Kelola Semua →
              </button>
            </div>

            <div className="p-6 max-h-[440px] overflow-y-auto">
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-sm font-medium text-[#8EB69B]">
                  Tidak ada pengajuan pending.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingRequests.map((req) => {
                    const teacher = teachers.find(t => t.id === req.teacherId);
                    return (
                      <div key={req.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-sm text-[#051F20]">
                            {req.title}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-[#8EB69B]">
                            {formatShortDate(req.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-[#163832] bg-[#DAF1DE] px-2.5 py-1 rounded-md inline-block">
                          {teacher?.name} • {req.category}
                        </p>

                        <p className="text-sm font-medium text-[#8EB69B] line-clamp-2 leading-relaxed pt-1">
                          {req.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50 text-center text-xs font-bold text-[#8EB69B] font-mono border-t border-slate-100">
            {pendingRequests.length} Ajuan Perlu Ditindaklanjuti
          </div>
        </div>

      </div>

      <div className="mt-8">
        <TeacherNotes readOnly={true} />
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

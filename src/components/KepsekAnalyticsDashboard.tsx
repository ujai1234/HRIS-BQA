import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  X,
  Trophy,
  Medal,
  Award,
  Star,
  TrendingUp,
  Sparkles,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useHRIS } from '../context/HRISContext';
import { UnitType, getRoleUnit, AttendanceRecord, ClassSchedule } from '../types';
import { TeacherAvatar } from './TeacherAvatar';

interface KepsekAnalyticsDashboardProps {
  onNavigateToAudit?: () => void;
  onNavigateToBadal?: () => void;
}

export const KepsekAnalyticsDashboard: React.FC<KepsekAnalyticsDashboardProps> = ({
  onNavigateToAudit,
  onNavigateToBadal
}) => {
  const { 
    teachers, 
    schedules, 
    attendances, 
    badalAssignments, 
    currentUser,
    currentRole,
    isDarkMode
  } = useHRIS();

  const userUnit = getRoleUnit(currentRole, currentUser?.unit);

  // Active Main Tab within Monitoring
  const [activeView, setActiveView] = useState<'REALTIME' | 'BADAL' | 'REKAP'>('REALTIME');

  // Filters State
  const [selectedUnit, setSelectedUnit] = useState<'ALL' | UnitType>(
    userUnit === 'ALL' ? 'ALL' : (userUnit as UnitType)
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HADIR' | 'TERLAMBAT' | 'PENDING_JURNAL' | 'BADAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('10:12');
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<any | null>(null);
  const [selectedTopTeacherDetail, setSelectedTopTeacherDetail] = useState<any | null>(null);

  // Keep selectedUnit strictly synchronized if user role is specific Kepsek
  useEffect(() => {
    if (userUnit !== 'ALL') {
      setSelectedUnit(userUnit as UnitType);
    }
  }, [userUnit, currentRole]);

  const effectiveUnit: 'ALL' | UnitType = userUnit !== 'ALL' ? (userUnit as UnitType) : selectedUnit;

  // Filtered teachers and schedules
  const filteredTeachers = useMemo(() => {
    if (effectiveUnit === 'ALL') return teachers;
    return teachers.filter(t => t.unit === effectiveUnit);
  }, [teachers, effectiveUnit]);

  const filteredSchedules = useMemo(() => {
    if (effectiveUnit === 'ALL') return schedules;
    return schedules.filter(s => s.unit === effectiveUnit);
  }, [schedules, effectiveUnit]);

  const filteredAttendances = useMemo(() => {
    if (effectiveUnit === 'ALL') return attendances;
    const teacherIds = new Set(filteredTeachers.map(t => t.id));
    return attendances.filter(a => teacherIds.has(a.teacherId) || teacherIds.has(a.actualTeacherId));
  }, [attendances, filteredTeachers]);

  // Today's Live Sessions Data
  const liveSessions = useMemo(() => {
    return filteredSchedules.map((schedule, idx) => {
      const teacher = teachers.find(t => t.id === schedule.teacherId);
      const att = attendances.find(a => a.scheduleId === schedule.id);
      const badal = badalAssignments.find(b => b.scheduleId === schedule.id);
      const badalTeacher = badal ? teachers.find(t => t.id === badal.badalTeacherId) : null;

      // Determine Realtime State
      let checkInTime = att?.clockInTime;
      let attendanceStatus: 'HADIR_TEPAT' | 'HADIR_TERLAMBAT' | 'BELUM_HADIR' = 'BELUM_HADIR';
      let lateMinutes = att?.lateMinutes || 0;

      if (att) {
        if (att.lateCategory === 'TEPAT_WAKTU' || (att.lateMinutes || 0) === 0) {
          attendanceStatus = 'HADIR_TEPAT';
        } else {
          attendanceStatus = 'HADIR_TERLAMBAT';
        }
      }

      const isJournalComplete = att?.status === 'SELESAI';
      const journalTopic = att?.journal?.topic || null;
      const isBadal = !!badal;
      const actualTeacherName = isBadal ? (badalTeacher?.name || 'Guru Pengganti') : (teacher?.name || 'Asatidz');

      return {
        id: schedule.id,
        scheduleId: schedule.id,
        originalTeacherId: schedule.teacherId,
        originalTeacherName: teacher?.name || 'Ust Asatidz',
        actualTeacherName,
        isBadal,
        badalReason: isBadal ? badal?.reason : null,
        badalStatus: isBadal ? badal?.status : null,
        className: schedule.className,
        subject: schedule.subject,
        timeSlot: `${schedule.startTime} - ${schedule.endTime}`,
        hours: schedule.hours,
        unit: schedule.unit,
        attendanceStatus,
        checkInTime,
        lateMinutes,
        isJournalComplete,
        journalTopic,
        studentPresentCount: 0,
        totalStudents: 0
      };
    });
  }, [filteredSchedules, teachers, attendances, badalAssignments]);

  // Filtered Live Sessions by Search & Status
  const filteredLiveSessions = useMemo(() => {
    return liveSessions.filter(session => {
      const matchSearch = 
        session.originalTeacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.actualTeacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.subject.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'HADIR') return session.attendanceStatus === 'HADIR_TEPAT';
      if (statusFilter === 'TERLAMBAT') return session.attendanceStatus === 'HADIR_TERLAMBAT';
      if (statusFilter === 'PENDING_JURNAL') return !session.isJournalComplete && session.attendanceStatus !== 'BELUM_HADIR';
      if (statusFilter === 'BADAL') return session.isBadal;

      return true;
    });
  }, [liveSessions, searchQuery, statusFilter]);

  // Today's Live Metrics
  const totalSessionsToday = liveSessions.length;
  const presentCount = liveSessions.filter(s => s.attendanceStatus !== 'BELUM_HADIR').length;
  const lateCount = liveSessions.filter(s => s.attendanceStatus === 'HADIR_TERLAMBAT').length;
  const completedJournalCount = liveSessions.filter(s => s.isJournalComplete).length;
  const pendingJournalCount = presentCount - completedJournalCount;
  const activeBadalCount = liveSessions.filter(s => s.isBadal).length;
  const onTimePercentage = presentCount > 0 ? Math.round(((presentCount - lateCount) / presentCount) * 100) : 100;

  // 7-Day Teacher Attendance Trend Data
  const last7DaysData = useMemo(() => {
    return [
      { 
        date: 'Hari Ini', 
        hadir: presentCount, 
        tepat: Math.max(0, presentCount - lateCount), 
        terlambat: lateCount, 
        izin: Math.max(0, totalSessionsToday - presentCount),
        persentase: totalSessionsToday > 0 ? Math.round((presentCount / totalSessionsToday) * 100) : 0 
      }
    ];
  }, [presentCount, lateCount, totalSessionsToday]);

  // Monthly Trajectory Trends Data
  const monthlyTrendsData = useMemo(() => {
    return [];
  }, []);

  // Status Distribution Data for Donut Chart
  const statusDistributionData = useMemo(() => {
    return [
      { name: 'Tepat Waktu', value: Math.max(1, presentCount - lateCount), color: '#1B4332' },
      { name: 'Terlambat', value: Math.max(0, lateCount), color: '#D97706' },
      { name: 'Guru Badal', value: Math.max(0, activeBadalCount), color: '#4F46E5' },
      { name: 'Izin/Sakit', value: Math.max(0, totalSessionsToday - presentCount), color: '#94A3B8' }
    ];
  }, [presentCount, lateCount, activeBadalCount, totalSessionsToday]);

  // Rubrik Evaluasi Kompetensi Asatidz Radar Data
  const evaluationRadarData = useMemo(() => {
    return [
      { metric: 'KBM Tepat Waktu', score: onTimePercentage, target: 95 },
      { metric: 'Ketaatan Jurnal', score: presentCount > 0 ? Math.round((completedJournalCount / presentCount) * 100) : 0, target: 90 },
      { metric: 'Tuntas Materi', score: 0, target: 90 },
      { metric: 'Presensi Santri', score: 0, target: 95 },
      { metric: 'Evaluasi Santri', score: 0, target: 85 },
      { metric: 'Kerapian Modul', score: 0, target: 85 }
    ];
  }, [onTimePercentage, presentCount, completedJournalCount]);

  // Top 5 Ustadz Terbaik (Kinerja & Kedisiplinan)
  const top5Teachers = useMemo(() => {
    if (filteredTeachers.length > 0) {
      const mapped = filteredTeachers.map((teacher, index) => {
        const teacherSchedules = filteredSchedules.filter(s => s.teacherId === teacher.id);
        const hours = teacherSchedules.reduce((acc, s) => acc + (s.hours || 2), 0);
        
        return {
          id: teacher.id,
          name: teacher.name,
          nip: teacher.nip || '-',
          position: teacher.position || 'Pengajar',
          unit: teacher.unit,
          avatarColor: teacher.avatarColor || 'bg-emerald-700',
          overallScore: 0,
          onTimeRate: 0,
          journalRate: 0,
          totalJP: hours,
          studentRating: 0,
          badgeLabel: '-',
          awards: []
        };
      });

      return mapped.slice(0, 5);
    }
    return [];
  }, [filteredTeachers, filteredSchedules]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      setLastUpdated(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header Minimalis & Modern */}
      <div className="bg-white dark:bg-[#0B2B26]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE REALTIME
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Pembaruan: {lastUpdated}
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-emerald-50 tracking-tight mt-1">
              Monitoring KBM & Tenaga Pendidik
            </h1>
          </div>

          {/* Controls: Unit Filter & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {currentRole === 'ADMIN' && (
              <div className="flex bg-slate-100 dark:bg-[#0f1a15] p-0.5 rounded-lg border border-slate-200/60 dark:border-emerald-800/40 text-xs">
                {(['ALL', 'SMP', 'MA', 'PESANTREN'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setSelectedUnit(u)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      selectedUnit === u
                        ? 'bg-white dark:bg-[#121f1a] text-slate-900 dark:text-emerald-50 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {u === 'ALL' ? 'Semua' : u}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 hover:bg-slate-50 dark:bg-[#0f1a15] dark:hover:bg-[#162720]/50 text-slate-600 dark:text-emerald-300/80 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-[#163832]/60 text-sm font-medium">
          <button
            onClick={() => setActiveView('REALTIME')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeView === 'REALTIME'
                ? 'bg-[#051F20] dark:bg-[#8EB69B] text-white dark:text-[#051F20] font-semibold shadow-md'
                : 'text-slate-500 hover:text-[#051F20] dark:text-[#8EB69B]/70 dark:hover:text-[#DAF1DE] hover:bg-slate-50 dark:hover:bg-[#163832]/30'
            }`}
          >
            Live Sesi Hari Ini ({totalSessionsToday})
          </button>
          <button
            onClick={() => setActiveView('BADAL')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'BADAL'
                ? 'bg-[#051F20] dark:bg-[#8EB69B] text-white dark:text-[#051F20] font-semibold shadow-md'
                : 'text-slate-500 hover:text-[#051F20] dark:text-[#8EB69B]/70 dark:hover:text-[#DAF1DE] hover:bg-slate-50 dark:hover:bg-[#163832]/30'
            }`}
          >
            Guru Pengganti
            {activeBadalCount > 0 && (
              <div className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {activeBadalCount}
              </div>
            )}
          </button>
          <button
            onClick={() => setActiveView('REKAP')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeView === 'REKAP'
                ? 'bg-[#051F20] dark:bg-[#8EB69B] text-white dark:text-[#051F20] font-semibold shadow-md'
                : 'text-slate-500 hover:text-[#051F20] dark:text-[#8EB69B]/70 dark:hover:text-[#DAF1DE] hover:bg-slate-50 dark:hover:bg-[#163832]/30'
            }`}
          >
            Rekap & Analitik Kinerja
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar (Clean, Minimal, High Contrast) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Kehadiran Hari Ini */}
        <div className="bg-white dark:bg-[#051F20]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-[#051F20] dark:text-[#8EB69B]" />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-[#8EB69B] relative z-10">
            Kehadiran Asatidz
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-[#051F20] dark:text-[#DAF1DE] mt-2 relative z-10">
            {presentCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-[#8EB69B]/80 mt-2 relative z-10 font-medium">
            {lateCount > 0 ? <span className="text-amber-600 dark:text-amber-400">{lateCount} hadir terlambat</span> : <span className="text-emerald-600 dark:text-emerald-400">Semua hadir tepat waktu</span>}
          </div>
        </div>

        {/* Metric 2: Ketaatan Jurnal Hari Ini */}
        <div className="bg-white dark:bg-[#051F20]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-[#051F20] dark:text-[#8EB69B]" />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-[#8EB69B] relative z-10">
            Jurnal KBM Terisi
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-[#051F20] dark:text-[#DAF1DE] mt-2 relative z-10">
            {completedJournalCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-[#8EB69B]/80 mt-2 relative z-10 font-medium">
            {pendingJournalCount > 0 ? <span className="text-rose-600 dark:text-rose-400">{pendingJournalCount} jurnal belum diserahkan</span> : <span className="text-emerald-600 dark:text-emerald-400">Semua jurnal lengkap</span>}
          </div>
        </div>

        {/* Metric 3: Guru Pengganti */}
        <div className="bg-white dark:bg-[#051F20]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UserCheck className="w-16 h-16 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-[#8EB69B] relative z-10">
            Guru Pengganti
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-2 relative z-10">
            {activeBadalCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-[#8EB69B]/80 mt-2 relative z-10 font-medium">
            {activeBadalCount > 0 ? 'Semua terisi guru pengganti' : 'Tidak ada kebutuhan badal'}
          </div>
        </div>

        {/* Metric 4: Ketepatan Waktu Check-In */}
        <div className="bg-white dark:bg-[#051F20]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-[#051F20] dark:text-[#8EB69B]" />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-[#8EB69B] relative z-10">
            Ketepatan Waktu KBM
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-[#051F20] dark:text-[#DAF1DE] mt-2 relative z-10">
            {onTimePercentage}%
          </div>
          <div className="text-xs text-slate-500 dark:text-[#8EB69B]/80 mt-2 relative z-10 font-medium">
            Target kedisiplinan 95%
          </div>
        </div>
      </div>

      {/* 3. VIEW 1: LIVE REALTIME MONITORING TABLE */}
      {activeView === 'REALTIME' && (
        <div className="bg-white dark:bg-[#0B2B26]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden">
          {/* Table Filters & Search */}
          <div className="p-3.5 border-b border-slate-100 dark:border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#051F20] dark:bg-[#8EB69B] text-white dark:text-[#051F20] border-[#051F20] dark:border-[#8EB69B]'
                    : 'bg-white dark:bg-transparent text-slate-600 dark:text-[#8EB69B]/80 border-slate-200 dark:border-[#163832] hover:bg-slate-50 dark:hover:bg-[#163832]/30'
                }`}
              >
                Semua ({liveSessions.length})
              </button>
              <button
                onClick={() => setStatusFilter('HADIR')}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'HADIR'
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500'
                    : 'bg-white dark:bg-transparent text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-[#163832] hover:bg-slate-50 dark:hover:bg-[#163832]/30'
                }`}
              >
                Tepat Waktu ({liveSessions.filter(s => s.attendanceStatus === 'HADIR_TEPAT').length})
              </button>
              <button
                onClick={() => setStatusFilter('TERLAMBAT')}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'TERLAMBAT'
                    ? 'bg-amber-600 dark:bg-amber-500 text-white border-amber-600 dark:border-amber-500'
                    : 'bg-white dark:bg-transparent text-amber-700 dark:text-amber-400 border-slate-200 dark:border-[#163832] hover:bg-slate-50 dark:hover:bg-[#163832]/30'
                }`}
              >
                Terlambat ({lateCount})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING_JURNAL')}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'PENDING_JURNAL'
                    ? 'bg-rose-600 dark:bg-rose-500 text-white border-rose-600 dark:border-rose-500'
                    : 'bg-white dark:bg-transparent text-rose-700 dark:text-rose-400 border-slate-200 dark:border-[#163832] hover:bg-slate-50 dark:hover:bg-[#163832]/30'
                }`}
              >
                Pending Jurnal ({pendingJournalCount})
              </button>
              <button
                onClick={() => setStatusFilter('BADAL')}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'BADAL'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                    : 'bg-white dark:bg-transparent text-[#4F46E5] dark:text-indigo-400 border-slate-200 dark:border-[#163832] hover:bg-slate-50 dark:hover:bg-[#163832]/30'
                }`}
              >
                Guru Badal ({activeBadalCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari guru, kelas, mapel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-xs focus:ring-1 focus:ring-[#1B4332] text-slate-900 dark:text-emerald-50 outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-emerald-900/40 text-slate-500 dark:text-emerald-400/70 font-semibold uppercase tracking-wider text-[10px] bg-slate-50 dark:bg-[#0f1a15]/50 dark:bg-[#0f1a15]/40">
                  <th className="py-3 px-4">Asatidz Pengajar</th>
                  <th className="py-3 px-4">Kelas & Mapel</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Status Absensi</th>
                  <th className="py-3 px-4">Status Jurnal</th>
                  <th className="py-3 px-4">Guru Pengganti</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-emerald-300/80">
                {filteredLiveSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      Tidak ada data monitoring yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredLiveSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50 dark:bg-[#0f1a15]/50 dark:hover:bg-[#162720]/50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-emerald-50">
                            {session.actualTeacherName}
                          </div>
                          {session.isBadal && (
                            <div className="text-[10px] text-slate-400">
                              Jadwal Asli: {session.originalTeacherName}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-emerald-100">
                            {session.className}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {session.subject} ({session.hours} JP)
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-emerald-400/70">
                        {session.timeSlot}
                      </td>

                      <td className="py-3 px-4">
                        {session.attendanceStatus === 'HADIR_TEPAT' && (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 font-mono">
                            Hadir ({session.checkInTime})
                          </div>
                        )}
                        {session.attendanceStatus === 'HADIR_TERLAMBAT' && (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 font-mono">
                            Terlambat +{session.lateMinutes}m ({session.checkInTime})
                          </div>
                        )}
                        {session.attendanceStatus === 'BELUM_HADIR' && (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#0f1a15] text-slate-500 border border-slate-200 dark:border-emerald-800/40">
                            Menunggu Sesi
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {session.isJournalComplete ? (
                          <div>
                            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              Lengkap
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {session.journalTopic}
                            </div>
                          </div>
                        ) : session.attendanceStatus !== 'BELUM_HADIR' ? (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                            Pending Jurnal
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">-</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {session.isBadal ? (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                            Pengganti Aktif
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px]">-</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedSessionDetail(session)}
                          className="px-2.5 py-1 rounded text-[10px] font-medium border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-100 dark:hover:bg-[#162720]/50 text-slate-700 dark:text-emerald-300/80 transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VIEW 2: MONITORING GURU PENGGANTI (BADAL) */}
      {activeView === 'BADAL' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B2B26]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-display font-bold text-slate-900 dark:text-emerald-50">
                  Monitoring Penugasan Guru Badal Hari Ini
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemantauan asatidz pengganti untuk memastikan KBM tetap berjalan 100%.
                </p>
              </div>
              {onNavigateToBadal && (
                <button
                  onClick={onNavigateToBadal}
                  className="px-3.5 py-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-3xs"
                >
                  Kelola Penugasan Badal
                </button>
              )}
            </div>

            {/* Badal Schedule Table */}
            <div className="overflow-x-auto mt-4 pt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-emerald-900/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px] bg-slate-50 dark:bg-[#0f1a15]/50 dark:bg-[#0f1a15]/40">
                    <th className="py-3 px-4">Guru Utama (Berhalangan)</th>
                    <th className="py-3 px-4">Guru Pengganti</th>
                    <th className="py-3 px-4">Kelas & Mapel</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Alasan Badal</th>
                    <th className="py-3 px-4">Status Penugasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-emerald-300/80">
                  {liveSessions.filter(s => s.isBadal).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                        Tidak ada guru pengganti yang bertugas hari ini.
                      </td>
                    </tr>
                  ) : (
                    liveSessions.filter(s => s.isBadal).map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50 dark:bg-[#0f1a15]/50 dark:hover:bg-[#162720]/50/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-emerald-50">
                          {session.originalTeacherName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {session.actualTeacherName}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {session.className} • {session.subject} ({session.hours} JP)
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {session.timeSlot}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {session.badalReason}
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                            Disetujui & Bertugas
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW 3: REKAP & ANALITIK KINERJA */}
      {activeView === 'REKAP' && (
        <div className="space-y-6">
          {/* 7-Day Teacher Attendance Trend Chart */}
          <div className="bg-white dark:bg-[#0B2B26]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-[#163832]/60 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                    Tren Kehadiran Guru (7 Hari Terakhir)
                  </h3>
                  <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#0f1a15] text-slate-600 dark:text-emerald-300/80">
                    7 Hari
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi kedisiplinan dan jumlah kehadiran harian tenaga pendidik.
                </p>
              </div>

              {/* Minimalist Legend */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#1B4332]" />
                  <div className="text-slate-600 dark:text-emerald-300/80">Tepat Waktu</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
                  <div className="text-slate-600 dark:text-emerald-300/80">Terlambat</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-[#162720]/50" />
                  <div className="text-slate-600 dark:text-emerald-300/80">Izin / Sakit</div>
                </div>
              </div>
            </div>

            {/* Quick 7-Day Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-[#0f1a15]/70 dark:bg-[#0f1a15]/50 rounded-lg border border-slate-100 dark:border-emerald-900/40 text-center">
                <div className="text-[10px] font-medium text-slate-500 uppercase">Rata-Rata Kehadiran</div>
                <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">97.1%</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0f1a15]/70 dark:bg-[#0f1a15]/50 rounded-lg border border-slate-100 dark:border-emerald-900/40 text-center">
                <div className="text-[10px] font-medium text-slate-500 uppercase">Total Kehadiran Tepat</div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-emerald-50 mt-0.5">124 Sesi</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0f1a15]/70 dark:bg-[#0f1a15]/50 rounded-lg border border-slate-100 dark:border-emerald-900/40 text-center">
                <div className="text-[10px] font-medium text-slate-500 uppercase">Total Badal / Izin</div>
                <div className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">5 Sesi</div>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg text-xs space-y-1 shadow-lg border border-slate-800">
                            <p className="font-bold border-b border-slate-800 pb-1">{label}</p>
                            {payload.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between gap-4 text-[11px]">
                                <span style={{ color: p.color }}>{p.name}:</span>
                                <span className="font-mono font-bold">{p.value} Guru</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="tepat" name="Tepat Waktu" stackId="a" fill={isDarkMode ? '#8EB69B' : '#1B4332'} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="terlambat" name="Terlambat" stackId="a" fill={isDarkMode ? '#DAF1DE' : '#D97706'} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="izin" name="Izin / Sakit" stackId="a" fill={isDarkMode ? '#163832' : '#94a3b8'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trajectory Chart */}
          <div className="bg-white dark:bg-[#0B2B26]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-[#163832]/60 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                  Tren Kehadiran & Ketaatan Jurnal Semester
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grafik agregat kedisiplinan dan kelengkapan jurnal per bulan.
                </p>
              </div>

              {/* Minimalist Legend */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#1B4332]" />
                  <div className="text-slate-600 dark:text-emerald-300/80">Kehadiran</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#4F46E5]" />
                  <div className="text-slate-600 dark:text-emerald-300/80">Jurnal KBM</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#D97706]" />
                  <div className="text-slate-600 dark:text-emerald-300/80">Tepat Waktu</div>
                </div>
              </div>
            </div>

            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs space-y-1 shadow-lg">
                            <p className="font-bold border-b border-slate-800 pb-1">{label}</p>
                            {payload.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between gap-4 text-[11px]">
                                <span style={{ color: p.color }}>{p.name}:</span>
                                <span className="font-mono font-bold">{p.value}%</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }} 
                  />
                  <Area type="monotone" dataKey="kehadiran" name="Kehadiran" stroke={isDarkMode ? '#DAF1DE' : '#1B4332'} strokeWidth={2} fill={isDarkMode ? '#DAF1DE' : '#1B4332'} fillOpacity={0.08} />
                  <Line type="monotone" dataKey="jurnal" name="Jurnal KBM" stroke={isDarkMode ? '#8EB69B' : '#4F46E5'} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="tepat" name="Tepat Waktu" stroke={isDarkMode ? '#163832' : '#D97706'} strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2.5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2-Column Visuals Grid: Status Distribution Donut & Radar Evaluasi Kompetensi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Donut Chart: Komposisi Status KBM Hari Ini */}
            <div className="bg-white dark:bg-[#0B2B26]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#163832]/60">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                    Distribusi Status Sesi KBM Hari Ini
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proporsi ketepatan waktu, guru badal, dan izin pengajar.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0f1a15] text-slate-600 dark:text-emerald-300/80">
                  {totalSessionsToday} Sesi
                </span>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-lg border border-slate-800">
                              <p className="font-semibold">{data.name}</p>
                              <p className="font-mono font-bold mt-0.5">{data.value} Sesi ({totalSessionsToday > 0 ? Math.round(((data.value as number) / totalSessionsToday) * 100) : 0}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Minimal Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-emerald-900/40 text-center">
                {statusDistributionData.map((item, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-slate-50 dark:bg-[#0f1a15]/60 dark:bg-[#0f1a15]/40">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-slate-500">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-emerald-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Chart: Evaluasi Mutu & Kinerja Akademik */}
            <div className="bg-white dark:bg-[#0B2B26]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#163832]/60">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                    Rubrik Mutu & Standar Kinerja Asatidz
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pencapaian target indikator mutu pembelajaran dan kedisiplinan.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#1B4332]" />
                    <span className="text-[10px] text-slate-500">Capaian</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[10px] text-slate-500">Target</span>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={70} data={evaluationRadarData}>
                    <PolarGrid stroke="#e2e8f0" className="dark:opacity-15" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <Radar name="Capaian" dataKey="score" stroke={isDarkMode ? '#DAF1DE' : '#1B4332'} fill={isDarkMode ? '#DAF1DE' : '#1B4332'} fillOpacity={0.25} />
                    <Radar name="Target Mutu" dataKey="target" stroke={isDarkMode ? '#8EB69B' : '#94a3b8'} fill={isDarkMode ? '#8EB69B' : '#94a3b8'} fillOpacity={0.08} strokeDasharray="3 3" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded-lg text-xs space-y-1 shadow-lg">
                              <p className="font-bold border-b border-slate-800 pb-1">{payload[0].payload.metric}</p>
                              <p className="text-emerald-400 font-mono">Capaian: {payload[0].value}%</p>
                              <p className="text-slate-400 font-mono">Target: {payload[1]?.value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-emerald-900/40 text-xs text-slate-500">
                <span>Indeks Rata-Rata Mutu: <strong className="text-slate-900 dark:text-emerald-50 font-mono">94.8%</strong></span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Memenuhi Standar Mutu BQA</span>
              </div>
            </div>
          </div>

          {/* TOP 5 USTADZ TERBAIK (DI PALING BAWAH - SIMPEL, MINIMALIS, MODERN) */}
          <div className="bg-white dark:bg-[#0B2B26]/60 border border-slate-200/80 dark:border-[#163832] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#163832]/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                Top 5 Ustadz Terbaik
              </h3>
              <span className="text-xs text-slate-400 font-mono">Bulan Ini</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {top5Teachers.map((teacher, idx) => (
                <div
                  key={teacher.id}
                  onClick={() => setSelectedTopTeacherDetail(teacher)}
                  className="py-2.5 px-2 hover:bg-slate-50 dark:bg-[#0f1a15]/80 dark:hover:bg-[#162720]/50/40 rounded-lg transition-colors flex items-center justify-between gap-4 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center font-mono font-bold text-xs ${
                      idx === 0 
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                        : 'bg-slate-100 text-slate-600 dark:bg-[#0f1a15] dark:text-emerald-400/70'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-semibold text-slate-900 dark:text-emerald-50 block truncate">
                        {teacher.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {teacher.position} • {teacher.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 font-mono text-slate-600 dark:text-emerald-300/80 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 block font-sans">Kehadiran</span>
                      <span className="font-semibold text-slate-800 dark:text-emerald-100">{teacher.onTimeRate}%</span>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 block font-sans">Jurnal</span>
                      <span className="font-semibold text-slate-800 dark:text-emerald-100">{teacher.journalRate}%</span>
                    </div>
                    <div className="text-right sm:pl-3 sm:border-l sm:border-slate-200 sm:dark:border-emerald-900/40">
                      <span className="text-[10px] text-slate-400 block font-sans">Skor</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{teacher.overallScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Session Detail Modal (Minimalist Drawer) */}
      {selectedSessionDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121f1a] rounded-xl border border-slate-200 dark:border-emerald-900/40 max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-stone-150 dark:border-emerald-900/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                  Rincian Sesi KBM
                </h3>
                <div className="text-[11px] text-slate-400 font-mono">
                  {selectedSessionDetail.className} • {selectedSessionDetail.timeSlot}
                </div>
              </div>
              <button 
                onClick={() => setSelectedSessionDetail(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                <div className="text-slate-500">Guru Bertugas:</div>
                <div className="font-semibold text-slate-900 dark:text-emerald-50">{selectedSessionDetail.actualTeacherName}</div>
              </div>

              {selectedSessionDetail.isBadal && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                  <div className="text-slate-500">Guru Asli:</div>
                  <div className="text-slate-700 dark:text-emerald-300/80">{selectedSessionDetail.originalTeacherName} ({selectedSessionDetail.badalReason})</div>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                <div className="text-slate-500">Status Check-In:</div>
                <div className="font-mono font-semibold text-slate-900 dark:text-emerald-50">
                  {selectedSessionDetail.checkInTime ? `Pukul ${selectedSessionDetail.checkInTime}` : 'Belum Check-In'}
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                <div className="text-slate-500">Status Jurnal:</div>
                <div className={`font-semibold ${selectedSessionDetail.isJournalComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedSessionDetail.isJournalComplete ? 'Sudah Diserahkan' : 'Belum Diisi'}
                </div>
              </div>

              {selectedSessionDetail.journalTopic && (
                <div className="py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                  <div className="text-slate-500 mb-1">Materi yang Diajarkan:</div>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#0f1a15] rounded-lg text-slate-800 dark:text-emerald-100 italic">
                    "{selectedSessionDetail.journalTopic}"
                  </p>
                </div>
              )}

              <div className="flex justify-between py-1.5">
                <div className="text-slate-500">Presensi Santri:</div>
                <div className="font-mono font-semibold text-slate-900 dark:text-emerald-50">
                  {selectedSessionDetail.studentPresentCount} / {selectedSessionDetail.totalStudents} Santri Hadir
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-150 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#0f1a15] flex justify-end">
              <button
                onClick={() => setSelectedSessionDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Top Teacher Scorecard Detail Modal */}
      {selectedTopTeacherDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121f1a] rounded-xl border border-slate-200 dark:border-emerald-900/40 max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-stone-150 dark:border-emerald-900/40 flex items-center justify-between bg-slate-50 dark:bg-[#0f1a15]/50 dark:bg-[#0f1a15]/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/60 dark:border-amber-800/40">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                    Rapor Kinerja Ustadz Terbaik
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {selectedTopTeacherDetail.unit} • {selectedTopTeacherDetail.nip}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTopTeacherDetail(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Profile Card */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#0f1a15] rounded-xl border border-slate-100 dark:border-emerald-800/40">
                <TeacherAvatar teacher={selectedTopTeacherDetail} size="lg" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-emerald-50 text-sm">
                    {selectedTopTeacherDetail.name}
                  </h4>
                  <p className="text-slate-500 text-xs">
                    {selectedTopTeacherDetail.position}
                  </p>
                </div>
              </div>

              {/* Overall Score Highlight */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-center">
                <span className="text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-300 tracking-wider">
                  Skor Performa Kumulatif
                </span>
                <div className="text-2xl font-mono font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {selectedTopTeacherDetail.overallScore}%
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                  Kategori: <span className="font-semibold">{selectedTopTeacherDetail.badgeLabel}</span>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                  <span className="text-slate-500">Kedisiplinan Check-In:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-emerald-50">{selectedTopTeacherDetail.onTimeRate}% Tepat Waktu</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                  <span className="text-slate-500">Kepatuhan Jurnal KBM:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-emerald-50">{selectedTopTeacherDetail.journalRate}% Lengkap</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                  <span className="text-slate-500">Total Jam Mengajar:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-emerald-50">{selectedTopTeacherDetail.totalJP} JP / Bulan</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-emerald-900/40">
                  <span className="text-slate-500">Rating Evaluasi Santri:</span>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {selectedTopTeacherDetail.studentRating} / 5.0
                  </span>
                </div>
              </div>

              {/* Award / Achievements List */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-emerald-300/80 block mb-2">
                  Capaian & Catatan Positif:
                </span>
                <div className="space-y-1.5">
                  {selectedTopTeacherDetail.awards?.map((award: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-emerald-400/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{award}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-150 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#0f1a15] flex justify-end">
              <button
                onClick={() => setSelectedTopTeacherDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


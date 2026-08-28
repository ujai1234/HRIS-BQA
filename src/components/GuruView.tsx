import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  CalendarDays,
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  BookOpen,
  MapPin,
  Check,
  Coffee,
  ArrowRight,
  Printer,
  ChevronDown,
  UserCheck,
  Plus,
  Search,
  Filter,
  ClipboardList,
  Activity,
  X
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, AttendanceRecord } from '../types';
import { ClockInModal } from './ClockInModal';
import { JournalModal } from './JournalModal';
import { SalarySlipModal } from './SalarySlipModal';
import { SlipGajiView } from './SlipGajiView';
import { getLateCategoryLabel, formatIndonesianDate, formatRupiah } from '../utils/formatters';
import { toast } from 'sonner';

export type GuruTabType = 'overview' | 'clockin_journal' | 'jadwal' | 'slip_gaji';

interface GuruViewProps {
  initialTab?: GuruTabType;
}

export const GuruView: React.FC<GuruViewProps> = ({ initialTab = 'overview' }) => {
  const { 
    currentUser, 
    schedules, 
    attendances, 
    teachers,
    badalAssignments, 
    selectedPeriod, 
    calculateTeacherPayroll,
    setCurrentPath
  } = useHRIS();

  const [activeSubTab, setActiveSubTab] = useState<GuruTabType>(initialTab);

  useEffect(() => {
    // If the URL matches /dashboard/guru, default to 'overview'
    if (initialTab === 'clockin_journal' && window.location.pathname === '/dashboard/guru') {
      setActiveSubTab('overview');
    } else {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: GuruTabType) => {
    setActiveSubTab(tab);
    if (tab === 'overview') setCurrentPath('/dashboard/guru');
    else if (tab === 'clockin_journal') setCurrentPath('/dashboard/guru/clockin');
    else if (tab === 'jadwal') setCurrentPath('/dashboard/guru/jadwal');
    else if (tab === 'slip_gaji') setCurrentPath('/dashboard/guru/slip');
  };

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
  
  const getTodayDayName = () => {
    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayIndex = new Date().getDay();
    const day = days[todayIndex];
    return day === 'Ahad' ? 'Senin' : day;
  };

  const actualTodayDay = getTodayDayName();
  const [selectedDay, setSelectedDay] = useState<string>(actualTodayDay);

  // Modals state
  const [activeClockInSchedule, setActiveClockInSchedule] = useState<ClassSchedule | null>(null);
  const [activeJournalData, setActiveJournalData] = useState<{
    attendance: AttendanceRecord;
    schedule: ClassSchedule;
  } | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const teacherPayroll = calculateTeacherPayroll(currentUser?.id || 'T-08', selectedPeriod);
  const todayStr = new Date().toISOString().split('T')[0];

  // List of all Badal assignments assigned to current teacher that are approved
  const myApprovedBadalList = useMemo(() => {
    return badalAssignments.filter(
      (b) => b.badalTeacherId === currentUser?.id && (b.status === 'APPROVED' || b.status === 'COMPLETED')
    );
  }, [badalAssignments, currentUser?.id]);

  // Approved Badal assignments specifically for today
  const todayBadalForMe = useMemo(() => {
    return myApprovedBadalList.filter((b) => b.date === todayStr || !b.date);
  }, [myApprovedBadalList, todayStr]);

  // Schedules for the selected day (Regular + Badal assigned to this teacher)
  const daySchedules = useMemo(() => {
    return schedules.filter((s) => {
      const isRegular = s.teacherId === currentUser?.id && s.dayOfWeek === selectedDay;
      const isBadal = badalAssignments.some((b) => {
        if (b.scheduleId !== s.id || b.badalTeacherId !== currentUser?.id) return false;
        if (b.status !== 'APPROVED' && b.status !== 'COMPLETED') return false;
        return s.dayOfWeek === selectedDay;
      });
      return isRegular || isBadal;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, selectedDay, currentUser?.id, badalAssignments]);

  const allMySchedules = useMemo(() => {
    return schedules.filter((s) => s.teacherId === currentUser?.id);
  }, [schedules, currentUser?.id]);

  const totalWeeklyHours = useMemo(() => {
    return allMySchedules.reduce((sum, s) => sum + s.hours, 0);
  }, [allMySchedules]);

  const distinctClassesCount = useMemo(() => {
    return new Set(allMySchedules.map(s => s.className)).size;
  }, [allMySchedules]);

  const getAttendanceForSchedule = (scheduleId: string) => {
    return attendances.find((a) => a.scheduleId === scheduleId && a.date === todayStr);
  };

  const getBadalInfoForSchedule = (scheduleId: string) => {
    return badalAssignments.find(
      (b) => b.scheduleId === scheduleId && (b.date === todayStr || !b.date) && (b.status === 'APPROVED' || b.status === 'COMPLETED')
    );
  };

  const missedJournalRecords = useMemo(() => {
    return attendances.filter((a) => {
      const isMyRecord = a.teacherId === currentUser?.id || a.actualTeacherId === currentUser?.id;
      if (!isMyRecord) return false;
      return !a.journal && a.status !== 'SELESAI' && (a.status === 'HADIR_JURNAL_KOSONG' || (!!a.clockInTime && a.status !== 'IZIN' && a.status !== 'SAKIT' && a.status !== 'ALPA'));
    });
  }, [attendances, currentUser?.id]);

  const missedShiftsWithDetails = useMemo(() => {
    return missedJournalRecords.map((att) => {
      let sched = schedules.find((s) => s.id === att.scheduleId);
      if (!sched) {
        sched = {
          id: att.scheduleId,
          teacherId: att.teacherId || currentUser?.id || 'T-08',
          subject: 'KBM Mengajar',
          className: 'Kelas Terdaftar',
          unit: currentUser?.unit || 'SMP',
          dayOfWeek: 'Senin',
          startTime: att.clockInTime || '07:30',
          endTime: '08:50',
          hours: 2,
          room: 'Ruang Kelas',
        };
      }
      return {
        attendance: att,
        schedule: sched,
        hours: sched.hours || 2,
        isPastShift: att.date < todayStr,
        isTodayShift: att.date === todayStr,
      };
    });
  }, [missedJournalRecords, schedules, currentUser, todayStr]);

  const todayPendingJournals = useMemo(() => {
    return missedShiftsWithDetails.filter((m) => m.isTodayShift);
  }, [missedShiftsWithDetails]);

  const handleClockInSuccess = (schedule: ClassSchedule) => {
    const updatedAtt = attendances.find((a) => a.scheduleId === schedule.id && a.date === todayStr) || {
      id: `ATT-${Date.now()}`,
      scheduleId: schedule.id,
      teacherId: currentUser?.id || 'T-08',
      actualTeacherId: currentUser?.id || 'T-08',
      date: todayStr,
      clockInTime: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      lateMinutes: 0,
      lateCategory: 'TEPAT_WAKTU' as const,
      status: 'HADIR_JURNAL_KOSONG' as const,
      isBadal: false,
    };

    setTimeout(() => {
      setActiveJournalData({
        attendance: updatedAtt,
        schedule: schedule,
      });
    }, 200);
  };

  const scheduleCountByDay = useMemo(() => {
    const counts: Record<string, { sessions: number; hours: number }> = {};
    daysOfWeek.forEach((day) => {
      const dayScheds = schedules.filter((s) => {
        if (s.dayOfWeek !== day) return false;
        const isRegular = s.teacherId === currentUser?.id;
        const isBadal = badalAssignments.some(
          (b) => b.scheduleId === s.id && b.badalTeacherId === currentUser?.id && (b.status === 'APPROVED' || b.status === 'COMPLETED')
        );
        return isRegular || isBadal;
      });
      counts[day] = {
        sessions: dayScheds.length,
        hours: dayScheds.reduce((sum, s) => sum + s.hours, 0),
      };
    });
    return counts;
  }, [schedules, currentUser?.id, badalAssignments]);

  return (
    <div className="space-y-6">
      {/* 1. Sleek, Minimalist Header without Icons */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100 leading-tight">
            Ustadz {currentUser?.name || 'Asatidz'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Unit {currentUser?.unit || 'SMP'} • NIP: {currentUser?.nip || 'BQA-008'}
          </p>
        </div>

        {/* Minimalist Segmented Tabs without Icons */}
        <div className="flex flex-wrap items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200/60 dark:border-stone-700/60 text-xs">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Beranda
          </button>

          <button
            onClick={() => handleTabChange('clockin_journal')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeSubTab === 'clockin_journal'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Presensi & Jurnal
          </button>

          <button
            onClick={() => handleTabChange('jadwal')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeSubTab === 'jadwal'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Jadwal Pekanan
          </button>

          <button
            onClick={() => handleTabChange('slip_gaji')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeSubTab === 'slip_gaji'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Slip Gaji
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW (TEACHER DASHBOARD)
          ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Badal Assignment Banner (If any approved badal for today) */}
          {todayBadalForMe.length > 0 && (
            <div className="bg-white dark:bg-stone-900 border-l-4 border-l-[#B08968] border-stone-200 dark:border-stone-850 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {todayBadalForMe.length} Penugasan Badal Hari Ini ({actualTodayDay})
                  </h4>
                  <span className="text-[10px] font-bold text-[#B08968] bg-[#B08968]/5 border border-[#B08968]/15 px-2 py-0.5 rounded">
                    Disetujui
                  </span>
                </div>
                <p className="text-xs text-stone-550 dark:text-stone-400 mt-1 leading-relaxed">
                  Sesi kelas pengganti otomatis terintegrasi ke menu Presensi & Jurnal Anda.
                </p>
              </div>

              <button
                onClick={() => setActiveSubTab('clockin_journal')}
                className="bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer self-start sm:self-auto shrink-0 active:scale-95 shadow-3xs"
              >
                Buka Jurnal Mengajar
              </button>
            </div>
          )}

          {/* Quick Stats Grid - Unified Sipel Minimalist Standard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">
                Total Kelas Diajar
              </span>
              <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-stone-900 dark:text-stone-100 mt-1">
                {distinctClassesCount || 1}
              </p>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
                Kelas KBM Terdaftar
              </span>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">
                Beban Mengajar
              </span>
              <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-stone-900 dark:text-stone-100 mt-1">
                {totalWeeklyHours} <span className="text-xs font-normal text-stone-500 dark:text-stone-400 font-sans">JP/mgg</span>
              </p>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
                Total Jam Pelajaran
              </span>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">
                Jadwal Hari Ini
              </span>
              <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-[#1B4332] dark:text-emerald-400 mt-1">
                {daySchedules.length}
              </p>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
                Sesi KBM Hari {actualTodayDay}
              </span>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">
                Jurnal Perlu Diisi
              </span>
              <p className={`text-2xl sm:text-3xl font-semibold font-mono tracking-tight mt-1 ${
                missedJournalRecords.length > 0 ? 'text-[#D97706]' : 'text-stone-900 dark:text-stone-100'
              }`}>
                {missedJournalRecords.length}
              </p>
              <span className={`text-[11px] mt-1.5 block ${
                missedJournalRecords.length > 0 ? 'text-[#D97706]' : 'text-emerald-700 dark:text-emerald-400'
              }`}>
                {missedJournalRecords.length > 0 ? 'Perlu Dilengkapi Segera' : 'Semua Jurnal Lengkap'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Vertical Daily Timeline & Quick Actions */}
            <div className="lg:col-span-8 space-y-6">
              {/* Vertical Daily Timeline */}
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                      Jadwal Mengajar Hari Ini ({actualTodayDay})
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Sesi tatap muka dan kesiapan jurnal guru.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('clockin_journal')}
                    className="text-xs font-medium text-[#1B4332] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Masuk Kelas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Timeline vertical minimalist */}
                {daySchedules.length === 0 ? (
                  <div className="text-center py-8 text-xs text-stone-400">
                    <Coffee className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <span>Tidak ada jadwal mengajar pada hari {actualTodayDay}</span>
                  </div>
                ) : (
                  <div className="relative border-l border-stone-200 dark:border-stone-800 ml-3 pl-4 space-y-5 py-1">
                    {daySchedules.map((schedule) => {
                      const att = getAttendanceForSchedule(schedule.id);
                      const badalInfo = getBadalInfoForSchedule(schedule.id);
                      const isBadalForMe = badalInfo && badalInfo.badalTeacherId === currentUser?.id;
                      const isSubstituted = badalInfo && badalInfo.originalTeacherId === currentUser?.id;
                      const origTeacher = badalInfo ? teachers.find(t => t.id === badalInfo.originalTeacherId) : (schedule.teacherId !== currentUser?.id ? teachers.find(t => t.id === schedule.teacherId) : null);

                      const hasClockedIn = !!att && !!att.clockInTime;
                      const isCompleted = att?.status === 'SELESAI' || !!att?.journal;

                      return (
                        <div key={schedule.id} className="relative group">
                          {/* Dot marker */}
                          <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                            isCompleted 
                              ? 'bg-[#1B4332] border-[#1B4332]' 
                              : hasClockedIn 
                                ? 'bg-[#D97706] border-[#D97706]' 
                                : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700'
                          }`} />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-200">
                                  {schedule.startTime} - {schedule.endTime} WIB
                                </span>
                                <span className="text-[10px] font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                                  {schedule.hours} JP
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  Kelas {schedule.className} ({schedule.room})
                                </span>
                                {isBadalForMe && origTeacher && (
                                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300/50 px-1.5 py-0.2 rounded font-mono">
                                    BADAL: Menggantikan Ustadz {origTeacher.name}
                                  </span>
                                )}
                                {isSubstituted && (
                                  <span className="text-[10px] font-medium text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.2 rounded italic">
                                    Dialihkan ke Badal
                                  </span>
                                )}
                              </div>
                              <h3 className="font-medium text-stone-900 dark:text-stone-100 text-sm mt-1">
                                {schedule.subject}
                              </h3>
                            </div>

                            <div className="shrink-0 pt-1 sm:pt-0">
                              {isCompleted ? (
                                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 px-2 py-0.5 rounded">
                                  Lengkap
                                </span>
                              ) : hasClockedIn ? (
                                <span className="text-[11px] font-medium text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded">
                                  Jurnal Pending
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-stone-500 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded">
                                  Belum Mulai
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Activities logs */}
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
                <div className="pb-3 mb-3 border-b border-stone-100 dark:border-stone-800">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                    Aktivitas & Log Kelas Terbaru
                  </h2>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-750 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200">Setoran Hafalan Juz 30 Santri Baru</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Ustadz menilai setoran hafalan Zaid bin Tsabit.</p>
                    </div>
                    <span className="font-mono text-[10px] text-stone-400">Kemarin</span>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-750 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200">Disposisi Sarana Pembelajaran Disetujui</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Kepala Unit menyetujui pengadaan Kitab Tafsir Jalalayn.</p>
                    </div>
                    <span className="font-mono text-[10px] text-stone-400">2 hari lalu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Quick Actions Menu */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
                <div className="pb-3 mb-3 border-b border-stone-100 dark:border-stone-800">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                    Aksi Cepat Asatidz
                  </h2>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveSubTab('clockin_journal')}
                    className="w-full text-left p-3 rounded-lg border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#1B4332]/10 text-[#1B4332] dark:text-emerald-400 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200 text-xs">Mulai Presensi Kelas</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Lakukan clock-in mengajar hari ini</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleTabChange('jadwal')}
                    className="w-full text-left p-3 rounded-lg border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200 text-xs">Jadwal Mengajar Pekanan</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Lihat agenda pekanan & ruang KBM</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleTabChange('slip_gaji')}
                    className="w-full text-left p-3 rounded-lg border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200 text-xs">Lihat Slip Gaji Asatidz</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Rincian honor KBM bulan aktif</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setCurrentPath('/dashboard/guru/kebutuhan')}
                    className="w-full text-left p-3 rounded-lg border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200 text-xs">Ajukan Sarana Kelas</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Buku, ATK, kitab, dan fasilitas</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PRESENSI & JURNAL KBM
          ========================================================================= */}
      {activeSubTab === 'clockin_journal' && (
        <div className="space-y-6">
          {/* Approved Badal Assignments Notification Box (If any badal assigned) */}
          {myApprovedBadalList.length > 0 && (
            <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 rounded-xl p-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span>Penugasan Guru Badal</span>
                      <span className="text-[10px] bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono px-2 py-0.5 rounded">
                        {myApprovedBadalList.length} Sesi Terjadwal
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                      Jadwal kelas pengganti otomatis disinkronkan ke antrean KBM Anda.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {myApprovedBadalList.map((b) => {
                    const bSched = schedules.find((s) => s.id === b.scheduleId);
                    const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
                    if (!bSched) return null;

                    return (
                      <div
                        key={b.id}
                        className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100 truncate">
                            <span className="text-stone-600 dark:text-stone-400 font-mono text-[11px]">
                              {bSched.dayOfWeek}, {bSched.startTime}
                            </span>
                            <span>• {bSched.subject} ({bSched.className})</span>
                          </div>
                          <p className="text-[10px] text-stone-400 truncate mt-0.5">
                            Gantikan: <strong>Ustadz {origTeacher?.name || 'Guru'}</strong>
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedDay(bSched.dayOfWeek);
                            setActiveClockInSchedule(bSched);
                          }}
                          className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer shrink-0"
                        >
                          Buka Kelas
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Pending Journals Alert Bar (if any) */}
          {todayPendingJournals.length > 0 && (
            <div className="bg-white dark:bg-stone-900 border-l-4 border-l-sky-500 border-stone-200 dark:border-stone-850 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {todayPendingJournals.length} Jurnal Mengajar Belum Terisi
                </h4>
                <p className="text-[11px] text-stone-550 dark:text-stone-400 mt-1 leading-relaxed">
                  Presensi masuk tercatat. Harap lengkapi materi santri sebelum hari berakhir.
                </p>
              </div>

              <button
                onClick={() => {
                  const first = todayPendingJournals[0];
                  if (first) {
                    setActiveJournalData({
                      attendance: first.attendance,
                      schedule: first.schedule,
                    });
                  }
                }}
                className="bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 active:scale-95 shadow-3xs"
              >
                <span>Isi Jurnal Sekarang</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Segmented Day Switcher / Modern Horizontal Calendar Strip */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1B4332] dark:text-emerald-400" strokeWidth={1.5} />
                <span>Pilih Hari Sesi KBM</span>
              </span>
              <button
                onClick={() => setSelectedDay(actualTodayDay)}
                className="text-[11px] font-semibold text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Hari Ini ({actualTodayDay})
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {daysOfWeek.map((day) => {
                const info = scheduleCountByDay[day] || { sessions: 0, hours: 0 };
                const isSelected = selectedDay === day;
                const isToday = actualTodayDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative p-2.5 rounded-lg text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : isToday
                        ? 'bg-stone-50 dark:bg-stone-850 text-stone-800 dark:text-stone-200 border-[#1B4332]/40 dark:border-emerald-800/60 hover:bg-[#EEF2EE]'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    {isToday && (
                      <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-[#1B4332]'}`} />
                    )}
                    
                    <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-stone-950 dark:text-stone-50'}`}>
                      {day}
                    </span>
                    
                    <span className={`text-[10px] font-medium block mt-0.5 ${isSelected ? 'text-emerald-100/80' : 'text-stone-400 dark:text-stone-550'}`}>
                      {info.sessions > 0 ? `${info.sessions} Sesi • ${info.hours} JP` : 'Libur'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Class Schedule Cards List */}
          <div className="space-y-3">
            {daySchedules.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-8 sm:p-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center mx-auto">
                  <Coffee className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    Tidak Ada Jadwal Mengajar pada Hari {selectedDay}
                  </h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    Ustadz/Ustadzah tidak memiliki jam mengajar terjadwal pada hari {selectedDay}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {daySchedules.map((schedule) => {
                  const att = getAttendanceForSchedule(schedule.id);
                  const badalInfo = getBadalInfoForSchedule(schedule.id);
                  const isBadalForMe = badalInfo && badalInfo.badalTeacherId === currentUser?.id;
                  const isSubstituted = badalInfo && badalInfo.originalTeacherId === currentUser?.id;
                  const origTeacher = badalInfo ? teachers.find(t => t.id === badalInfo.originalTeacherId) : (schedule.teacherId !== currentUser?.id ? teachers.find(t => t.id === schedule.teacherId) : null);
                  const badalTeacher = badalInfo ? teachers.find(t => t.id === badalInfo.badalTeacherId) : null;

                  const hasClockedIn = !!att && !!att.clockInTime;
                  const isCompleted = att?.status === 'SELESAI' || !!att?.journal;
                  const isPendingJournal = hasClockedIn && !isCompleted && (att?.status === 'HADIR_JURNAL_KOSONG' || !att?.journal);
                  const lateInfo = att ? getLateCategoryLabel(att.lateCategory) : null;

                  return (
                    <div
                      key={schedule.id}
                      className={`bg-white dark:bg-stone-900 rounded-xl border transition-all p-5 ${
                        isBadalForMe
                          ? isCompleted
                            ? 'border-emerald-300 bg-[#F4FAF6] dark:bg-[#142018]'
                            : 'border-emerald-300/90 dark:border-emerald-800/80 bg-[#F8FCF9] dark:bg-[#121A15]'
                          : isCompleted
                          ? 'border-emerald-250/80 bg-[#FAFDFB] dark:bg-[#151D18]'
                          : isPendingJournal
                          ? 'border-[#E9DFB8] dark:border-[#524823] bg-[#FFFDF8] dark:bg-[#1F1D15]'
                          : isSubstituted
                          ? 'border-stone-200 dark:border-stone-800 opacity-60 bg-stone-50/50 dark:bg-stone-900/30'
                          : 'border-stone-200 dark:border-stone-850 hover:border-stone-300'
                      }`}
                    >
                      {/* Badal Header Badge */}
                      {isBadalForMe && (
                        <div className="mb-3 pb-2.5 border-b border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded font-mono">
                              TUGAS BADAL
                            </span>
                            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                              Menggantikan: <strong>Ustadz {origTeacher?.name || 'Guru Asli'}</strong>
                            </span>
                          </div>
                          {badalInfo && (
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                              Alasan: {badalInfo.reason} {badalInfo.notes ? `• "${badalInfo.notes}"` : ''}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Substituted Header Notice */}
                      {isSubstituted && (
                        <div className="mb-3 pb-2 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                          <span>Sesi ini telah dialihkan ke Guru Badal: <strong>Ustadz {badalTeacher?.name || 'Badal'}</strong></span>
                          <span className="text-[11px] italic">Status: Disetujui Kepsek</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-250 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded">
                              {schedule.startTime} - {schedule.endTime} WIB
                            </span>

                            <span className="text-[11px] font-bold text-[#1B4332] dark:text-emerald-400 bg-[#1B4332]/5 border border-[#1B4332]/15 px-2 py-0.5 rounded">
                              {schedule.hours} JP
                            </span>

                            {isBadalForMe && (
                              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300/50 px-2 py-0.5 rounded">
                                +{schedule.hours} JP Honor Badal
                              </span>
                            )}

                            <span className="text-xs font-medium text-stone-650 dark:text-stone-350">
                              Kelas {schedule.className} • {schedule.unit}
                            </span>

                            <span className="text-stone-300 dark:text-stone-700 font-mono">•</span>

                            <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400" strokeWidth={1.5} />
                              <span>{schedule.room}</span>
                            </span>
                          </div>

                          <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 tracking-tight">
                            {schedule.subject}
                          </h3>

                          {hasClockedIn && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                              <span className="text-stone-500">
                                Presensi: <strong className="font-mono text-stone-800 dark:text-stone-200">{att.clockInTime}</strong>
                              </span>

                              {att.lateMinutes > 4 ? (
                                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded">
                                  +{att.lateMinutes}m ({lateInfo?.label.split(' ')[0]})
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded">
                                  Tepat Waktu
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2 sm:pt-0 self-start sm:self-center shrink-0">
                          {isSubstituted ? (
                            <span className="text-xs text-stone-400 italic bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-200/60 dark:border-stone-700/60">
                              Sesi dialihkan ke badal
                            </span>
                          ) : !hasClockedIn ? (
                            <button
                              onClick={() => setActiveClockInSchedule(schedule)}
                              className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                              <span>{isBadalForMe ? 'Presensi Masuk (Badal)' : 'Presensi Masuk'}</span>
                            </button>
                          ) : !isCompleted ? (
                            <button
                              onClick={() => {
                                setActiveJournalData({
                                  attendance: att!,
                                  schedule: schedule,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                              <span>{isBadalForMe ? 'Isi Jurnal (Badal)' : 'Isi Jurnal Mengajar'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveJournalData({
                                  attendance: att!,
                                  schedule: schedule,
                                });
                              }}
                              className="inline-flex items-center gap-1 text-stone-750 hover:text-stone-900 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                              <span>Lihat Jurnal</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: JADWAL PEKANAN
          ========================================================================= */}
      {activeSubTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  Jadwal Mengajar Lengkap Pekanan
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Total {totalWeeklyHours} Jam Pelajaran (JP) reguler + {myApprovedBadalList.reduce((acc, b) => {
                    const s = schedules.find(sc => sc.id === b.scheduleId);
                    return acc + (s?.hours || 0);
                  }, 0)} JP badal atas nama {currentUser?.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {daysOfWeek.map((day) => {
                const regularScheds = schedules.filter((s) => s.teacherId === currentUser?.id && s.dayOfWeek === day);
                const badalScheds = schedules.filter((s) => {
                  if (s.dayOfWeek !== day) return false;
                  return badalAssignments.some(
                    (b) => b.scheduleId === s.id && b.badalTeacherId === currentUser?.id && (b.status === 'APPROVED' || b.status === 'COMPLETED')
                  );
                });
                
                const allDayScheds = [...regularScheds, ...badalScheds.filter(bs => !regularScheds.some(rs => rs.id === bs.id))]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                if (allDayScheds.length === 0) return null;

                return (
                  <div key={day} className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden text-xs">
                    <div className="bg-[#FBFBFA] dark:bg-[#141A17] px-4 py-2 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between font-bold text-stone-850 dark:text-stone-150">
                      <span>Hari {day}</span>
                      <span className="text-stone-400 text-[10px] font-bold">
                        {allDayScheds.length} Sesi • {allDayScheds.reduce((sum, s) => sum + s.hours, 0)} JP
                      </span>
                    </div>

                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                      {allDayScheds.map((s) => {
                        const isBadal = badalAssignments.some(b => b.scheduleId === s.id && b.badalTeacherId === currentUser?.id && (b.status === 'APPROVED' || b.status === 'COMPLETED'));
                        const badalAssignment = badalAssignments.find(b => b.scheduleId === s.id && b.badalTeacherId === currentUser?.id);
                        const origTeacher = badalAssignment ? teachers.find(t => t.id === badalAssignment.originalTeacherId) : (s.teacherId !== currentUser?.id ? teachers.find(t => t.id === s.teacherId) : null);

                        return (
                          <div key={s.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-stone-900">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-0.5 rounded">
                                {s.startTime} - {s.endTime}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-stone-900 dark:text-stone-150">{s.subject}</p>
                                  {isBadal && origTeacher && (
                                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                                      BADAL: Gantikan {origTeacher.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-400 font-medium">Kelas {s.className} • Unit {s.unit} • {s.room}</p>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-[#1B4332] dark:text-emerald-400 self-start sm:self-center bg-[#1B4332]/5 border border-[#1B4332]/10 px-2 py-0.5 rounded">
                              {s.hours} JP
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: SLIP GAJI
          ========================================================================= */}
      {activeSubTab === 'slip_gaji' && (
        <SlipGajiView />
      )}

      {/* MODALS */}
      {activeClockInSchedule && (
        <ClockInModal
          schedule={activeClockInSchedule}
          teacher={currentUser}
          onClose={() => setActiveClockInSchedule(null)}
          onSuccess={handleClockInSuccess}
        />
      )}

      {activeJournalData && (
        <JournalModal
          attendance={activeJournalData.attendance}
          schedule={activeJournalData.schedule}
          teacher={currentUser}
          onClose={() => setActiveJournalData(null)}
          onSuccess={() => {
            setActiveJournalData(null);
          }}
        />
      )}

      {showSlipModal && (
        <SalarySlipModal
          payroll={teacherPayroll}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};

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
  UserCheck
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, AttendanceRecord } from '../types';
import { ClockInModal } from './ClockInModal';
import { JournalModal } from './JournalModal';
import { SalarySlipModal } from './SalarySlipModal';
import { SlipGajiView } from './SlipGajiView';
import { getLateCategoryLabel, formatIndonesianDate, formatRupiah } from '../utils/formatters';

export type GuruTabType = 'clockin_journal' | 'jadwal' | 'slip_gaji';

interface GuruViewProps {
  initialTab?: GuruTabType;
}

export const GuruView: React.FC<GuruViewProps> = ({ initialTab = 'clockin_journal' }) => {
  const { 
    currentUser, 
    schedules, 
    attendances, 
    badalAssignments, 
    selectedPeriod, 
    calculateTeacherPayroll,
    setCurrentPath
  } = useHRIS();

  const [activeSubTab, setActiveSubTab] = useState<GuruTabType>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: GuruTabType) => {
    setActiveSubTab(tab);
    if (tab === 'clockin_journal') setCurrentPath('/dashboard/guru');
    else if (tab === 'jadwal') setCurrentPath('/dashboard/guru/jadwal');
    else if (tab === 'slip_gaji') setCurrentPath('/dashboard/guru/slip');
  };

  // Days list & determine today
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

  // Schedules for the selected day (Regular + Badal assigned to this teacher)
  const daySchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (s.dayOfWeek !== selectedDay) return false;
      const isRegular = s.teacherId === currentUser?.id;
      const isBadal = badalAssignments.some(
        (b) => b.scheduleId === s.id && b.badalTeacherId === currentUser?.id && b.status !== 'PENDING'
      );
      return isRegular || isBadal;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, selectedDay, currentUser?.id, badalAssignments]);

  // All schedules assigned to this teacher across the entire week
  const allMySchedules = useMemo(() => {
    return schedules.filter((s) => s.teacherId === currentUser?.id);
  }, [schedules, currentUser?.id]);

  const totalWeeklyHours = useMemo(() => {
    return allMySchedules.reduce((sum, s) => sum + s.hours, 0);
  }, [allMySchedules]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to find attendance record for a schedule today
  const getAttendanceForSchedule = (scheduleId: string) => {
    return attendances.find((a) => a.scheduleId === scheduleId && a.date === todayStr);
  };

  // Check if schedule was substituted by someone else
  const getBadalInfoForSchedule = (scheduleId: string) => {
    return badalAssignments.find(
      (b) => b.scheduleId === scheduleId && b.date === todayStr && b.status !== 'PENDING'
    );
  };

  // Missed journal entries detection (both today and past)
  const missedJournalRecords = useMemo(() => {
    return attendances.filter((a) => {
      const isMyRecord = a.teacherId === currentUser?.id || a.actualTeacherId === currentUser?.id;
      if (!isMyRecord) return false;
      const isPresentWithoutJournal =
        !a.journal &&
        a.status !== 'SELESAI' &&
        (a.status === 'HADIR_JURNAL_KOSONG' ||
          (!!a.clockInTime && a.status !== 'IZIN' && a.status !== 'SAKIT' && a.status !== 'ALPA'));
      return isPresentWithoutJournal;
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
      const hours = sched.hours || 2;
      const isPastShift = att.date < todayStr;
      const isTodayShift = att.date === todayStr;

      return {
        attendance: att,
        schedule: sched,
        hours,
        isPastShift,
        isTodayShift,
      };
    });
  }, [missedJournalRecords, schedules, currentUser, todayStr]);

  const todayPendingJournals = useMemo(() => {
    return missedShiftsWithDetails.filter((m) => m.isTodayShift);
  }, [missedShiftsWithDetails]);

  // Handle automatic transition from ClockIn to Journal Modal
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

  // Schedule count per day of week for calendar strip
  const scheduleCountByDay = useMemo(() => {
    const counts: Record<string, { sessions: number; hours: number }> = {};
    daysOfWeek.forEach((day) => {
      const dayScheds = schedules.filter((s) => {
        if (s.dayOfWeek !== day) return false;
        const isRegular = s.teacherId === currentUser?.id;
        const isBadal = badalAssignments.some(
          (b) => b.scheduleId === s.id && b.badalTeacherId === currentUser?.id && b.status !== 'PENDING'
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

  const todayCompletedCount = useMemo(() => {
    const todaySchedIds = schedules
      .filter((s) => s.dayOfWeek === actualTodayDay && (s.teacherId === currentUser?.id))
      .map((s) => s.id);
    return attendances.filter((a) => todaySchedIds.includes(a.scheduleId) && a.date === todayStr && (a.status === 'SELESAI' || !!a.journal)).length;
  }, [schedules, actualTodayDay, currentUser?.id, attendances, todayStr]);

  const todayTotalCount = scheduleCountByDay[actualTodayDay]?.sessions || 0;

  return (
    <div className="space-y-4">
      {/* 1. Concise 1-Line Minimalist Top Header (No Giant Profile Card) */}
      <div className="bg-white dark:bg-[#1A221E] rounded-xl border border-stone-200 dark:border-stone-800 p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-none">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
            {currentUser?.name || 'Asatidz'}
          </span>
          <span className="text-stone-300 dark:text-stone-700 font-mono">•</span>
          <span className="font-mono text-stone-500 dark:text-stone-400">
            NIP: {currentUser?.nip || 'BQ-008'}
          </span>
          <span className="text-stone-300 dark:text-stone-700 font-mono">•</span>
          <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium">
            Unit {currentUser?.unit || 'SMP'}
          </span>
          <span className="text-stone-300 dark:text-stone-700 font-mono">•</span>
          <span className="text-stone-500 dark:text-stone-400">
            {formatIndonesianDate(todayStr)}
          </span>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center bg-[#FBFBFA] dark:bg-[#141A17] p-1 rounded-lg border border-stone-200 dark:border-stone-800 self-start sm:self-auto shrink-0">
          <button
            onClick={() => handleTabChange('clockin_journal')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'clockin_journal'
                ? 'bg-white dark:bg-[#1A221E] text-stone-900 dark:text-stone-100 shadow-none border border-stone-200 dark:border-stone-700'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Presensi & Jurnal</span>
          </button>

          <button
            onClick={() => handleTabChange('jadwal')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'jadwal'
                ? 'bg-white dark:bg-[#1A221E] text-stone-900 dark:text-stone-100 shadow-none border border-stone-200 dark:border-stone-700'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Jadwal Pekanan</span>
          </button>

          <button
            onClick={() => handleTabChange('slip_gaji')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'slip_gaji'
                ? 'bg-white dark:bg-[#1A221E] text-stone-900 dark:text-stone-100 shadow-none border border-stone-200 dark:border-stone-700'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Slip Gaji</span>
          </button>
        </div>
      </div>

      {/* 2. SUBTAB: PRESENSI & JURNAL KBM */}
      {activeSubTab === 'clockin_journal' && (
        <div className="space-y-4">
          
          {/* Pending Journals Alert Bar (if any) */}
          {todayPendingJournals.length > 0 && (
            <div className="bg-[#FFFDF5] dark:bg-[#201D14] border border-[#E9DFB8] dark:border-[#524823] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#FAF0CA] dark:bg-[#383015] text-[#8C6D1F] dark:text-[#E8C547] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {todayPendingJournals.length} Jurnal Mengajar Belum Terisi
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                    Presensi masuk tercatat. Lengkapi materi santri sebelum hari berakhir untuk memastikan honorarium penuh.
                  </p>
                </div>
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
                className="bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Isi Jurnal Sekarang</span>
              </button>
            </div>
          )}

          {/* Segmented Day Switcher / Modern Horizontal Calendar Strip (Senin - Sabtu) */}
          <div className="bg-white dark:bg-[#1A221E] rounded-xl border border-stone-200 dark:border-stone-800 p-3 sm:p-3.5">
            <div className="flex items-center justify-between mb-2.5 px-1">
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
                    className={`relative p-2.5 rounded-xl text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : isToday
                        ? 'bg-[#F4F6F4] dark:bg-[#16201B] text-stone-800 dark:text-stone-200 border-[#1B4332]/40 dark:border-emerald-800/60 hover:bg-[#EEF2EE]'
                        : 'bg-[#FBFBFA] dark:bg-[#141A17] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    {isToday && (
                      <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-[#1B4332] dark:bg-emerald-400'}`} />
                    )}
                    
                    <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-stone-900 dark:text-stone-100'}`}>
                      {day}
                    </span>
                    
                    <span className={`text-[10px] font-medium block mt-0.5 ${isSelected ? 'text-emerald-100/80' : 'text-stone-400 dark:text-stone-500'}`}>
                      {info.sessions > 0 ? `${info.sessions} Sesi • ${info.hours} JP` : 'Libur'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Class Schedule Cards List (Flat & Clean) */}
          <div className="space-y-3">
            {daySchedules.length === 0 ? (
              /* Minimalist Empty State */
              <div className="bg-white dark:bg-[#1A221E] rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-8 sm:p-12 text-center space-y-3">
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
                <div className="pt-1 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedDay(actualTodayDay)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  >
                    Buka Jadwal Hari Ini
                  </button>
                  <button
                    onClick={() => handleTabChange('jadwal')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 text-[#1B4332] dark:text-emerald-400 hover:bg-stone-100 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                  >
                    Lihat Seluruh Pekan
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {daySchedules.map((schedule) => {
                  const att = getAttendanceForSchedule(schedule.id);
                  const badalInfo = getBadalInfoForSchedule(schedule.id);
                  const isBadalForMe = badalInfo && badalInfo.badalTeacherId === currentUser?.id;
                  const isSubstituted = badalInfo && badalInfo.originalTeacherId === currentUser?.id;

                  const hasClockedIn = !!att && !!att.clockInTime;
                  const isCompleted = att?.status === 'SELESAI' || !!att?.journal;
                  const isPendingJournal = hasClockedIn && !isCompleted && (att?.status === 'HADIR_JURNAL_KOSONG' || !att?.journal);
                  const lateInfo = att ? getLateCategoryLabel(att.lateCategory) : null;

                  return (
                    <div
                      key={schedule.id}
                      className={`bg-white dark:bg-[#1A221E] rounded-xl border transition-all p-4 sm:p-5 ${
                        isCompleted
                          ? 'border-emerald-200 dark:border-emerald-900/40 bg-[#FAFDFB] dark:bg-[#151D18]'
                          : isPendingJournal
                          ? 'border-[#E9DFB8] dark:border-[#524823] bg-[#FFFDF8] dark:bg-[#1F1D15]'
                          : isSubstituted
                          ? 'border-stone-200 dark:border-stone-800 opacity-60 bg-stone-50/50 dark:bg-stone-900/30'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Class Spec & Details */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Time Pill */}
                            <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                              {schedule.startTime} - {schedule.endTime} WIB
                            </span>

                            {/* JP Badge */}
                            <span className="text-[11px] font-semibold text-[#1B4332] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                              {schedule.hours} JP
                            </span>

                            {/* Class & Unit */}
                            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                              Kelas {schedule.className} • {schedule.unit}
                            </span>

                            <span className="text-stone-300 dark:text-stone-700 font-mono">•</span>

                            {/* Room */}
                            <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                              <span>{schedule.room}</span>
                            </span>

                            {isBadalForMe && (
                              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                                Tugas Badal
                              </span>
                            )}

                            {isSubstituted && (
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                Digantikan Badal
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 tracking-tight">
                            {schedule.subject}
                          </h3>

                          {/* Attendance Status Row */}
                          {hasClockedIn && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                              <span className="text-stone-500 dark:text-stone-400">
                                Presensi: <strong className="font-mono text-stone-800 dark:text-stone-200">{att.clockInTime}</strong>
                              </span>

                              {att.lateMinutes > 4 ? (
                                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                  +{att.lateMinutes}m ({lateInfo?.label.split(' ')[0]})
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  Tepat Waktu
                                </span>
                              )}

                              {isCompleted && (
                                <span className="text-[11px] font-semibold text-[#1B4332] dark:text-emerald-400 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" strokeWidth={2} /> Jurnal Selesai
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right: Actions (Presensi Masuk & Isi Jurnal) */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-0 self-start sm:self-center shrink-0">
                          {isSubstituted ? (
                            <span className="text-xs text-stone-400 italic">Sesi telah dialihkan ke badal</span>
                          ) : !hasClockedIn ? (
                            <button
                              onClick={() => setActiveClockInSchedule(schedule)}
                              className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                              <span>Presensi Masuk</span>
                            </button>
                          ) : !isCompleted ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setActiveJournalData({
                                    attendance: att!,
                                    schedule: schedule,
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                                <span>Isi Jurnal</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveJournalData({
                                  attendance: att!,
                                  schedule: schedule,
                                });
                              }}
                              className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300 hover:text-stone-900 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" strokeWidth={1.5} />
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

      {/* 3. SUBTAB: JADWAL PEKANAN (Full Weekly Timetable) */}
      {activeSubTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A221E] rounded-xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  Jadwal Mengajar Lengkap Pekanan
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Total {totalWeeklyHours} Jam Pelajaran (JP) terdaftar atas nama {currentUser?.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {daysOfWeek.map((day) => {
                const dayScheds = schedules.filter((s) => s.teacherId === currentUser?.id && s.dayOfWeek === day);
                if (dayScheds.length === 0) return null;

                return (
                  <div key={day} className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden text-xs">
                    <div className="bg-[#FBFBFA] dark:bg-[#141A17] px-3.5 py-2 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
                      <span>Hari {day}</span>
                      <span className="text-stone-500 text-[11px] font-normal">
                        {dayScheds.length} Sesi • {dayScheds.reduce((sum, s) => sum + s.hours, 0)} JP
                      </span>
                    </div>

                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                      {dayScheds.map((s) => (
                        <div key={s.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-[#1A221E]">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                              {s.startTime} - {s.endTime}
                            </span>
                            <div>
                              <p className="font-bold text-stone-900 dark:text-stone-100">{s.subject}</p>
                              <p className="text-[11px] text-stone-500">Kelas {s.className} • Unit {s.unit} • {s.room}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-[#1B4332] dark:text-emerald-400 self-start sm:self-center">
                            {s.hours} JP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBTAB: SLIP GAJI */}
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

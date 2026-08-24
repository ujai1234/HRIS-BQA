import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, AttendanceRecord } from '../types';
import { ClockInModal } from './ClockInModal';
import { JournalModal } from './JournalModal';
import { SalarySlipModal } from './SalarySlipModal';
import { SlipGajiView } from './SlipGajiView';
import { getLateCategoryLabel, formatIndonesianDate } from '../utils/formatters';

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
    if (tab === 'clockin_journal') setCurrentPath('/dashboard/guru/clockin');
    else if (tab === 'jadwal') setCurrentPath('/dashboard/guru/jadwal');
    else if (tab === 'slip_gaji') setCurrentPath('/dashboard/guru/slip');
  };

  // Selected day for KBM view
  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
  const getTodayDayName = () => {
    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayIndex = new Date().getDay();
    const day = days[todayIndex];
    return day === 'Ahad' ? 'Senin' : day;
  };
  const [selectedDay, setSelectedDay] = useState<string>(getTodayDayName());

  // Modals state
  const [activeClockInSchedule, setActiveClockInSchedule] = useState<ClassSchedule | null>(null);
  const [activeJournalData, setActiveJournalData] = useState<{
    attendance: AttendanceRecord;
    schedule: ClassSchedule;
  } | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const teacherPayroll = calculateTeacherPayroll(currentUser.id, selectedPeriod);

  // Schedules for the selected day
  const daySchedules = schedules.filter((s) => {
    if (s.dayOfWeek !== selectedDay) return false;
    const isRegular = s.teacherId === currentUser.id;
    const isBadal = badalAssignments.some(
      (b) => b.scheduleId === s.id && b.badalTeacherId === currentUser.id && b.status !== 'PENDING'
    );
    return isRegular || isBadal;
  });

  // All schedules assigned to this teacher across the entire week
  const allMySchedules = schedules.filter((s) => s.teacherId === currentUser.id);
  const totalWeeklyHours = allMySchedules.reduce((sum, s) => sum + s.hours, 0);

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

  // Completed journals by this teacher
  const completedJournalsCount = attendances.filter((a) => {
    const isMyRecord = a.teacherId === currentUser.id || a.actualTeacherId === currentUser.id;
    return isMyRecord && a.status === 'SELESAI';
  }).length;

  // Missed journal entries detection (both today and past)
  const missedJournalRecords = attendances.filter((a) => {
    const isMyRecord = a.teacherId === currentUser.id || a.actualTeacherId === currentUser.id;
    if (!isMyRecord) return false;
    const isPresentWithoutJournal =
      a.status === 'HADIR_JURNAL_KOSONG' ||
      (!!a.clockInTime && !a.journal && a.status !== 'SELESAI' && a.status !== 'IZIN' && a.status !== 'SAKIT' && a.status !== 'ALPA');
    return isPresentWithoutJournal;
  });

  const missedShiftsWithDetails = missedJournalRecords.map((att) => {
    let sched = schedules.find((s) => s.id === att.scheduleId);
    if (!sched) {
      sched = {
        id: att.scheduleId,
        teacherId: att.teacherId || currentUser.id,
        subject: 'KBM Mengajar',
        className: 'Kelas Terdaftar',
        unit: currentUser.unit,
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

  // Specifically journals pending for TODAY
  const todayPendingJournals = missedShiftsWithDetails.filter((m) => m.isTodayShift);
  const pendingJournalsCount = missedShiftsWithDetails.length;

  // Handle automatic transition from ClockIn to Journal Modal
  const handleClockInSuccess = (schedule: ClassSchedule) => {
    const updatedAtt = attendances.find((a) => a.scheduleId === schedule.id && a.date === todayStr) || {
      id: `ATT-${Date.now()}`,
      scheduleId: schedule.id,
      teacherId: currentUser.id,
      actualTeacherId: currentUser.id,
      date: todayStr,
      clockInTime: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      lateMinutes: 0,
      lateCategory: 'ON_TIME' as const,
      status: 'HADIR_JURNAL_KOSONG' as const,
      isBadal: false,
    };

    // Open Journal Modal immediately for smooth flow
    setTimeout(() => {
      setActiveJournalData({
        attendance: updatedAtt,
        schedule: schedule,
      });
    }, 350);
  };

  const tabs: { id: GuruTabType; label: string }[] = [
    { id: 'clockin_journal', label: 'Presensi & Jurnal KBM' },
    { id: 'jadwal', label: 'Jadwal Mengajar' },
    { id: 'slip_gaji', label: 'Slip Gaji Pribadi' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Subtab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-200/60 p-1 rounded-xl w-fit max-w-full text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeSubTab === tab.id
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Minimalist Teacher Overview Card (Strictly Non-Financial Educational Stats) */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {currentUser?.name || 'Ustadz / Guru'}
              </h1>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200/80">
                {currentUser?.unit || 'Unit KBM'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              NIP: {currentUser?.nip || '-'} • {currentUser?.position || 'Guru Pengampu'} • Semester Ganjil 2026/2027
            </p>
          </div>

          {/* Quick Metrics Strip (Non-Financial: Jam Pelajaran, Hari Hadir, Jurnal Selesai, Jurnal Pending) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 min-w-[105px]">
              <span className="text-[11px] text-slate-500 block">Total Beban KBM</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">{totalWeeklyHours} JP /pekan</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 min-w-[105px]">
              <span className="text-[11px] text-slate-500 block">Hari Hadir</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">{teacherPayroll.totalPresentDays} Hari</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 min-w-[105px]">
              <span className="text-[11px] text-slate-500 block">Jurnal Selesai</span>
              <span className="text-sm font-bold text-emerald-800 mt-0.5 block">{completedJournalsCount} Sesi</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 min-w-[105px]">
              <span className="text-[11px] text-slate-500 block">Jurnal Pending</span>
              <span className={`text-sm font-bold mt-0.5 block ${pendingJournalsCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {pendingJournalsCount} Sesi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Subtab Content: Presensi & Jurnal KBM */}
      {activeSubTab === 'clockin_journal' && (
        <div className="space-y-4">
          
          {/* Simple Workflow Explainer Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded">
                Alur KBM
              </span>
              <p className="text-xs text-slate-700">
                1. Klik <strong>Presensi Masuk</strong> (waktu terkunci otomatis) ➔ 2. Form <strong>Isi Jurnal</strong> akan terbuka langsung ➔ 3. Selesai.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono self-start sm:self-auto">
              Hari ini: {formatIndonesianDate(todayStr)}
            </span>
          </div>

          {/* Dedicated Section: Jurnal Hari Ini yang Perlu Diisi (if any) */}
          {todayPendingJournals.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <h3 className="font-bold text-xs text-amber-950">
                    Jurnal Mengajar Hari Ini yang Perlu Diisi ({todayPendingJournals.length} Sesi)
                  </h3>
                </div>
                <span className="text-[10px] font-semibold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded">
                  Menunggu Pengisian
                </span>
              </div>

              <div className="space-y-2">
                {todayPendingJournals.map((item) => (
                  <div 
                    key={item.attendance.id} 
                    className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{item.schedule.subject}</span>
                        <span className="text-[11px] text-slate-500">Kelas {item.schedule.className} • {item.schedule.unit}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Jam: <strong className="font-mono text-slate-700">{item.schedule.startTime} - {item.schedule.endTime}</strong> (Presensi masuk: {item.attendance.clockInTime || '-'})
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveJournalData({
                        attendance: item.attendance,
                        schedule: item.schedule
                      })}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Isi Jurnal Sekarang</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session List Table & Day Filter Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-sm text-slate-900">
                  Daftar Sesi Mengajar Harian
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih hari untuk melihat jadwal, melakukan presensi masuk, atau melengkapi jurnal KBM
                </p>
              </div>

              {/* Day Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      selectedDay === day
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Sesi List */}
            <div className="divide-y divide-slate-100">
              {daySchedules.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Tidak ada jadwal mengajar pada hari {selectedDay}.
                </div>
              ) : (
                daySchedules.map((schedule) => {
                  const att = getAttendanceForSchedule(schedule.id);
                  const badalInfo = getBadalInfoForSchedule(schedule.id);
                  const isBadalForMe = badalInfo && badalInfo.badalTeacherId === currentUser.id;
                  const isSubstituted = badalInfo && badalInfo.originalTeacherId === currentUser.id;

                  const hasClockedIn = !!att && !!att.clockInTime;
                  const isCompleted = att?.status === 'SELESAI';
                  const isPendingJournal = att?.status === 'HADIR_JURNAL_KOSONG';
                  const lateInfo = att ? getLateCategoryLabel(att.lateCategory) : null;

                  return (
                    <div key={schedule.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Info */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {schedule.startTime} - {schedule.endTime}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                              ({schedule.hours} JP)
                            </span>
                            <span className="text-[11px] text-slate-400">•</span>
                            <span className="text-[11px] font-medium text-slate-600">
                              Kelas {schedule.className} • {schedule.unit}
                            </span>
                            <span className="text-[11px] text-slate-400">•</span>
                            <span className="text-[11px] text-slate-500">
                              {schedule.room}
                            </span>

                            {isBadalForMe && (
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                Tugas Badal
                              </span>
                            )}
                            {isSubstituted && (
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Digantikan Badal
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-sm text-slate-900">
                            {schedule.subject}
                          </h3>

                          {/* Attendance Status Bar */}
                          {hasClockedIn && (
                            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                              <span className="text-slate-500">
                                Waktu Masuk: <strong className="font-mono text-slate-800">{att.clockInTime}</strong>
                              </span>

                              {att.lateMinutes > 4 ? (
                                <span className="text-rose-700 font-medium bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  +{att.lateMinutes}m ({lateInfo?.label.split(' ')[0]})
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Tepat Waktu
                                </span>
                              )}

                              {isCompleted && (
                                <span className="text-emerald-800 font-medium inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Jurnal Lengkap
                                </span>
                              )}

                              {isPendingJournal && (
                                <span className="text-amber-800 font-medium inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Jurnal Belum Diisi
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          {/* 1. Belum Presensi */}
                          {!hasClockedIn && !isSubstituted && (
                            <button
                              onClick={() => setActiveClockInSchedule(schedule)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Presensi Masuk</span>
                            </button>
                          )}

                          {/* 2. Sudah Presensi, Belum Isi Jurnal */}
                          {isPendingJournal && att && (
                            <button
                              onClick={() => setActiveJournalData({ attendance: att, schedule })}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Isi Jurnal</span>
                            </button>
                          )}

                          {/* 3. Jurnal Selesai */}
                          {isCompleted && att && (
                            <button
                              onClick={() => setActiveJournalData({ attendance: att, schedule })}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                            >
                              Lihat Jurnal
                            </button>
                          )}

                          {isSubstituted && (
                            <span className="text-xs text-slate-400 italic">
                              Telah dialihkan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Journal Topic Preview if filled */}
                      {att?.journal && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Materi Pembelajaran:</span>
                            <p className="font-medium text-slate-800 mt-0.5">{att.journal.topic}</p>
                          </div>
                          {att.journal.studentAttendance && (
                            <span className="text-[11px] text-slate-500 whitespace-nowrap">
                              Santri Hadir: <strong className="text-slate-800">{att.journal.studentAttendance.presentCount}/{att.journal.studentAttendance.totalStudents}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Subtab Content: Jadwal Mengajar Mingguan */}
      {activeSubTab === 'jadwal' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Jadwal Mengajar Mingguan
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total beban mengajar: <strong className="text-slate-700">{totalWeeklyHours} Jam Pelajaran (JP)</strong> per pekan
              </p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
              Unit {currentUser?.unit || '-'}
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {daysOfWeek.map((day) => {
              const scheds = allMySchedules.filter((s) => s.dayOfWeek === day);
              const dayHours = scheds.reduce((acc, s) => acc + s.hours, 0);

              return (
                <div key={day} className="bg-slate-50/70 rounded-lg border border-slate-200/80 p-3 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs font-semibold text-slate-800">
                    <span>{day}</span>
                    <span className="text-[11px] text-slate-500 font-normal">{dayHours} JP</span>
                  </div>

                  {scheds.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1">Tidak ada jadwal</p>
                  ) : (
                    <div className="space-y-1.5">
                      {scheds.map((s) => (
                        <div key={s.id} className="bg-white p-2 rounded-md border border-slate-200/70 text-xs space-y-0.5 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>{s.startTime} - {s.endTime}</span>
                            <span className="font-semibold text-emerald-800">{s.hours} JP</span>
                          </div>
                          <p className="font-semibold text-slate-900">{s.subject}</p>
                          <p className="text-[11px] text-slate-500">Kelas {s.className} • {s.room}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Subtab Content: Slip Gaji Pribadi */}
      {activeSubTab === 'slip_gaji' && (
        <div className="space-y-4">
          <SlipGajiView />
        </div>
      )}

      {/* Clock In Modal (Auto locks real-time) */}
      {activeClockInSchedule && (
        <ClockInModal
          schedule={activeClockInSchedule}
          teacher={currentUser}
          onClose={() => setActiveClockInSchedule(null)}
          onSuccess={(sched) => {
            setActiveClockInSchedule(null);
            handleClockInSuccess(sched);
          }}
        />
      )}

      {/* Journal Modal */}
      {activeJournalData && (
        <JournalModal
          attendance={activeJournalData.attendance}
          schedule={activeJournalData.schedule}
          teacher={currentUser}
          onClose={() => setActiveJournalData(null)}
          onSuccess={() => setActiveJournalData(null)}
        />
      )}

      {/* Salary Slip Modal */}
      {showSlipModal && (
        <SalarySlipModal
          payroll={teacherPayroll}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};

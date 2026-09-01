import React, { useState } from 'react';
import { 
  Clock, 
  BookOpen, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  CalendarOff,
  Check
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, AttendanceRecord } from '../types';
import { ClockInModal } from './ClockInModal';
import { JournalModal } from './JournalModal';
import { TeacherLeaveModal } from './TeacherLeaveModal';
import { GpsPermissionPromptModal } from './GpsPermissionPromptModal';
import { preCheckDeviceGps, GpsPreCheckState } from '../services/geofenceService';

export const TeacherDashboard: React.FC = () => {
  const { 
    currentUser, 
    schedules, 
    attendances, 
    badalAssignments, 
    selectedPeriod, 
    calculateTeacherPayroll 
  } = useHRIS();

  // Selected day for simulator (defaults to today's Indonesian day name)
  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

  const getTodayIndonesianDay = (): string => {
    const dayIndex = new Date().getDay();
    const map: Record<number, string> = {
      1: 'Senin',
      2: 'Selasa',
      3: 'Rabu',
      4: 'Kamis',
      5: 'Jumat',
      6: 'Sabtu',
      0: 'Senin', // Default to Senin if Sunday
    };
    return map[dayIndex] || 'Senin';
  };

  const realTodayName = getTodayIndonesianDay();
  const [selectedDay, setSelectedDay] = useState<string>(realTodayName);

  // Modals state
  const [activeClockInSchedule, setActiveClockInSchedule] = useState<ClassSchedule | null>(null);
  const [gpsPromptSchedule, setGpsPromptSchedule] = useState<ClassSchedule | null>(null);
  const [gpsPromptState, setGpsPromptState] = useState<GpsPreCheckState>('PERMISSION_BLOCKED');
  const [isPreCheckingGps, setIsPreCheckingGps] = useState(false);
  const [activeJournalData, setActiveJournalData] = useState<{
    attendance: AttendanceRecord;
    schedule: ClassSchedule;
  } | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTargetSchedule, setLeaveTargetSchedule] = useState<ClassSchedule | null>(null);

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

  // Handle Clock-In Success: immediately transition to Journal Modal!
  const handleClockInSuccess = (schedule: ClassSchedule) => {
    setActiveClockInSchedule(null);
    // Find newly updated attendance or fallback object
    const att = attendances.find((a) => a.scheduleId === schedule.id && a.date === todayStr) || {
      id: `att-${schedule.id}-${todayStr}`,
      scheduleId: schedule.id,
      actualTeacherId: currentUser.id,
      date: todayStr,
      clockInTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      lateCategory: 'ON_TIME',
      latePenalty: 0,
      transportCut: 0,
      honorariumCut: 0,
      status: 'HADIR_JURNAL_KOSONG',
      createdAt: new Date().toISOString()
    };
    setActiveJournalData({ attendance: att as AttendanceRecord, schedule });
  };

  // Pre-check GPS verification step when clicking "Absen"
  const handleInitiateClockIn = async (schedule: ClassSchedule) => {
    setIsPreCheckingGps(true);
    try {
      const checkResult = await preCheckDeviceGps();
      setIsPreCheckingGps(false);

      if (checkResult.state === 'PERMISSION_BLOCKED' || checkResult.state === 'LOCATION_DISABLED') {
        setGpsPromptSchedule(schedule);
        setGpsPromptState(checkResult.state);
      } else {
        // Ready or prompt supported
        setActiveClockInSchedule(schedule);
      }
    } catch {
      setIsPreCheckingGps(false);
      setActiveClockInSchedule(schedule);
    }
  };

  return (
    <div className="space-y-5">
      {/* Clean Teacher Header (Minimalist & Modern, No Money Figures) */}
      <div className="bg-white dark:bg-[#121f1a] rounded-2xl p-5 border border-slate-200/90 dark:border-emerald-900/30 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-emerald-50">
                Absen & Jurnal
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                Unit {currentUser?.unit || 'Pesantren'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70 mt-1">
              {currentUser?.name || 'Asatidz'} • {currentUser?.position || 'Pengajar'}
            </p>
          </div>

          {/* Action: Guru Izin / Sakit Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLeaveTargetSchedule(null);
                setShowLeaveModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 transition-colors border border-amber-200/80 dark:border-amber-800/40 cursor-pointer shadow-xs"
            >
              <CalendarOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Ajukan Izin / Sakit</span>
            </button>
          </div>
        </div>

        {/* Minimalist Summary Badges (Non-monetary) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-emerald-900/30">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1a15] border border-slate-100 dark:border-emerald-900/30">
            <span className="text-[11px] text-slate-500 dark:text-emerald-400/70 font-medium">Jam Mengajar Bulan Ini</span>
            <div className="text-sm font-bold text-slate-900 dark:text-emerald-50 mt-0.5">
              {teacherPayroll.totalTaughtHours} JP
              {teacherPayroll.totalBadalHours > 0 && (
                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 ml-1">
                  (+{teacherPayroll.totalBadalHours} Badal)
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1a15] border border-slate-100 dark:border-emerald-900/30">
            <span className="text-[11px] text-slate-500 dark:text-emerald-400/70 font-medium">Total Hari Hadir</span>
            <div className="text-sm font-bold text-slate-900 dark:text-emerald-50 mt-0.5">
              {teacherPayroll.totalPresentDays} Hari
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-50 dark:bg-[#0f1a15] border border-slate-100 dark:border-emerald-900/30">
            <span className="text-[11px] text-slate-500 dark:text-emerald-400/70 font-medium">Status Periode</span>
            <div className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mt-0.5">
              {selectedPeriod} (Aktif)
            </div>
          </div>
        </div>
      </div>

      {/* Sesi KBM Hari Ini & Jadwal */}
      <div className="bg-white dark:bg-[#121f1a] rounded-2xl p-5 border border-slate-200/90 dark:border-emerald-900/30 shadow-xs space-y-4 transition-colors">
        {/* Day Selector Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-emerald-900/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                Jadwal & Presensi KBM
              </h2>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1a2d24] text-slate-600 dark:text-emerald-300">
                {selectedDay === realTodayName ? 'Hari Ini' : `Hari ${selectedDay}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-emerald-400/60 mt-0.5">
              Jadwal menyesuaikan hari aktif secara otomatis.
            </p>
          </div>

          <div className="inline-flex bg-slate-100 dark:bg-[#0f1a15] p-1 rounded-xl border border-slate-200/80 dark:border-emerald-900/40 overflow-x-auto max-w-full gap-0.5">
            {daysOfWeek.map((day) => {
              const isToday = day === realTodayName;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedDay === day
                      ? 'bg-white dark:bg-[#1c3027] text-emerald-800 dark:text-emerald-300 shadow-xs border border-slate-200/80 dark:border-emerald-700/50'
                      : 'text-slate-600 dark:text-emerald-400/60 hover:text-slate-900 dark:hover:text-emerald-200'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Hari Ini" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule Cards */}
        {daySchedules.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50/60 dark:bg-[#0e1713] rounded-xl border border-dashed border-slate-200 dark:border-emerald-900/40">
            <p className="text-xs text-slate-500 dark:text-emerald-400/60">
              Tidak ada jadwal mengajar pada hari <strong>{selectedDay}</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daySchedules.map((schedule) => {
              const att = getAttendanceForSchedule(schedule.id);
              const badalInfo = getBadalInfoForSchedule(schedule.id);
              const isBadalForMe = badalInfo && badalInfo.badalTeacherId === currentUser.id;
              const isSubstituted = badalInfo && badalInfo.originalTeacherId === currentUser.id;

              const isCompleted = att?.status === 'SELESAI';
              const isClockedInNoJournal = att?.status === 'HADIR_JURNAL_KOSONG';
              const isIzin = att?.status === 'IZIN';
              const isSakit = att?.status === 'SAKIT';
              const isNotPresent = !att || att.status === 'BELUM_HADIR';

              return (
                <div
                  key={schedule.id}
                  className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                      : isClockedInNoJournal
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                      : isSakit
                      ? 'bg-amber-50/50 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800/50'
                      : isIzin
                      ? 'bg-sky-50/50 dark:bg-sky-950/25 border-sky-300 dark:border-sky-800/50'
                      : isSubstituted
                      ? 'bg-slate-50 dark:bg-[#0e1713] border-slate-200 dark:border-emerald-950/50 opacity-75'
                      : 'bg-white dark:bg-[#14231d] border-slate-200/90 dark:border-emerald-900/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header line of card */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1a2d24] text-slate-700 dark:text-emerald-200 border border-slate-200/60 dark:border-emerald-800/40">
                          {schedule.className}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1a2d24] text-slate-600 dark:text-emerald-300/80 border border-slate-200/60 dark:border-emerald-800/40">
                          {schedule.hours} JP
                        </span>
                        {isBadalForMe && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                            Tugas Badal
                          </span>
                        )}
                      </div>

                      {/* Status Tag */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Jurnal Terisi
                        </span>
                      ) : isClockedInNoJournal ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Jurnal Belum Diisi
                        </span>
                      ) : isSakit ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Sakit (Tercatat)
                        </span>
                      ) : isIzin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                          <CalendarOff className="w-3.5 h-3.5" /> Izin Tercatat
                        </span>
                      ) : isSubstituted ? (
                        <span className="text-[11px] text-slate-500 dark:text-emerald-400/60">
                          Dialihkan ke Badal
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-emerald-400/60">
                          Belum Absen
                        </span>
                      )}
                    </div>

                    {/* Subject title */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
                        {schedule.subject}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-emerald-400/70 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {schedule.startTime} - {schedule.endTime} WIB
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {schedule.room}
                        </span>
                      </div>
                    </div>

                    {/* Clock-in / Leave info if exists */}
                    {att && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0e1713] text-xs text-slate-600 dark:text-emerald-200/80 flex flex-col gap-1 border border-slate-100 dark:border-emerald-900/30">
                        {att.clockInTime && (
                          <div className="flex items-center justify-between">
                            <span>Waktu Absen: <strong>{att.clockInTime} WIB</strong></span>
                            {att.journal?.topic && (
                              <span className="truncate max-w-[140px] text-slate-500 dark:text-emerald-400/60">
                                {att.journal.topic}
                              </span>
                            )}
                          </div>
                        )}
                        {att.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-emerald-300/80 italic">
                            Catatan: {att.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-emerald-900/30">
                    {isNotPresent && !isSubstituted && (
                      <button
                        onClick={() => handleInitiateClockIn(schedule)}
                        disabled={isPreCheckingGps}
                        className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-75"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isPreCheckingGps ? 'Memeriksa GPS...' : 'Absen'}</span>
                      </button>
                    )}

                    {isClockedInNoJournal && att && (
                      <button
                        onClick={() => setActiveJournalData({ attendance: att, schedule })}
                        className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Isi Jurnal Mengajar Sekarang</span>
                      </button>
                    )}

                    {isCompleted && att && (
                      <button
                        onClick={() => setActiveJournalData({ attendance: att, schedule })}
                        className="w-full py-1.5 px-3 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#182a23] hover:bg-slate-200 dark:hover:bg-[#1f362c] text-slate-700 dark:text-emerald-200 transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-emerald-800/40 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Lihat / Edit Jurnal</span>
                      </button>
                    )}

                    {(isIzin || isSakit) && (
                      <div className="text-center py-1">
                        <span className="text-[11px] text-amber-700 dark:text-amber-300/90 font-medium">
                          Status {isSakit ? 'Sakit' : 'Izin'} Tercatat • Koordinasi Guru Badal
                        </span>
                      </div>
                    )}

                    {isSubstituted && (
                      <p className="text-xs text-slate-400 dark:text-emerald-400/50 italic text-center py-1">
                        Sesi dialihkan ke Guru Badal ({badalInfo?.reason})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Teaching History & Journals Table */}
      <div className="bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200/90 dark:border-emerald-900/30 shadow-xs overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-emerald-900/30">
          <h2 className="text-sm font-bold text-slate-900 dark:text-emerald-50">
            Riwayat Presensi & Jurnal Terkini
          </h2>
          <p className="text-xs text-slate-500 dark:text-emerald-400/60 mt-0.5">
            Daftar sesi KBM yang telah tercatat di sistem.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-[#0e1713] border-b border-slate-200/80 dark:border-emerald-900/40 text-slate-500 dark:text-emerald-400/70 text-[11px] font-semibold">
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Mata Pelajaran & Kelas</th>
                <th className="py-2.5 px-4">Jam Masuk</th>
                <th className="py-2.5 px-4">Status Jurnal</th>
                <th className="py-2.5 px-4">Materi Pembelajaran</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/30">
              {attendances
                .filter((a) => a.actualTeacherId === currentUser.id)
                .map((att) => {
                  const sched = schedules.find((s) => s.id === att.scheduleId);
                  const isDone = att.status === 'SELESAI';

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/60 dark:hover:bg-[#162720] transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-emerald-100 whitespace-nowrap">
                        {att.date}
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-emerald-50">{sched?.subject || 'KBM Pesantren'}</p>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-400/60">{sched?.className} • {sched?.hours} JP</p>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-emerald-200">
                        {att.clockInTime || '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Jurnal Terisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" /> Jurnal Kosong
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 max-w-xs truncate text-slate-600 dark:text-emerald-300/80">
                        {att.journal?.topic || <span className="italic text-slate-400 dark:text-emerald-500/50">Belum diisi</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {sched && (
                          <button
                            onClick={() => setActiveJournalData({ attendance: att, schedule: sched })}
                            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            {isDone ? 'Lihat' : 'Isi Jurnal'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Permission Prompt Modal (Polite & Non-intrusive) */}
      <GpsPermissionPromptModal
        isOpen={!!gpsPromptSchedule}
        schedule={gpsPromptSchedule}
        initialState={gpsPromptState}
        onClose={() => setGpsPromptSchedule(null)}
        onGpsGranted={(sched) => {
          setGpsPromptSchedule(null);
          setActiveClockInSchedule(sched);
        }}
      />

      {/* Clock In Modal */}
      {activeClockInSchedule && (
        <ClockInModal
          schedule={activeClockInSchedule}
          teacher={currentUser}
          onClose={() => setActiveClockInSchedule(null)}
          onSuccess={handleClockInSuccess}
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

      {/* Teacher Leave / Izin Modal */}
      <TeacherLeaveModal
        isOpen={showLeaveModal}
        onClose={() => {
          setShowLeaveModal(false);
          setLeaveTargetSchedule(null);
        }}
        initialSchedule={leaveTargetSchedule}
        selectedDateInitial={todayStr}
      />
    </div>
  );
};


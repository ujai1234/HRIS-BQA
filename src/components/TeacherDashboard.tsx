import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  BookOpen, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  CalendarOff,
  Check,
  Lock,
  Camera,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, AttendanceRecord, ExamSession, ExamProctor } from '../types';
import { ClockInModal } from './ClockInModal';
import { JournalModal } from './JournalModal';
import { TeacherLeaveModal } from './TeacherLeaveModal';
import { GpsPermissionPromptModal } from './GpsPermissionPromptModal';
import { TeacherAvatar } from './TeacherAvatar';
import { UserProfileModal } from './UserProfileModal';
import { ExamReportModal } from './ExamReportModal';
import { preCheckDeviceGps, GpsPreCheckState } from '../services/geofenceService';
import { validateScheduleTimeWindow, getTodayIndonesianDayName } from '../utils/formatters';

export const TeacherDashboard: React.FC = () => {
  const { 
    currentUser, 
    schedules, 
    attendances, 
    badalAssignments, 
    selectedPeriod, 
    calculateTeacherPayroll,
    academicSettings,
    examSessions,
    clockInExamProctor
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
  const [currentTick, setCurrentTick] = useState<number>(Date.now());

  // Ticker to refresh schedule status every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTick(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Modals state
  const [activeClockInSchedule, setActiveClockInSchedule] = useState<ClassSchedule | null>(null);
  const [cachedGpsCoords, setCachedGpsCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [gpsPromptSchedule, setGpsPromptSchedule] = useState<ClassSchedule | null>(null);
  const [gpsPromptState, setGpsPromptState] = useState<GpsPreCheckState>('PERMISSION_BLOCKED');
  const [isPreCheckingGps, setIsPreCheckingGps] = useState(false);
  const [activeJournalData, setActiveJournalData] = useState<{
    attendance: AttendanceRecord;
    schedule: ClassSchedule;
  } | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTargetSchedule, setLeaveTargetSchedule] = useState<ClassSchedule | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Exam Module States
  const [activeExamReportData, setActiveExamReportData] = useState<{
    session: ExamSession;
    proctor: ExamProctor;
    attendance: AttendanceRecord;
  } | null>(null);
  const [isClockingInExam, setIsClockingInExam] = useState(false);

  const teacherPayroll = calculateTeacherPayroll(currentUser.id, selectedPeriod);

  // Today's Exam Sessions assigned to currentUser (either original or badal replacement)
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const myExamSessionsToday = examSessions.filter(s => {
    if (s.date !== todayDateStr && s.dayOfWeek !== selectedDay) return false;
    return s.proctors?.some(p => 
      (p.teacherId === currentUser.id && p.status !== 'REPLACED') ||
      p.replacementTeacherId === currentUser.id
    );
  });

  const handleExamClockIn = async (session: ExamSession, proctor: ExamProctor) => {
    setIsClockingInExam(true);
    try {
      let coords: { latitude: number; longitude: number } | undefined = undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
          });
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (geoErr) {
          console.warn('Geolocation warning, proceeding:', geoErr);
        }
      }
      const record = await clockInExamProctor(session.id, proctor.id, coords);
      if (record) {
        toast.success('Presensi Pengawas Berhasil!', {
          description: `Tercatat jam ${record.clockInTime} WIB`
        });
      }
    } catch (err: any) {
      toast.error('Gagal Presensi Pengawas', { description: err.message });
    } finally {
      setIsClockingInExam(false);
    }
  };

  // Helper to check if schedule is active according to the unit's academic mode (UTS / UAS / REGULER)
  const isScheduleActiveInAcademicMode = (s: ClassSchedule) => {
    const unitMode = s.unit === 'SMP'
      ? (academicSettings?.smpMode || 'REGULER')
      : s.unit === 'MA'
      ? (academicSettings?.maMode || 'REGULER')
      : s.unit === 'PESANTREN'
      ? (academicSettings?.pesantrenMode || 'REGULER')
      : 'REGULER';
    const schedType = s.scheduleType || 'REGULER';
    return schedType === unitMode;
  };

  // Schedules for the selected day
  const daySchedules = schedules.filter((s) => {
    if (s.dayOfWeek !== selectedDay) return false;
    if (!isScheduleActiveInAcademicMode(s)) return false;
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

  // Pre-check GPS and Time Window verification step when clicking "Absen"
  const handleInitiateClockIn = async (schedule: ClassSchedule) => {
    // Allow clock in per schedule (validation per schedule time window)

    const timeValidation = validateScheduleTimeWindow(schedule);
    if (!timeValidation.canClockIn) {
      toast.warning(timeValidation.message);
      return;
    }

    setIsPreCheckingGps(true);
    try {
      const checkResult = await preCheckDeviceGps();
      setIsPreCheckingGps(false);

      if (checkResult.state === 'PERMISSION_BLOCKED' || checkResult.state === 'LOCATION_DISABLED') {
        setGpsPromptSchedule(schedule);
        setGpsPromptState(checkResult.state);
      } else {
        // Ready or prompt supported - cache coordinates so ClockInModal doesn't re-lock
        if (checkResult.coords) {
          setCachedGpsCoords({
            latitude: checkResult.coords.latitude,
            longitude: checkResult.coords.longitude,
            accuracy: checkResult.coords.accuracy,
          });
        }
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
      <div className="bqa-card p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Interactive Profile Avatar with Camera Badge */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="relative group shrink-0 cursor-pointer focus:outline-none"
              title="Klik untuk ubah foto profil via kamera"
            >
              <TeacherAvatar teacher={currentUser} size="xl" />
              <div className="absolute -bottom-1 -right-1 p-1 bg-[#163832] group-hover:bg-[#0B2B26] text-white rounded-full shadow-xs border-2 border-white transition-transform group-hover:scale-110">
                <Camera className="w-3 h-3" />
              </div>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-[#051F20]">
                  {currentUser?.name || 'Asatidz'}
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-[8px] bg-[#DAF1DE] text-[#163832] border border-[#8EB69B]/30 uppercase tracking-wider">
                  Unit {currentUser?.unit || 'Pesantren'}
                </span>
              </div>
              <p className="text-xs text-[#8EB69B] font-medium mt-0.5">
                {currentUser?.position || 'Pengajar'} • NIP: {currentUser?.nip || '-'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold bg-slate-50 hover:bg-slate-100 text-[#051F20] transition-colors border border-slate-200 cursor-pointer shadow-xs uppercase tracking-wider"
            >
              <Camera className="w-3.5 h-3.5 text-[#163832]" />
              <span>Foto Profil</span>
            </button>

            <button
              onClick={() => {
                setLeaveTargetSchedule(null);
                setShowLeaveModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors border border-amber-200 cursor-pointer shadow-xs uppercase tracking-wider"
            >
              <CalendarOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Ajukan Izin</span>
            </button>
          </div>
        </div>
        {/* Minimalist Summary Badges (Non-monetary) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-[#163832]">
          <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-[#0B2B26] border border-slate-100 dark:border-[#163832]">
            <span className="text-[11px] text-[#8EB69B] font-bold uppercase tracking-wider">Jam Mengajar Bulan Ini</span>
            <div className="text-lg font-bold text-[#051F20] dark:text-[#DAF1DE] mt-1">
              {teacherPayroll.totalTaughtHours} JP
              {teacherPayroll.totalBadalHours > 0 && (
                <span className="text-xs font-bold text-[#163832] dark:text-[#8EB69B] ml-1">
                  (+{teacherPayroll.totalBadalHours} Badal)
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-[#0B2B26] border border-slate-100 dark:border-[#163832]">
            <span className="text-[11px] text-[#8EB69B] font-bold uppercase tracking-wider">Total Hari Hadir</span>
            <div className="text-lg font-bold text-[#051F20] dark:text-[#DAF1DE] mt-1">
              {teacherPayroll.totalPresentDays} Hari
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-[16px] bg-[#051F20] dark:bg-[#163832] border border-[#163832] dark:border-[#0B2B26]">
            <span className="text-[11px] text-[#8EB69B] font-bold uppercase tracking-wider">Status Periode</span>
            <div className="text-lg font-bold text-[#DAF1DE] mt-1">
              {selectedPeriod} (Aktif)
            </div>
          </div>
        </div>
      </div>

      {/* Tugas Pengawasan Ujian Hari Ini (UTS / UAS) */}
      {myExamSessionsToday.length > 0 && (
        <div className="bqa-card p-5 sm:p-6 space-y-4 border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Tugas Pengawasan Ujian (UTS / UAS)
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                    {myExamSessionsToday.length} Sesi Terjadwal
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-emerald-400/80">
                  Presensi tepat waktu (toleransi ≤5 menit tanpa potongan) dan serahkan BAP setelah ujian selesai.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myExamSessionsToday.map((sess) => {
              const myProctor = sess.proctors?.find(p => 
                (p.teacherId === currentUser.id && p.status !== 'REPLACED') ||
                p.replacementTeacherId === currentUser.id
              );
              if (!myProctor) return null;

              const isBadal = myProctor.replacementTeacherId === currentUser.id;
              const att = myProctor.attendance || attendances.find(a => 
                a.examSessionId === sess.id && a.actualTeacherId === currentUser.id
              );
              const rep = myProctor.report || att?.examReport;
              const isCompleted = att?.status === 'SELESAI' || !!rep;
              const isClockedIn = att && att.clockInTime;

              return (
                <div
                  key={sess.id}
                  className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between space-y-3 shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : isClockedIn
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                      : 'bg-white dark:bg-[#0B2B26] border-slate-200 dark:border-[#163832]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {sess.sessionName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#163832] text-slate-600 dark:text-emerald-300 font-semibold">
                          {sess.durationMinutes} Menit
                        </span>
                        {isBadal && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Badal
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {sess.subject}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-emerald-400/80 mt-1">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Kelas: {sess.targetClass}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" /> {sess.roomName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-slate-800 dark:text-emerald-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{sess.startTime} - {sess.endTime}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">WIB</span>
                    </div>
                  </div>

                  {/* Attendance & BAP Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-[#163832]/80 flex items-center justify-between gap-2">
                    {isCompleted ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Pengawasan Selesai & BAP Terisi (Hadir: {rep?.presentCount ?? '-'} santri)</span>
                      </div>
                    ) : isClockedIn ? (
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="text-xs">
                          <div className="font-bold text-blue-700 dark:text-blue-300">
                            ✓ Hadir Jam {att.clockInTime}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-emerald-400/70">
                            {att.lateCategory === 'TEPAT_WAKTU' ? (
                              <span className="text-emerald-600 font-semibold">Tepat Waktu (≤5 mnt)</span>
                            ) : (
                              <span className="text-rose-600 font-semibold">Terlambat {att.lateMinutes} mnt</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveExamReportData({
                            session: sess,
                            proctor: myProctor,
                            attendance: att
                          })}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Isi Berita Acara (BAP)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="text-[11px] text-slate-500 dark:text-emerald-400/70">
                          Toleransi: ≤5 mnt tanpa potongan
                        </div>
                        <button
                          disabled={isClockingInExam}
                          onClick={() => handleExamClockIn(sess, myProctor)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-900/20 cursor-pointer flex items-center gap-1.5"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{isClockingInExam ? 'Memverifikasi...' : 'Presensi Pengawas Ujian'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sesi KBM Hari Ini & Jadwal */}
      <div className="bqa-card p-6 space-y-4 transition-colors">
        {/* Day Selector Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#163832]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-bold text-[#051F20] dark:text-[#DAF1DE]">
                Jadwal & Presensi KBM
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-[8px] bg-slate-100 dark:bg-[#163832] text-[#051F20] dark:text-[#DAF1DE] uppercase tracking-wider">
                {selectedDay === realTodayName ? 'Hari Ini' : `Hari ${selectedDay}`}
              </span>
            </div>
            <p className="text-xs text-[#8EB69B] font-medium mt-1">
              Jadwal menyesuaikan hari aktif secara otomatis.
            </p>
          </div>

          <div className="inline-flex bg-slate-50 dark:bg-[#0B2B26] p-1.5 rounded-[12px] border border-slate-200 dark:border-[#163832] overflow-x-auto max-w-full gap-1">
            {daysOfWeek.map((day) => {
              const isToday = day === realTodayName;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
                    selectedDay === day
                      ? 'bg-[#163832] dark:bg-[#8EB69B] text-[#DAF1DE] dark:text-[#051F20] shadow-xs'
                      : 'text-[#8EB69B] hover:text-[#051F20] dark:hover:text-[#DAF1DE]'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DAF1DE] dark:bg-[#051F20] shrink-0" title="Hari Ini" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Academic Exam Mode Active Banner (if user's unit is in UTS / UAS) */}
        {currentUser?.unit && (
          (currentUser.unit === 'PESANTREN' && academicSettings?.pesantrenMode !== 'REGULER') ||
          (currentUser.unit === 'SMP' && academicSettings?.smpMode !== 'REGULER') ||
          (currentUser.unit === 'MA' && academicSettings?.maMode !== 'REGULER') ||
          (currentUser.unit === 'UMUM' && (academicSettings?.pesantrenMode !== 'REGULER' || academicSettings?.smpMode !== 'REGULER' || academicSettings?.maMode !== 'REGULER'))
        ) && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div>
              <span className="font-bold">Mode Ujian Aktif: </span>
              <span>Unit Anda sedang menyelenggarakan ujian. Hanya jadwal pengawasan ujian yang ditampilkan dan wajib dipresensi. Jadwal KBM reguler tetap tersimpan aman.</span>
            </div>
          </div>
        )}

        {/* Schedule Cards */}
        {daySchedules.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 dark:bg-[#0f1a15]/60 dark:bg-[#0e1713] rounded-xl border border-dashed border-slate-200 dark:border-emerald-900/40">
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

              const timeValidation = validateScheduleTimeWindow(schedule);

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
                      ? 'bg-slate-50 dark:bg-[#0B2B26] border-slate-200 dark:border-[#163832] opacity-75'
                      : timeValidation.canClockIn
                      ? 'bg-white dark:bg-[#163832] border-emerald-300 dark:border-[#8EB69B] shadow-xs'
                      : 'bg-white dark:bg-[#0B2B26] border-slate-200/90 dark:border-[#163832]'
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
                        {schedule.scheduleType === 'UTS' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40">
                            Pengawas UTS
                          </span>
                        )}
                        {schedule.scheduleType === 'UAS' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/40">
                            Pengawas UAS
                          </span>
                        )}
                      </div>

                      {/* Status Tag */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai & Terkunci
                        </span>
                      ) : isClockedInNoJournal ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Jurnal Belum Diisi
                        </span>
                      ) : isSakit ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Sakit (Terkunci)
                        </span>
                      ) : isIzin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                          <CalendarOff className="w-3.5 h-3.5" /> Izin (Terkunci)
                        </span>
                      ) : isSubstituted ? (
                        <span className="text-[11px] text-slate-500 dark:text-emerald-400/60">
                          Dialihkan ke Badal
                        </span>
                      ) : timeValidation.canClockIn ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Waktu Absen Aktif
                        </span>
                      ) : timeValidation.status === 'TOO_EARLY' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          <Lock className="w-3.5 h-3.5" /> Buka {timeValidation.allowedStartTime}
                        </span>
                      ) : timeValidation.status === 'EXPIRED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Waktu Berakhir
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-emerald-400/60">
                          Jadwal {schedule.dayOfWeek}
                        </span>
                      )}
                    </div>

                    {/* Subject title */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-[#DAF1DE]">
                        {schedule.subject}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-[#8EB69B] mt-1">
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
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B2B26] text-xs text-slate-600 dark:text-[#DAF1DE] flex flex-col gap-1 border border-slate-100 dark:border-[#163832]">
                        {att.clockInTime && (
                          <div className="flex items-center justify-between">
                            <span>Waktu Absen: <strong>{att.clockInTime} WIB</strong></span>
                            {att.journal?.topic && (
                              <span className="truncate max-w-[140px] text-slate-500 dark:text-[#8EB69B]">
                                {att.journal.topic}
                              </span>
                            )}
                          </div>
                        )}
                        {att.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-[#8EB69B] italic">
                            Catatan: {att.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#163832]">
                    {schedule.subject.toLowerCase().includes('tahfidz') ? (
                      <div>
                        <button
                          disabled
                          className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-[#163832] text-emerald-600 dark:text-[#8EB69B] border border-emerald-200 dark:border-[#0B2B26] flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Terintegrasi Aplikasi Tahfidz</span>
                        </button>
                        <p className="text-[10px] text-center text-slate-400 dark:text-[#8EB69B] mt-1">
                          Data absensi langsung ditampilkan dari sistem Tahfidz
                        </p>
                      </div>
                    ) : (
                      <>
                        {isNotPresent && !isSubstituted && (
                          <div>
                            {timeValidation.canClockIn ? (
                              <button
                                onClick={() => handleInitiateClockIn(schedule)}
                                disabled={isPreCheckingGps}
                                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-75"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>{isPreCheckingGps ? 'Memeriksa GPS...' : 'Absen Sekarang'}</span>
                              </button>
                            ) : timeValidation.status === 'TOO_EARLY' ? (
                              <div>
                                <button
                                  disabled
                                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#163832] text-slate-500 dark:text-[#8EB69B] border border-slate-200 dark:border-[#0B2B26] flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Belum Waktunya (Buka {timeValidation.allowedStartTime})</span>
                                </button>
                                <p className="text-[10px] text-center text-slate-400 dark:text-[#8EB69B] mt-1">
                                  Dibuka 15 mnt sebelum sesi ({timeValidation.allowedStartTime} - {schedule.endTime} WIB)
                                </p>
                              </div>
                            ) : timeValidation.status === 'EXPIRED' ? (
                              <div>
                                <button
                                  disabled
                                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-85"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Waktu Absen Telah Berakhir</span>
                                </button>
                                <p className="text-[10px] text-center text-rose-500/80 dark:text-rose-400/80 mt-1">
                                  Sesi KBM telah selesai (Pukul {schedule.endTime} WIB)
                                </p>
                              </div>
                            ) : (
                              <button
                                disabled
                                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#163832] text-slate-400 dark:text-[#8EB69B] border border-slate-200 dark:border-[#0B2B26] flex items-center justify-center gap-1.5 cursor-not-allowed"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Hanya Aktif di Hari {schedule.dayOfWeek}</span>
                              </button>
                            )}
                          </div>
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
                            className="w-full py-1.5 px-3 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#163832] hover:bg-slate-200 dark:hover:bg-[#0B2B26] text-slate-700 dark:text-[#DAF1DE] transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#0B2B26] cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#8EB69B]" />
                            <span>Presensi Selesai - Lihat Jurnal</span>
                          </button>
                        )}
                      </>
                    )}

                    {(isIzin || isSakit) && (
                      <div className="text-center py-1 bg-slate-50 dark:bg-[#0B2B26] rounded-xl border border-slate-100 dark:border-[#163832]">
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Status {isSakit ? 'Sakit' : 'Izin'} Terkunci • Tugas Badal
                        </span>
                      </div>
                    )}

                    {isSubstituted && (
                      <p className="text-xs text-slate-400 dark:text-[#8EB69B] italic text-center py-1">
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
      <div className="bqa-card overflow-hidden transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-[#163832]">
          <h2 className="text-lg font-display font-bold text-[#051F20] dark:text-[#DAF1DE]">
            Riwayat Presensi & Jurnal Terkini
          </h2>
          <p className="text-xs text-[#8EB69B] font-medium mt-1">
            Daftar sesi KBM yang telah tercatat di sistem.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B2B26] border-b border-slate-200 dark:border-[#163832] text-[#8EB69B] text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Mata Pelajaran & Kelas</th>
                <th className="py-3 px-5">Jam Masuk</th>
                <th className="py-3 px-5">Status Jurnal</th>
                <th className="py-3 px-5">Materi Pembelajaran</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#163832]">
              {attendances
                .filter((a) => a.actualTeacherId === currentUser.id)
                .map((att) => {
                  const sched = schedules.find((s) => s.id === att.scheduleId);
                  const isDone = att.status === 'SELESAI';

                  return (
                    <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-[#0f2c25] transition-colors">
                      <td className="py-3 px-5 font-bold text-[#051F20] dark:text-[#DAF1DE] whitespace-nowrap">
                        {att.date}
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-bold text-[#051F20] dark:text-[#DAF1DE]">{sched?.subject || 'KBM Pesantren'}</p>
                        <p className="text-[11px] font-semibold text-[#8EB69B]">{sched?.className} • {sched?.hours} JP</p>
                      </td>
                      <td className="py-3 px-5 font-mono font-bold text-[#163832] dark:text-[#8EB69B]">
                        {att.clockInTime || '-'}
                      </td>
                      <td className="py-3 px-5">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1.5 text-[#163832] bg-[#DAF1DE] dark:bg-[#163832] dark:text-[#DAF1DE] px-2.5 py-1 rounded-[8px] font-bold text-[10px] uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Jurnal Terisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-[8px] font-bold text-[10px] uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3" /> Jurnal Kosong
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 max-w-xs truncate text-[#8EB69B] font-medium">
                        {att.journal?.topic || <span className="italic text-slate-300 dark:text-slate-500">Belum diisi</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {sched && (
                          <button
                            onClick={() => setActiveJournalData({ attendance: att, schedule: sched })}
                            className="text-xs font-semibold text-[#163832] hover:text-[#0B2B26] dark:text-[#8EB69B] dark:hover:text-[#DAF1DE] hover:underline cursor-pointer transition-colors"
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
        onGpsGranted={(sched, coords) => {
          setGpsPromptSchedule(null);
          if (coords) {
            setCachedGpsCoords({
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
            });
          }
          setActiveClockInSchedule(sched);
        }}
      />

      {/* Clock In Modal */}
      {activeClockInSchedule && (
        <ClockInModal
          schedule={activeClockInSchedule}
          teacher={currentUser}
          initialCoordinates={cachedGpsCoords}
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

      {/* Exam Report Modal (Berita Acara Pengawasan) */}
      {activeExamReportData && (
        <ExamReportModal
          isOpen={!!activeExamReportData}
          onClose={() => setActiveExamReportData(null)}
          session={activeExamReportData.session}
          proctor={activeExamReportData.proctor}
          attendance={activeExamReportData.attendance}
        />
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};


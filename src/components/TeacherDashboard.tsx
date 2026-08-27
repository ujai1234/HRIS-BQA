import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  BookOpen, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  UserCheck, 
  ArrowRight, 
  Sparkles,
  Printer,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Award
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, AttendanceRecord } from '../types';
import { ClockInModal } from './ClockInModal';
import { JournalModal } from './JournalModal';
import { SalarySlipModal } from './SalarySlipModal';
import { formatRupiah, getLateCategoryLabel } from '../utils/formatters';

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
  const [selectedDay, setSelectedDay] = useState<string>('Senin');

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

  return (
    <div className="space-y-6">
      {/* Teacher Profile & Monthly Summary Card */}
      <div className="bg-pesantren-dark dark:bg-stone-950 rounded-xl sm:rounded-2xl p-6 text-white border border-white/5 shadow-xl relative overflow-hidden">
        {/* Subtle Brand Pattern Overlay */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pesantren-lime/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pesantren-emerald to-pesantren-dark rounded-2xl flex items-center justify-center shadow-lg border-2 border-pesantren-lime/20 shrink-0 transform -rotate-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30" />
              <span className="text-white text-2xl font-black tracking-tighter drop-shadow-md">BQA</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                {currentUser?.name || 'Guru'}
              </h2>
              <p className="text-xs text-pesantren-lime font-bold mt-2 uppercase tracking-widest">
                {currentUser?.position || 'Guru'} • Unit {currentUser?.unit || '-'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowSlipModal(true)}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 bg-pesantren-emerald hover:bg-pesantren-emerald/90 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-pesantren-lime" />
              <span>Cetak Slip Gaji {selectedPeriod}</span>
            </button>
          </div>
        </div>

        {/* Quick Month Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-800">
          <div className="bg-stone-800/60 rounded-xl p-3.5 border border-stone-700/60">
            <p className="text-[11px] text-stone-400 font-medium">Jam Mengajar Bulan Ini</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-white">
                {teacherPayroll.totalTaughtHours}
              </span>
              <span className="text-xs text-stone-400">JP</span>
              {teacherPayroll.totalBadalHours > 0 && (
                <span className="text-[10px] text-emerald-400 ml-1">
                  (+{teacherPayroll.totalBadalHours} Badal)
                </span>
              )}
            </div>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3.5 border border-stone-700/60">
            <p className="text-[11px] text-stone-400 font-medium">Kehadiran (Hari Hadir)</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-white">
                {teacherPayroll.totalPresentDays}
              </span>
              <span className="text-xs text-stone-400">Hari</span>
            </div>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3.5 border border-stone-700/60">
            <p className="text-[11px] text-stone-400 font-medium">Potongan & Denda</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-bold ${teacherPayroll.totalDeductions > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {teacherPayroll.totalDeductions > 0 ? formatRupiah(teacherPayroll.totalDeductions) : 'Rp 0'}
              </span>
            </div>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3.5 border border-stone-700/60">
            <p className="text-[11px] text-stone-400 font-medium">Estimasi Gaji Bersih</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-emerald-400">
                {formatRupiah(teacherPayroll.netSalary)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workbench Section */}
      <div className="bg-white dark:bg-stone-900 rounded-xl sm:rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        {/* Day Selector & Status Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span>Jadwal Mengajar & Presensi Sesi</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Pilih hari untuk melihat jadwal sesi mengajar dan lakukan Clock-In serta Pengisian Jurnal.
            </p>
          </div>

          {/* Day Tabs */}
          <div className="inline-flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700 overflow-x-auto max-w-full">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedDay === day
                    ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-400 shadow-xs border border-stone-200/80 dark:border-stone-600 font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Cards for Selected Day */}
        {daySchedules.length === 0 ? (
          <div className="text-center py-12 px-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
            <BookOpen className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">
              Tidak ada jadwal mengajar pada hari {selectedDay}
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
              Ustadz/Ustadzah tidak memiliki jam mengajar terjadwal pada hari ini. Silakan pilih hari lain di atas.
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
              const isNotPresent = !att || att.status === 'BELUM_HADIR';

              return (
                <div
                  key={schedule.id}
                  className={`rounded-xl border p-5 transition-all relative flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/50 shadow-xs'
                      : isClockedInNoJournal
                      ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800/50 shadow-xs'
                      : isSubstituted
                      ? 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 opacity-80'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs'
                  }`}
                >
                  {/* Top Badges & Times */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          {schedule.unit} • {schedule.className}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          {schedule.hours} JP
                        </span>
                        {isBadalForMe && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                            Tugas Badal
                          </span>
                        )}
                      </div>

                      {/* Status Indicator Badge */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                          <span>Selesai (Jurnal Terisi)</span>
                        </span>
                      ) : isClockedInNoJournal ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                          <span>Hadir (Jurnal Kosong)</span>
                        </span>
                      ) : isSubstituted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">
                          <span>Digantikan Badal</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">
                          <span>Belum Hadir</span>
                        </span>
                      )}
                    </div>

                    {/* Subject Title */}
                    <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-2.5 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                      <span>{schedule.subject}</span>
                    </h4>

                    {/* Schedule Time & Location Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-400 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                        <span>
                          {schedule.startTime} - {schedule.endTime} WIB
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                        <span className="truncate">{schedule.room}</span>
                      </div>
                    </div>

                    {/* Clock-In Info if already clocked in */}
                    {att && (
                      <div className="mt-3 p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 dark:text-stone-400">Waktu Clock-In:</span>
                          <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                            {att.clockInTime} WIB
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 dark:text-stone-400">Kedisiplinan:</span>
                          <span className={`font-semibold ${getLateCategoryLabel(att.lateCategory).color}`}>
                            {getLateCategoryLabel(att.lateCategory).label}
                          </span>
                        </div>
                        {att.latePenalty > 0 && (
                          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold">
                            <span>Denda Terlambat:</span>
                            <span>-{formatRupiah(att.latePenalty)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                    {isNotPresent && !isSubstituted && (
                      <button
                        onClick={() => setActiveClockInSchedule(schedule)}
                        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-xs"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Clock-In Presensi Sekarang</span>
                      </button>
                    )}

                    {isClockedInNoJournal && att && (
                      <button
                        onClick={() => setActiveJournalData({ attendance: att, schedule })}
                        disabled={att.date < todayStr}
                        className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-400 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-xs"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{att.date < todayStr ? 'Gagal Isi (Batas Lewat)' : 'Wajib Isi Jurnal Mengajar'}</span>
                      </button>
                    )}

                    {isCompleted && att && (
                      <button
                        onClick={() => setActiveJournalData({ attendance: att, schedule })}
                        className="w-full inline-flex items-center justify-center gap-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold px-4 py-2 rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        <span>Lihat / Edit Jurnal Mengajar</span>
                      </button>
                    )}

                    {isSubstituted && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 italic text-center w-full">
                        Telah dialihkan ke Guru Badal ({badalInfo?.reason})
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
      <div className="bg-white dark:bg-stone-900 rounded-xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden space-y-0">
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span>Riwayat Presensi & Jurnal Terkini</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Daftar sesi KBM yang telah tercatat dan tersinkronisasi ke sistem payroll.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/75 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Mata Pelajaran & Kelas</th>
                <th className="py-3 px-4">Waktu Clock-In</th>
                <th className="py-3 px-4">Kedisiplinan</th>
                <th className="py-3 px-4">Status Jurnal</th>
                <th className="py-3 px-4">Materi Pembelajaran</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {attendances
                .filter((a) => a.actualTeacherId === currentUser.id)
                .map((att) => {
                  const sched = schedules.find((s) => s.id === att.scheduleId);
                  const isDone = att.status === 'SELESAI';
                  const lateStyle = getLateCategoryLabel(att.lateCategory);

                  return (
                    <tr key={att.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-stone-800 dark:text-stone-200 whitespace-nowrap">
                        {att.date}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-stone-900 dark:text-stone-100">{sched?.subject || 'KBM Pesantren'}</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">{sched?.className} • {sched?.hours} JP</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-stone-700 dark:text-stone-300">
                        {att.clockInTime || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${lateStyle.badge}`}>
                          {lateStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-500 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Jurnal Terisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-500 font-semibold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" /> Jurnal Kosong (-50%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-stone-600 dark:text-stone-400">
                        {att.journal?.topic || <span className="italic text-stone-400 dark:text-stone-600">Belum diisi</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {sched && (
                          <button
                            onClick={() => setActiveJournalData({ attendance: att, schedule: sched })}
                            className={`text-xs font-semibold ${
                              !isDone && att.date < todayStr 
                                ? 'text-rose-600 dark:text-rose-400 cursor-not-allowed' 
                                : 'text-emerald-700 dark:text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-400 hover:underline'
                            }`}
                          >
                            {isDone ? (att.date < todayStr ? 'Lihat Jurnal' : 'Lihat / Edit') : (att.date < todayStr ? 'Terkunci (Lewat Batas)' : 'Isi Jurnal')}
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

      {/* Clock In Modal */}
      {activeClockInSchedule && (
        <ClockInModal
          schedule={activeClockInSchedule}
          teacher={currentUser}
          onClose={() => setActiveClockInSchedule(null)}
          onSuccess={() => setActiveClockInSchedule(null)}
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


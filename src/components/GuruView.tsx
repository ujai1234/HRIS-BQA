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
  Award,
  CalendarDays,
  CreditCard
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, AttendanceRecord } from '../types';
import { ClockInModal } from './ClockInModal';
import { JournalModal } from './JournalModal';
import { SalarySlipModal } from './SalarySlipModal';
import { SlipGajiView } from './SlipGajiView';
import { formatRupiah, getLateCategoryLabel } from '../utils/formatters';

interface GuruViewProps {
  initialTab?: 'clockin_journal' | 'slip_gaji' | 'jadwal';
}

export const GuruView: React.FC<GuruViewProps> = ({ initialTab = 'clockin_journal' }) => {
  const { 
    currentUser, 
    schedules, 
    attendances, 
    badalAssignments, 
    selectedPeriod, 
    calculateTeacherPayroll 
  } = useHRIS();

  const [activeSubTab, setActiveSubTab] = useState<'clockin_journal' | 'slip_gaji' | 'jadwal'>(initialTab);

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

  return (
    <div className="space-y-6">
      {/* Teacher Profile & Flow Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${currentUser?.avatarColor || 'bg-emerald-600'} flex items-center justify-center font-bold text-xl text-white shadow-md border border-emerald-500/30 shrink-0`}>
              {currentUser?.name ? currentUser.name.split(' ')[0]?.[0] : 'U'}
              {currentUser?.name ? (currentUser.name.split(' ')[1]?.[0] || 'A') : 'A'}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {currentUser?.name || 'Guru Pengampu'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser?.position || 'Guru'} • Unit: <span className="text-emerald-300 font-medium">{currentUser?.unit || '-'}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto text-xs">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Jam (JP)</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{teacherPayroll.totalTaughtHours} JP</span>
              <span className="text-[10px] text-emerald-400">Termasuk {teacherPayroll.totalBadalHours} JP Badal</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Hari Hadir</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{teacherPayroll.totalPresentDays} Hari</span>
              <span className="text-[10px] text-slate-400">Transport: {formatRupiah(teacherPayroll.totalTransport)}</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimasi Gaji Bersih</span>
              <span className="text-lg font-bold text-emerald-300 mt-0.5 block">{formatRupiah(teacherPayroll.netSalary)}</span>
              <span className="text-[10px] text-slate-400">Periode {selectedPeriod}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content 1: Presensi & Jurnal Mengajar */}
      {activeSubTab === 'clockin_journal' && (
        <div className="space-y-6">
          {/* Day Selector & Status Bar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                  Jadwal Harian
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Hari: <strong>{selectedDay}</strong> ({daySchedules.length} Sesi)
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Presensi Masuk & Jurnal Mengajar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat presensi kehadiran saat mulai kelas dan lengkapi jurnal mengajar santri.
              </p>
            </div>

            {/* Day Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedDay === day
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule List for Selected Day */}
          <div className="space-y-4">
            {daySchedules.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">Tidak Ada Jadwal Mengajar pada Hari {selectedDay}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Tidak ada jadwal mengajar reguler atau tugas guru pengganti pada hari ini.
                </p>
              </div>
            ) : (
              daySchedules.map((schedule) => {
                const attendance = getAttendanceForSchedule(schedule.id);
                const badalInfo = getBadalInfoForSchedule(schedule.id);
                const isBadalForMe = badalInfo && badalInfo.badalTeacherId === currentUser.id;
                const isSubstitutedByOther = badalInfo && badalInfo.originalTeacherId === currentUser.id;

                const hasClockedIn = !!attendance && !!attendance.clockInTime;
                const isCompleted = attendance?.status === 'SELESAI';
                const isPendingJournal = attendance?.status === 'HADIR_JURNAL_KOSONG';

                return (
                  <div
                    key={schedule.id}
                    className={`bg-white rounded-xl border transition-all p-5 shadow-xs ${
                      isCompleted 
                        ? 'border-emerald-200 hover:border-emerald-300' 
                        : isPendingJournal
                        ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Schedule Information */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                            {schedule.startTime} - {schedule.endTime} WIB
                          </span>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {schedule.hours} JP
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            Ruang: {schedule.room}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            Unit: {schedule.unit}
                          </span>

                          {isBadalForMe && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                              TUGAS BADAL
                            </span>
                          )}

                          {isSubstitutedByOther && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                              DIGANTIKAN GURU BADAL
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            {schedule.subject}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Kelas: <strong className="text-slate-800">{schedule.className}</strong>
                            {isBadalForMe && (
                              <span className="text-purple-700 font-medium ml-2">
                                (Menggantikan {badalInfo.originalTeacherId})
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Status Message */}
                        {attendance && (
                          <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Presensi: <strong>{attendance.clockInTime} WIB</strong></span>
                            </div>

                            {attendance.lateMinutes > 0 ? (
                              <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                                Terlambat {attendance.lateMinutes} menit (-{formatRupiah(attendance.latePenalty)})
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                Tepat Waktu
                              </span>
                            )}

                            {isCompleted && (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Jurnal Lengkap</span>
                              </span>
                            )}

                            {isPendingJournal && (
                              <span className="text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Jurnal Belum Diisi (Potongan 50% Honor)</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Interactive Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!hasClockedIn ? (
                          <button
                            onClick={() => setActiveClockInSchedule(schedule)}
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Isi Presensi</span>
                          </button>
                        ) : isPendingJournal ? (
                          <button
                            onClick={() => setActiveJournalData({ attendance, schedule })}
                            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Isi Jurnal Mengajar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveJournalData({ attendance, schedule })}
                            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors border border-slate-200"
                          >
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span>Lihat Jurnal</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Journal Details Preview if filled */}
                    {attendance?.journal && (
                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs bg-slate-50 p-3 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>Materi & Uraian PBM yang Diajarkan:</span>
                          <span>Diisi: {attendance.journal.filledAt ? new Date(attendance.journal.filledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB</span>
                        </div>
                        <p className="font-semibold text-slate-800">
                          {attendance.journal.topic}
                        </p>
                        {attendance.journal.studentAttendance && (
                          <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-1">
                            <span>Hadir: <strong className="text-emerald-700">{attendance.journal.studentAttendance.presentCount ?? 0}</strong> santri</span>
                            <span>Sakit: <strong className="text-amber-700">{attendance.journal.studentAttendance.sickCount ?? 0}</strong></span>
                            <span>Izin: <strong className="text-blue-700">{attendance.journal.studentAttendance.permittedCount ?? 0}</strong></span>
                            <span>Alpa: <strong className="text-rose-700">{attendance.journal.studentAttendance.absentCount ?? 0}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Lihat & Cetak Slip Gaji Pribadi */}
      {activeSubTab === 'slip_gaji' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                  Slip Gaji Resmi
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Periode: <strong>{selectedPeriod}</strong>
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Rincian Penghasilan & Potongan Bulanan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian resmi Gaji Pokok, Honor Mengajar ({teacherPayroll.totalTaughtHours} JP), Transport, dan Potongan Kedisiplinan.
              </p>
            </div>

            <button
              onClick={() => setShowSlipModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Slip Gaji Resmi (PDF)</span>
            </button>
          </div>

          <SlipGajiView />
        </div>
      )}

      {/* Tab Content 3: Jadwal Mengajar Mingguan */}
      {activeSubTab === 'jadwal' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Jadwal Mengajar Lengkap ({currentUser?.name || 'Guru'})
              </h3>
              <p className="text-xs text-slate-500">
                Total beban KBM: <strong className="text-emerald-700">{totalWeeklyHours} Jam Pelajaran (JP)</strong> / pekan
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
              Unit Penugasan: {currentUser?.unit || '-'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daysOfWeek.map((day) => {
              const scheds = allMySchedules.filter((s) => s.dayOfWeek === day);
              const dayHours = scheds.reduce((acc, s) => acc + s.hours, 0);

              return (
                <div key={day} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{day}</span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {dayHours} JP
                    </span>
                  </div>

                  {scheds.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2">Tidak ada jam mengajar</p>
                  ) : (
                    <div className="space-y-2">
                      {scheds.map((s) => (
                        <div key={s.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-2xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{s.startTime} - {s.endTime}</span>
                            <span className="font-semibold text-emerald-700">{s.hours} JP</span>
                          </div>
                          <p className="font-bold text-slate-800">{s.subject}</p>
                          <p className="text-[11px] text-slate-600">Kelas: {s.className} • Ruang: {s.room}</p>
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

      {/* Clock In Modal */}
      {activeClockInSchedule && (
        <ClockInModal
          schedule={activeClockInSchedule}
          onClose={() => setActiveClockInSchedule(null)}
          onSuccess={(record) => {
            setActiveClockInSchedule(null);
            // Automatically prompt journal modal after clock in
            setActiveJournalData({
              attendance: record,
              schedule: activeClockInSchedule,
            });
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

      {/* Printable Salary Slip Modal */}
      {showSlipModal && (
        <SalarySlipModal
          teacher={currentUser}
          payroll={teacherPayroll}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  X, 
  CalendarOff, 
  Clock, 
  FileText, 
  AlertTriangle,
  Send,
  Calendar
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, DayOfWeek } from '../types';
import { toast } from 'sonner';

interface TeacherLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSchedule?: ClassSchedule | null;
  selectedDateInitial?: string;
}

export const TeacherLeaveModal: React.FC<TeacherLeaveModalProps> = ({
  isOpen,
  onClose,
  initialSchedule,
  selectedDateInitial
}) => {
  const { 
    currentUser, 
    schedules, 
    markAttendanceDirect, 
    createBadalAssignment,
    logActivity 
  } = useHRIS();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(selectedDateInitial || todayStr);
  const [leaveType, setLeaveType] = useState<'Sakit' | 'Izin Keperluan' | 'Tugas Kedinasan Pesantren' | 'Urusan Mendesak'>('Sakit');
  const [scope, setScope] = useState<'SINGLE' | 'FULL_DAY'>(initialSchedule ? 'SINGLE' : 'FULL_DAY');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(initialSchedule?.id || '');
  const [reasonNotes, setReasonNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive day of week from selected date
  const dayName = useMemo<DayOfWeek>(() => {
    const d = new Date(selectedDate);
    const dayMap: DayOfWeek[] = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayMap[d.getDay()] || 'Senin';
  }, [selectedDate]);

  // Find all teaching schedules for current user on this day
  const mySchedulesOnDate = useMemo(() => {
    return schedules.filter(s => s.teacherId === currentUser.id && s.dayOfWeek === dayName);
  }, [schedules, currentUser.id, dayName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonNotes.trim()) {
      toast.error('Harap masukkan keterangan atau alasan izin');
      return;
    }

    const targetSchedules: ClassSchedule[] = [];
    if (scope === 'SINGLE') {
      const sch = schedules.find(s => s.id === selectedScheduleId);
      if (!sch) {
        toast.error('Harap pilih sesi pelajaran yang diajukan izin');
        return;
      }
      targetSchedules.push(sch);
    } else {
      if (mySchedulesOnDate.length === 0) {
        toast.error(`Tidak ada jadwal mengajar terdaftar pada hari ${dayName}`);
        return;
      }
      targetSchedules.push(...mySchedulesOnDate);
    }

    setIsSubmitting(true);

    try {
      const statusValue = leaveType === 'Sakit' ? 'SAKIT' : 'IZIN';

      for (const sch of targetSchedules) {
        // 1. Mark attendance as IZIN or SAKIT
        markAttendanceDirect(
          sch.id,
          currentUser.id,
          statusValue,
          `Pengajuan ${leaveType}: ${reasonNotes}`
        );

        // 2. Register Badal Assignment request in PENDING status for Kepsek review & assignment
        createBadalAssignment({
          date: selectedDate,
          scheduleId: sch.id,
          originalTeacherId: currentUser.id,
          badalTeacherId: '',
          reason: leaveType,
          status: 'PENDING',
          notes: reasonNotes
        });
      }

      await logActivity(
        'TEACHER_LEAVE_SUBMIT',
        'KBM',
        `Pengajuan ${leaveType} oleh ${currentUser.name} (Unit ${currentUser.unit || 'Pesantren'}) untuk ${selectedDate} (${targetSchedules.length} sesi). Keterangan: ${reasonNotes}`,
        'WARNING'
      );

      toast.success(`Pengajuan ${leaveType} berhasil dikirim ke Kepala Sekolah Unit ${currentUser.unit || 'Terkait'}`);
      onClose();
    } catch (err) {
      console.error('Error submitting leave:', err);
      toast.error('Terjadi kendala saat mengirim pengajuan izin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#121f1a] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/90 dark:border-emerald-900/40 my-auto text-slate-800 dark:text-emerald-100">
        
        {/* Header */}
        <div className="bg-[#09130f] text-white px-5 py-4 flex items-center justify-between border-b border-emerald-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-700/60 flex items-center justify-center">
              <CalendarOff className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-emerald-50">Pengajuan Izin / Sakit Guru</h2>
              <p className="text-[11px] text-emerald-300/70">{currentUser.name} • Unit {currentUser.unit || 'Pesantren'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Info Notice */}
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Pengajuan izin akan diteruskan ke menu <strong>Badal Kepala Sekolah ({currentUser.unit || 'Pesantren'})</strong> untuk diverifikasi dan ditugaskan Guru Badal pengganti.
            </p>
          </div>

          {/* Tanggal & Jenis Izin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 dark:text-emerald-100 block">
                Tanggal Izin / Sakit <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (scope === 'SINGLE') {
                    setSelectedScheduleId('');
                  }
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-[#0e1713] text-slate-900 dark:text-emerald-50 focus:outline-none focus:border-emerald-600"
                required
              />
              <span className="text-[10px] text-slate-500 dark:text-emerald-400/60 block">
                Hari: <strong>{dayName}</strong>
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800 dark:text-emerald-100 block">
                Jenis Izin <span className="text-rose-500">*</span>
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-[#0e1713] text-slate-900 dark:text-emerald-50 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="Sakit">Sakit</option>
                <option value="Izin Keperluan">Izin Keperluan</option>
                <option value="Tugas Kedinasan Pesantren">Tugas Kedinasan Pesantren</option>
                <option value="Urusan Mendesak">Urusan Mendesak</option>
              </select>
            </div>
          </div>

          {/* Cakupan Sesi (Sesi Tertentu vs Full Day) */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-slate-800 dark:text-emerald-100 block">
              Cakupan Jadwal KBM <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('FULL_DAY')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-colors cursor-pointer ${
                  scope === 'FULL_DAY'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100 font-bold'
                    : 'bg-white dark:bg-[#0e1713] border-slate-200 dark:border-emerald-900/30 text-slate-600 dark:text-emerald-300/80 hover:bg-slate-50 dark:hover:bg-[#14231d]'
                }`}
              >
                <span className="text-xs">Sepanjang Hari</span>
                <span className="text-[10px] font-normal opacity-80">
                  Semua sesi {dayName} ({mySchedulesOnDate.length} sesi)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScope('SINGLE');
                  if (!selectedScheduleId && mySchedulesOnDate.length > 0) {
                    setSelectedScheduleId(mySchedulesOnDate[0].id);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-colors cursor-pointer ${
                  scope === 'SINGLE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100 font-bold'
                    : 'bg-white dark:bg-[#0e1713] border-slate-200 dark:border-emerald-900/30 text-slate-600 dark:text-emerald-300/80 hover:bg-slate-50 dark:hover:bg-[#14231d]'
                }`}
              >
                <span className="text-xs">Sesi Tertentu</span>
                <span className="text-[10px] font-normal opacity-80">Pilih 1 mata pelajaran</span>
              </button>
            </div>
          </div>

          {/* Sesi Selector when scope === 'SINGLE' */}
          {scope === 'SINGLE' && (
            <div className="space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-[#0e1713] border border-slate-200/80 dark:border-emerald-900/40">
              <label className="font-semibold text-slate-800 dark:text-emerald-100 block">
                Pilih Sesi Pelajaran:
              </label>
              {mySchedulesOnDate.length === 0 ? (
                <p className="text-xs text-rose-500 py-1">
                  Tidak ada jadwal mengajar pada hari {dayName}. Silakan sesuaikan tanggal.
                </p>
              ) : (
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-[#121f1a] text-slate-900 dark:text-emerald-50 focus:outline-none focus:border-emerald-600"
                  required
                >
                  <option value="">-- Pilih Sesi Pelajaran --</option>
                  {mySchedulesOnDate.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.subject} ({sch.className}) • {sch.startTime}-{sch.endTime} WIB ({sch.hours} JP)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Keterangan Detail */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 dark:text-emerald-100 block">
              Keterangan / Alasan <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              placeholder="Tuliskan keterangan detail izin / kondisi kesehatan..."
              rows={3}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-[#0e1713] text-slate-900 dark:text-emerald-50 focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-emerald-900/30 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-[#182a23] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Izin'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

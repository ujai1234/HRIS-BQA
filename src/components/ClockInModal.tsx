import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClassSchedule, Teacher } from '../types';
import { useHRIS } from '../context/HRISContext';
import { calculateLatePenalty, getLateCategoryLabel } from '../utils/formatters';

interface ClockInModalProps {
  schedule: ClassSchedule;
  teacher?: Teacher | null;
  onClose: () => void;
  onSuccess: (schedule: ClassSchedule) => void;
}

export const ClockInModal: React.FC<ClockInModalProps> = ({
  schedule,
  teacher,
  onClose,
  onSuccess,
}) => {
  const { clockIn, currentUser, teachers, badalAssignments } = useHRIS();
  const effectiveTeacher = teacher || currentUser;

  const todayStr = new Date().toISOString().split('T')[0];
  const activeBadal = badalAssignments.find(
    (b) => b.scheduleId === schedule.id && (b.date === todayStr || !b.date) && (b.status === 'APPROVED' || b.status === 'COMPLETED')
  );
  const isBadalForMe = activeBadal && activeBadal.badalTeacherId === effectiveTeacher?.id;
  const originalTeacher = activeBadal ? teachers.find((t) => t.id === activeBadal.originalTeacherId) : (schedule.teacherId !== effectiveTeacher?.id ? teachers.find((t) => t.id === schedule.teacherId) : null);

  const getRealTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const getFullTimeWithSeconds = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const [currentTime, setCurrentTime] = useState<string>(getRealTimeString());
  const [liveSecondsTime, setLiveSecondsTime] = useState<string>(getFullTimeWithSeconds());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getRealTimeString());
      setLiveSecondsTime(getFullTimeWithSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const penaltyCalculation = calculateLatePenalty(
    currentTime, 
    schedule.startTime,
    effectiveTeacher?.dailyTransport || 10000,
    schedule.hours || 2,
    effectiveTeacher?.hourlyRate || 40000
  );
  const categoryInfo = getLateCategoryLabel(penaltyCalculation.category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const recordedTime = getRealTimeString();
      clockIn(schedule.id, recordedTime, notes);

      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#1B4332', '#2D6A4F', '#52B788', '#B08968'],
        });
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(schedule);
        onClose();
      }, 250);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1A221E] rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800">
        {/* Header */}
        <div className="bg-[#141A17] text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">Presensi Masuk Sesi KBM</h2>
              {isBadalForMe && (
                <span className="text-[10px] font-bold bg-emerald-600/90 text-white px-2 py-0.5 rounded font-mono">
                  BADAL
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {schedule.className} • {schedule.subject} ({schedule.hours} JP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Badal Assignment Indicator Card */}
          {isBadalForMe && originalTeacher && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  Tugas Guru Badal (Disetujui Kepsek)
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Anda melakukan presensi menggantikan <strong>Ustadz {originalTeacher.name}</strong>. Hak honor JP dan transport KBM sesi ini dialokasikan penuh ke kafa'ah Anda.
                </p>
              </div>
            </div>
          )}

          {/* Live Clock Card */}
          <div className="bg-[#FBFBFA] dark:bg-[#141A17] rounded-xl p-4 text-center border border-stone-200 dark:border-stone-800">
            <span className="text-[10px] font-semibold uppercase text-stone-400 tracking-wider block">
              Waktu Server Presensi
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-stone-900 dark:text-stone-100 mt-1 tracking-tight">
              {liveSecondsTime}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Jadwal Masuk Mulai: <strong className="font-mono text-stone-800 dark:text-stone-200">{schedule.startTime} WIB</strong>
            </p>
          </div>

          {/* Real-time Status Card */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
            penaltyCalculation.lateMinutes <= 4
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-[#1B4332] dark:text-emerald-300'
              : 'bg-[#FFFDF5] dark:bg-[#221E14] border-[#E8DCB5] dark:border-[#534720] text-stone-800 dark:text-stone-200'
          }`}>
            {penaltyCalculation.lateMinutes <= 4 ? (
              <CheckCircle2 className="w-4 h-4 text-[#1B4332] dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.5} />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#B08968] shrink-0 mt-0.5" strokeWidth={1.5} />
            )}
            <div>
              <p className="font-bold">
                {penaltyCalculation.lateMinutes <= 4 ? 'Status: Tepat Waktu' : `Terlambat ${penaltyCalculation.lateMinutes} Menit (${categoryInfo.label})`}
              </p>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                {penaltyCalculation.lateMinutes <= 4 
                  ? 'Kafa\'ah honorarium dan transport KBM dibayarkan penuh.' 
                  : `Potongan disiplin: Rp ${penaltyCalculation.penalty.toLocaleString('id-ID')}`}
              </p>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Catatan Kehadiran (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Mengisi pengantar materi di lab..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{isSubmitting ? 'Mencatat...' : 'Konfirmasi Presensi Masuk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

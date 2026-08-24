import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClassSchedule, Teacher } from '../types';
import { useHRIS } from '../context/HRISContext';
import { calculateLatePenalty, getLateCategoryLabel } from '../utils/formatters';

interface ClockInModalProps {
  schedule: ClassSchedule;
  teacher: Teacher;
  onClose: () => void;
  onSuccess: (schedule: ClassSchedule) => void;
}

export const ClockInModal: React.FC<ClockInModalProps> = ({
  schedule,
  teacher,
  onClose,
  onSuccess,
}) => {
  const { clockIn } = useHRIS();

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
    teacher?.dailyTransport || 10000,
    schedule.hours || 2,
    teacher?.hourlyRate || 40000
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
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-white">Presensi Masuk Sesi KBM</h2>
            <p className="text-xs text-slate-400">
              {schedule.className} • {schedule.subject} ({schedule.hours} JP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Schedule Info */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Jadwal Sesi KBM</span>
              <p className="font-bold text-slate-800 font-mono mt-0.5">
                {schedule.startTime} - {schedule.endTime} WIB
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ruangan</span>
              <p className="font-medium text-slate-700 mt-0.5">{schedule.room}</p>
            </div>
          </div>

          {/* Locked Real-time Clock Display */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px] font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Waktu Presensi Terkunci Otomatis (WIB)</span>
            </div>
            <div className="text-3xl font-mono font-bold text-slate-900 tracking-tight">
              {liveSecondsTime}
            </div>
            <p className="text-[11px] text-slate-500">
              Dicatat pada jam aktual saat tombol presensi ditekan
            </p>
          </div>

          {/* Timeliness & Discipline Status */}
          <div className={`p-2.5 rounded-lg border ${categoryInfo.badge} flex items-center justify-between text-xs`}>
            <div className="flex items-center gap-2">
              {penaltyCalculation.lateMinutes > 4 ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <div>
                <p className="font-semibold">{categoryInfo.label}</p>
                <p className="text-[11px] opacity-75">
                  {penaltyCalculation.lateMinutes > 0
                    ? `Selisih masuk +${penaltyCalculation.lateMinutes} menit dari jam mulai (${schedule.startTime})`
                    : 'Tepat waktu sesuai jadwal sesi'}
                </p>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Catatan Kehadiran (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Sesi dimulai tepat waktu..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mencatat Presensi...' : 'Konfirmasi Presensi Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

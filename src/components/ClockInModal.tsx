import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  BookOpen, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Timer, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClassSchedule, Teacher } from '../types';
import { useHRIS } from '../context/HRISContext';
import { calculateLatePenalty, getLateCategoryLabel, formatRupiah } from '../utils/formatters';

interface ClockInModalProps {
  schedule: ClassSchedule;
  teacher: Teacher;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClockInModal: React.FC<ClockInModalProps> = ({
  schedule,
  teacher,
  onClose,
  onSuccess,
}) => {
  const { clockIn, badalAssignments } = useHRIS();

  // Get current time formatted HH:mm
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [selectedTime, setSelectedTime] = useState<string>(schedule.startTime);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if there is badal delegation
  const todayStr = new Date().toISOString().split('T')[0];
  const activeBadal = badalAssignments.find(
    (b) => b.scheduleId === schedule.id && b.date === todayStr && b.status !== 'PENDING'
  );

  const penaltyCalculation = calculateLatePenalty(selectedTime, schedule.startTime);
  const categoryInfo = getLateCategoryLabel(penaltyCalculation.category);

  // Set default initial time slightly around scheduled start time
  useEffect(() => {
    // Default preset
    setSelectedTime(schedule.startTime);
  }, [schedule]);

  const handleQuickPreset = (offsetMinutes: number) => {
    const [h, m] = schedule.startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + offsetMinutes, 0);
    const formatted = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    setSelectedTime(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      clockIn(schedule.id, selectedTime, notes);

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
        });
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 400);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-700/80 flex items-center justify-center border border-emerald-500/40">
              <Clock className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Presensi Masuk (Clock-In)</h2>
              <p className="text-xs text-emerald-200">Jadwal Mengajar Pesantren Baitul Qur'an</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white hover:bg-emerald-700/60 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Class & Subject Details Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                  {schedule.unit} • {schedule.className}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                  {schedule.subject}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-white text-slate-700 px-2 py-1 rounded border border-slate-200">
                {schedule.hours} JP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Jadwal:{' '}
                  <strong className="text-slate-800">
                    {schedule.startTime} - {schedule.endTime}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{schedule.room}</span>
              </div>
            </div>

            {activeBadal ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Sesi ini didelegasikan ke <strong>Guru Badal</strong> ({teacher.name}).
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Pengampu: <strong>{teacher.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Clock-In Time Setting */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Waktu Clock-In Kedatangan
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
                className="w-full text-center font-mono font-bold text-2xl px-4 py-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setSelectedTime(getCurrentTimeString())}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors whitespace-nowrap"
              >
                Jam Sekarang
              </button>
            </div>

            {/* Quick Test Presets */}
            <div className="mt-2.5">
              <p className="text-[11px] text-slate-500 mb-1">Pilihan Cepat Simulasi Keterlambatan:</p>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickPreset(0)}
                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-center font-medium"
                >
                  Tepat (0 mnt)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(8)}
                  className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-center font-medium"
                >
                  +8 mnt (Ringan)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(20)}
                  className="px-2 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-center font-medium"
                >
                  +20 mnt (Sedang)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(35)}
                  className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-center font-medium"
                >
                  +35 mnt (Berat)
                </button>
              </div>
            </div>
          </div>

          {/* Realtime Penalty & Status Calculation Preview */}
          <div className={`p-3.5 rounded-xl border ${categoryInfo.badge} flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              {penaltyCalculation.penalty > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold">{categoryInfo.label}</p>
                <p className="text-[11px] opacity-80">
                  {penaltyCalculation.lateMinutes > 0
                    ? `Selisih keterlambatan: ${penaltyCalculation.lateMinutes} menit`
                    : 'Masuk tepat waktu sesuai ketentuan (≤4 menit)'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                Denda Terlambat
              </span>
              <span className="font-bold text-sm">
                {penaltyCalculation.penalty > 0 ? formatRupiah(penaltyCalculation.penalty) : 'Rp 0'}
              </span>
            </div>
          </div>

          {/* Important Rules Reminder */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <Timer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ketentuan Presensi & Jurnal Mengajar:</span>
            </div>
            <p>• Setelah Clock-In, status presensi menjadi <strong>Hadir (Jurnal Kosong)</strong>.</p>
            <p>• <strong>Wajib mengisi Jurnal Mengajar</strong> untuk merubah status menjadi <strong>Selesai</strong> agar honor mengajar dihitung penuh tanpa potongan 50%.</p>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Catatan Kedatangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Sedikit macet di jalan raya Ciawi / Badal darurat"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi Clock-In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Check, 
  AlertCircle,
  MapPin,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClassSchedule, Teacher } from '../types';
import { useHRIS } from '../context/HRISContext';
import { calculateLatePenalty, getLateCategoryLabel, validateScheduleTimeWindow } from '../utils/formatters';
import { validateAttendanceLocation, LocationValidationResult } from '../utils/geoUtils';

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
  const { clockIn, currentUser, teachers, badalAssignments, geofenceSettings, attendances } = useHRIS();
  const effectiveTeacher = teacher || currentUser;

  const todayStr = new Date().toISOString().split('T')[0];
  const existingAtt = attendances.find(a => a.scheduleId === schedule.id && a.date === todayStr);
  const isAlreadyClockedIn = !!existingAtt && (existingAtt.status === 'SELESAI' || existingAtt.status === 'HADIR_JURNAL_KOSONG' || existingAtt.status === 'IZIN' || existingAtt.status === 'SAKIT');

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

  // GPS and Geofence state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getRealTimeString());
      setLiveSecondsTime(getFullTimeWithSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect GPS on component mount
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser atau perangkat ini tidak mendukung geolokasi GPS.');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        let msg = 'Izin lokasi tidak aktif.';
        if (err.code === 1) {
          msg = 'Izin lokasi ditolak. Silakan izinkan akses lokasi pada browser/HP.';
        } else if (err.code === 2) {
          msg = 'Lokasi tidak terdeteksi. Pastikan GPS HP aktif.';
        } else if (err.code === 3) {
          msg = 'Waktu permintaan lokasi habis. Silakan muat ulang lokasi.';
        }
        setGpsError(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // Compute location validation result
  const hasGps = userLat !== null && userLng !== null;
  const locationValidation: LocationValidationResult = validateAttendanceLocation(
    userLat,
    userLng,
    geofenceSettings,
    false
  );

  const penaltyCalculation = calculateLatePenalty(
    currentTime, 
    schedule.startTime,
    effectiveTeacher?.dailyTransport || 10000,
    schedule.hours || 2,
    effectiveTeacher?.hourlyRate || 40000
  );
  const categoryInfo = getLateCategoryLabel(penaltyCalculation.category);

  // Schedule time window validation
  const timeValidation = validateScheduleTimeWindow(schedule, currentTime);

  // Must have active GPS and be within Pesantren radius AND within schedule time window
  const isGpsRequiredMissing = !hasGps || isLocating;
  const isOutsideRadius = hasGps && !locationValidation.isValid;
  const isOutsideTimeWindow = !timeValidation.canClockIn;
  const isBlocked = isGpsRequiredMissing || isOutsideRadius || isAlreadyClockedIn || isOutsideTimeWindow;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      return;
    }

    setIsSubmitting(true);

    try {
      const recordedTime = getRealTimeString();
      const locDetail = userLat && userLng 
        ? ` [Lokasi: Pesantren (~${locationValidation.distanceMeters}m)]`
        : '';
      
      const finalNotes = (notes ? `${notes}${locDetail}` : locDetail).trim();

      clockIn(schedule.id, recordedTime, finalNotes);

      try {
        confetti({
          particleCount: 40,
          spread: 45,
          origin: { y: 0.6 },
          colors: ['#059669', '#10B981', '#34D399'],
        });
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(schedule);
        onClose();
      }, 200);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#101714] rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Presensi KBM
              </h2>
              {isBadalForMe && (
                <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                  Badal
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {schedule.className} • {schedule.subject} ({schedule.hours} JP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Badal Notice */}
          {isBadalForMe && originalTeacher && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p>
                Menggantikan <strong>Ustadz {originalTeacher.name}</strong>. Hak honorarium KBM dialokasikan ke Anda.
              </p>
            </div>
          )}

          {/* Time Display & Window Validation */}
          <div className={`rounded-xl p-3.5 text-center border transition-all ${
            timeValidation.canClockIn
              ? 'bg-slate-50 dark:bg-[#0f1b16] border-slate-200/80 dark:border-emerald-900/40'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
          }`}>
            <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">
              Waktu Presensi Sekarang
            </span>
            <div className={`text-2xl font-mono font-bold mt-0.5 tracking-tight ${
              timeValidation.canClockIn
                ? 'text-slate-900 dark:text-emerald-50'
                : 'text-rose-700 dark:text-rose-300'
            }`}>
              {liveSecondsTime}
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs mt-2 pt-2 border-t border-slate-200/60 dark:border-emerald-900/30">
              <span className="text-slate-500 dark:text-slate-400">
                Waktu Sesi: <strong>{schedule.startTime} - {schedule.endTime} WIB</strong>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-[#1a2d24] text-slate-700 dark:text-emerald-300 font-semibold">
                Buka: {timeValidation.allowedStartTime} WIB
              </span>
            </div>

            {!timeValidation.canClockIn && (
              <div className="mt-2.5 p-2 rounded-lg bg-rose-100/70 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 text-left flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-tight text-[11px]">
                  <strong>Di Luar Waktu Yang Ditetapkan:</strong> {timeValidation.message}
                </p>
              </div>
            )}
          </div>

          {/* Location / GPS Mandatory Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Lokasi Presensi
              </span>
              {isLocating && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Mencari GPS...
                </span>
              )}
            </div>

            {/* GPS Status Box */}
            {isLocating ? (
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 text-center">
                Mendeteksi koordinat GPS smartphone Anda...
              </div>
            ) : gpsError || !hasGps ? (
              <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-950 bg-rose-50/70 dark:bg-rose-950/30 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 dark:text-rose-200">
                    <p className="font-medium">Wajib Menyalakan Lokasi / GPS</p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-0.5">
                      {gpsError || 'Aktifkan fitur Lokasi (GPS) pada smartphone Anda untuk presensi di wilayah pesantren.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="w-full text-center py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
                >
                  Cek Ulang Lokasi GPS
                </button>
              </div>
            ) : isOutsideRadius ? (
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-950 bg-amber-50/70 dark:bg-amber-950/30 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-medium">Di Luar Wilayah Pesantren</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                      Jarak Anda {locationValidation.distanceMeters}m dari pusat pesantren (Maksimal {geofenceSettings?.radiusMeters || 150}m).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="w-full text-center py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors cursor-pointer"
                >
                  Perbarui Lokasi GPS
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-950 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-xs text-emerald-900 dark:text-emerald-200">
                    <span className="font-medium">Di Wilayah Pesantren</span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300/80 ml-1.5">
                      ({locationValidation.distanceMeters}m dari pusat)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  title="Perbarui GPS"
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Segarkan
                </button>
              </div>
            )}
          </div>

          {/* Punctuality Status */}
          <div className="text-xs flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400">
              Kedisiplinan:
            </span>
            <span className={`font-medium ${
              penaltyCalculation.lateMinutes <= 4
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}>
              {penaltyCalculation.lateMinutes <= 4 ? 'Tepat Waktu' : `Terlambat ${penaltyCalculation.lateMinutes} mnt`}
            </span>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika ada..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isBlocked}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs ${
                isBlocked
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isSubmitting 
                ? 'Memproses...' 
                : isAlreadyClockedIn
                  ? 'Presensi Sudah Selesai'
                  : !timeValidation.canClockIn
                    ? timeValidation.status === 'TOO_EARLY'
                      ? `Belum Waktunya (Buka ${timeValidation.allowedStartTime})`
                      : timeValidation.status === 'EXPIRED'
                        ? 'Waktu Absen Telah Berakhir'
                        : `Jadwal Hari ${schedule.dayOfWeek}`
                    : isGpsRequiredMissing 
                      ? 'Nyalakan GPS HP' 
                      : isOutsideRadius 
                        ? 'Di Luar Wilayah Pesantren' 
                        : 'Konfirmasi Absen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

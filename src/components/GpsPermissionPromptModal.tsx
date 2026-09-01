import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  RefreshCw, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { preCheckDeviceGps, GpsPreCheckState } from '../services/geofenceService';
import { ClassSchedule } from '../types';

interface GpsPermissionPromptModalProps {
  isOpen: boolean;
  schedule: ClassSchedule | null;
  initialState?: GpsPreCheckState;
  onClose: () => void;
  onGpsGranted: (schedule: ClassSchedule) => void;
}

export const GpsPermissionPromptModal: React.FC<GpsPermissionPromptModalProps> = ({
  isOpen,
  schedule,
  initialState = 'PERMISSION_BLOCKED',
  onClose,
  onGpsGranted,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'phone' | 'browser'>('phone');
  const [currentState, setCurrentState] = useState<GpsPreCheckState>(initialState);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  if (!isOpen || !schedule) return null;

  const handleRecheckGps = async () => {
    setIsChecking(true);
    setStatusFeedback(null);

    try {
      const result = await preCheckDeviceGps();
      setCurrentState(result.state);

      if (result.state === 'READY') {
        setStatusFeedback('Alhamdulillah, sinyal GPS berhasil terdeteksi!');
        setTimeout(() => {
          setIsChecking(false);
          onGpsGranted(schedule);
        }, 500);
      } else {
        setStatusFeedback(result.message);
        setIsChecking(false);
      }
    } catch {
      setStatusFeedback('Gagal memeriksa GPS. Pastikan GPS aktif lalu coba lagi.');
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white dark:bg-[#101714] rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200/90 dark:border-slate-800"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Akses Lokasi Diperlukan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Presensi KBM • {schedule.subject} ({schedule.className})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          
          {/* Polite Institutional Message */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verifikasi Kehadiran Pesantren</span>
            </div>
            <p>
              Assalamu'alaikum Warahmatullahi Wabarakatuh. Untuk memastikan kehadiran KBM berada di wilayah <strong>Pesantren Baitul Qur'an Al-Ikhwan</strong>, mohon aktifkan GPS pada smartphone dan izinkan akses lokasi pada browser Anda.
            </p>
          </div>

          {/* Guide Selector Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Panduan Singkat
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('phone')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    activeGuideTab === 'phone'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>GPS HP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('browser')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    activeGuideTab === 'browser'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Izin Browser</span>
                </button>
              </div>
            </div>

            {/* Guide Step Details */}
            <div className="p-3 bg-white dark:bg-slate-900/30 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
              {activeGuideTab === 'phone' ? (
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>Tarik menu pengaturan cepat (Notification bar) di smartphone Anda.</li>
                  <li>Pastikan ikon <strong>Lokasi / GPS</strong> dalam keadaan <strong>Aktif (Menyala)</strong>.</li>
                  <li>Kembali ke halaman ini dan tekan tombol <strong>"Cek Ulang Lokasi"</strong> di bawah.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>Ketuk ikon <strong>Gembok</strong> atau <strong>Setelan Situs</strong> di sebelah kiri alamat web (URL bar).</li>
                  <li>Cari menu <strong>Izin Lokasi (Location)</strong> dan ubah menjadi <strong>"Izinkan" (Allow)</strong>.</li>
                  <li>Setelah itu, tekan tombol <strong>"Cek Ulang Lokasi"</strong> di bawah.</li>
                </ol>
              )}
            </div>
          </div>

          {/* Real-time Status Feedback */}
          {statusFeedback && (
            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              currentState === 'READY'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}>
              {currentState === 'READY' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className="text-[11px]">{statusFeedback}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleRecheckGps}
              disabled={isChecking}
              className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Memeriksa GPS...' : 'Cek Ulang Lokasi'}</span>
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';

// Sesi 15 menit (900 detik), Peringatan muncul saat sisa 2 menit (120 detik)
const SESSION_DURATION_SECONDS = 15 * 60;
const WARNING_BEFORE_EXPIRY_SECONDS = 2 * 60;

export const SessionTimeoutManager: React.FC = () => {
  const { isAuthenticated, logout } = useHRIS();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_BEFORE_EXPIRY_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extend / Reset session timer
  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setSecondsRemaining(WARNING_BEFORE_EXPIRY_SECONDS);

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Jadwalkan kemunculan modal peringatan (setelah 13 menit)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(WARNING_BEFORE_EXPIRY_SECONDS);

      // Mulai hitung mundur detik saat modal peringatan muncul
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, (SESSION_DURATION_SECONDS - WARNING_BEFORE_EXPIRY_SECONDS) * 1000);
  }, [logout]);

  // Listener aktivitas user (reset timer otomatis jika belum masuk fase modal peringatan)
  useEffect(() => {
    if (!isAuthenticated) {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setShowWarning(false);
      return;
    }

    extendSession();

    const handleUserActivity = () => {
      // Jika modal peringatan belum muncul, perbarui waktu aktivitas
      if (!showWarning) {
        extendSession();
      }
    };

    const userActivityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    userActivityEvents.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      userActivityEvents.forEach((event) => window.removeEventListener(event, handleUserActivity));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated, extendSession, showWarning]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isAuthenticated && showWarning && (
        <div 
          id="session-warning-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <motion.div
            id="session-warning-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden"
          >
            {/* Header Peringatan */}
            <div id="session-warning-header" className="bg-amber-50/90 p-5 flex items-center gap-3.5 border-b border-amber-200/70">
              <div className="bg-amber-100 p-2.5 rounded-xl shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Peringatan Sesi Berakhir</h3>
                <p className="text-xs text-amber-900/80 mt-0.5">Sesi Anda akan ditutup secara otomatis untuk menjaga keamanan data.</p>
              </div>
            </div>

            {/* Konten & Countdown */}
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 border-2 border-slate-200/80 mb-4 shadow-2xs">
                <div className="flex flex-col items-center">
                  <Clock className="w-4 h-4 text-slate-400 mb-0.5" />
                  <span 
                    id="session-countdown-timer" 
                    className="text-xl font-black text-slate-900 font-mono tracking-tight"
                  >
                    {formatCountdown(secondsRemaining)}
                  </span>
                </div>
              </div>

              <p className="text-slate-600 text-xs max-w-xs mx-auto mb-6">
                Tidak ada aktivitas terdeteksi. Apakah Anda ingin memperpanjang sesi login ini atau keluar?
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="btn-session-logout"
                  onClick={() => logout()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
                <button
                  id="btn-session-extend"
                  onClick={extendSession}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Perpanjang Sesi</span>
                </button>
              </div>
            </div>

            {/* Footer Sistem */}
            <div className="bg-slate-50/70 px-5 py-2.5 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Proteksi Akses Terenkripsi HRIS Pesantren
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

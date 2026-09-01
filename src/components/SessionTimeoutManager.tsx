import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';

// Sesi tepat 5 menit (300 detik), Peringatan muncul saat sisa 60 detik (1 menit)
const SESSION_DURATION_SECONDS = 5 * 60; // 300 detik (5 menit)
const WARNING_BEFORE_EXPIRY_SECONDS = 60; // 60 detik (1 menit)

export const SessionTimeoutManager: React.FC = () => {
  const { isAuthenticated, logout } = useHRIS();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_BEFORE_EXPIRY_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const tickerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStorageSyncRef = useRef<number>(0);

  // Extend / Reset session timer (Memperbarui waktu aktivitas terakhir)
  const extendSession = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    setShowWarning(false);
    setSecondsRemaining(WARNING_BEFORE_EXPIRY_SECONDS);

    // Sync ke localStorage dengan throttling 5 detik
    if (now - lastStorageSyncRef.current > 5000) {
      try {
        localStorage.setItem('hris_pbq_session_last_activity', now.toString());
        lastStorageSyncRef.current = now;
      } catch {
        // Abaikan error localStorage
      }
    }
  }, []);

  // Effect utama: Interval pengecekan waktu nyata (1 detik sekali)
  useEffect(() => {
    if (!isAuthenticated) {
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
      setShowWarning(false);
      return;
    }

    // Inisialisasi waktu aktivitas saat pertama login/mount
    const storedLastActivity = Number(localStorage.getItem('hris_pbq_session_last_activity') || 0);
    const initialActivity = storedLastActivity > 0 && Date.now() - storedLastActivity < SESSION_DURATION_SECONDS * 1000
      ? storedLastActivity
      : Date.now();

    lastActivityRef.current = initialActivity;
    localStorage.setItem('hris_pbq_session_last_activity', initialActivity.toString());
    lastStorageSyncRef.current = initialActivity;

    // Interval hitung mundur presisi berbasis selisih timestamp
    tickerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActivityRef.current) / 1000);
      const remaining = SESSION_DURATION_SECONDS - elapsedSeconds;

      if (remaining <= 0) {
        // Sesi telah habis (5 menit) -> Logout otomatis
        if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
        setShowWarning(false);
        logout();
      } else if (remaining <= WARNING_BEFORE_EXPIRY_SECONDS) {
        // Masuk fase peringatan (sisa <= 60 detik)
        setShowWarning(true);
        setSecondsRemaining(remaining);
      } else {
        // Masih aktif (> 60 detik)
        setShowWarning(false);
      }
    }, 1000);

    // Listener aktivitas pengguna untuk memperpanjang sesi secara otomatis selama modal belum terbuka
    const handleUserActivity = () => {
      if (!showWarning) {
        extendSession();
      }
    };

    const userActivityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    userActivityEvents.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      userActivityEvents.forEach((event) => window.removeEventListener(event, handleUserActivity));
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
    };
  }, [isAuthenticated, logout, extendSession, showWarning]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isAuthenticated && showWarning && (
        <div 
          id="session-warning-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
        >
          <motion.div
            id="session-warning-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-stone-800 w-full max-w-md overflow-hidden font-sans"
          >
            {/* Header Peringatan */}
            <div id="session-warning-header" className="bg-amber-50/90 dark:bg-amber-950/40 p-5 flex items-center gap-3.5 border-b border-amber-200/70 dark:border-amber-900/50">
              <div className="bg-amber-100 dark:bg-amber-900/60 p-2.5 rounded-xl shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-800 dark:text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Sesi Login Segera Berakhir</h3>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">Batas sesi 5 menit demi privasi & keamanan data asatidz.</p>
              </div>
            </div>

            {/* Konten & Countdown */}
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 mb-4 shadow-2xs">
                <div className="flex flex-col items-center">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-0.5 animate-pulse" />
                  <span 
                    id="session-countdown-timer" 
                    className="text-xl font-bold text-stone-900 dark:text-stone-100 font-mono tracking-tight"
                  >
                    {formatCountdown(secondsRemaining)}
                  </span>
                </div>
              </div>

              <p className="text-stone-600 dark:text-stone-300 text-xs max-w-xs mx-auto mb-2 leading-relaxed">
                Tidak ada aktivitas baru. Sesi Anda akan otomatis ditutup dalam <strong>{secondsRemaining} detik</strong>.
              </p>
              <p className="text-stone-400 dark:text-stone-500 text-[11px] max-w-xs mx-auto mb-6">
                Klik <strong>Perpanjang Sesi</strong> untuk melanjutkan pekerjaan Anda selama 5 menit ke depan.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="btn-session-logout"
                  type="button"
                  onClick={() => logout()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
                <button
                  id="btn-session-extend"
                  type="button"
                  onClick={extendSession}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Perpanjang Sesi</span>
                </button>
              </div>
            </div>

            {/* Footer Sistem */}
            <div className="bg-stone-50/70 dark:bg-stone-850 px-5 py-2.5 border-t border-stone-100 dark:border-stone-800 text-center">
              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                Proteksi Akses Terenkripsi HRIS Pesantren Baitul Qur'an Al-Ikhwan
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

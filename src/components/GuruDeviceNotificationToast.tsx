import React, { useEffect, useRef } from 'react';
import { X, ChevronRight, UserCheck } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { useGuruNotifications, GuruNotificationItem } from '../hooks/useGuruNotifications';

export const GuruDeviceNotificationToast: React.FC = () => {
  const { currentRole, setCurrentPath } = useHRIS();
  const { activeDeviceAlerts, dismissToast, markAsRead } = useGuruNotifications();
  const lastAlertedIdRef = useRef<string | null>(null);

  // Play subtle gentle chime for new incoming alert
  useEffect(() => {
    if (activeDeviceAlerts.length > 0) {
      const topAlert = activeDeviceAlerts[0];
      if (topAlert.id !== lastAlertedIdRef.current) {
        lastAlertedIdRef.current = topAlert.id;
        try {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
          }
        } catch {
          // Audio autoplay safe fallback
        }
      }
    }
  }, [activeDeviceAlerts]);

  if (currentRole !== 'GURU' || activeDeviceAlerts.length === 0) {
    return null;
  }

  // Display top priority alert
  const alert: GuruNotificationItem = activeDeviceAlerts[0];
  const count = activeDeviceAlerts.length;
  const isBadal = alert.type === 'BADAL';

  const handleAction = (item: GuruNotificationItem) => {
    markAsRead(item.id);
    dismissToast(item.id);
    setCurrentPath(item.actionPath);
  };

  const getBadgeStyle = (type: GuruNotificationItem['type']) => {
    switch (type) {
      case 'BADAL':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold';
      case 'ATTENDANCE_OPEN':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'JOURNAL_PENDING':
        return 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900';
      default:
        return 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    }
  };

  const getTypeLabel = (type: GuruNotificationItem['type']) => {
    switch (type) {
      case 'BADAL':
        return 'Penugasan Badal Baru';
      case 'ATTENDANCE_OPEN':
        return 'Waktu Presensi';
      case 'JOURNAL_PENDING':
        return 'Isi Jurnal';
      default:
        return 'Pemberitahuan';
    }
  };

  return (
    <div className="fixed top-18 right-4 left-4 sm:left-auto sm:right-6 z-40 max-w-sm w-auto animate-in fade-in slide-in-from-top-3 duration-200 print:hidden pointer-events-auto">
      <div className={`rounded-xl p-3 shadow-xl border flex items-start gap-2.5 transition-all bg-white dark:bg-stone-900 ${
        isBadal 
          ? 'border-l-4 border-l-[#B08968] border-stone-200 dark:border-stone-800' 
          : 'border-l-4 border-l-[#1B4332] border-stone-200 dark:border-stone-800'
      }`}>
        {/* Minimalist Indicator Dot */}
        <div className="mt-1 flex-shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1B4332] dark:bg-emerald-400"></span>
          </span>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
              {alert.title}
            </span>
            {count > 1 && (
              <span className="text-[9px] bg-stone-100 dark:bg-stone-800 text-stone-550 dark:text-stone-400 px-1.5 py-0.2 rounded-full font-bold shrink-0">
                +{count - 1} lainnya
              </span>
            )}
          </div>

          <p className="text-[11px] text-stone-550 dark:text-stone-400 line-clamp-1 leading-normal mb-2">
            {alert.subtitle}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAction(alert)}
              className="text-[10px] font-extrabold text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer active:scale-95 inline-flex items-center gap-0.5"
            >
              <span>{alert.actionLabel}</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => dismissToast(alert.id)}
              className="text-[10px] font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            >
              Nanti
            </button>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => dismissToast(alert.id)}
          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded transition-colors cursor-pointer shrink-0"
          title="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

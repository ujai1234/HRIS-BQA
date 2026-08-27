import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { useGuruNotifications, GuruNotificationItem } from '../hooks/useGuruNotifications';

export const GuruDeviceNotificationToast: React.FC = () => {
  const { currentRole, setCurrentPath } = useHRIS();
  const { activeDeviceAlerts, dismissToast, markAsRead } = useGuruNotifications();

  if (currentRole !== 'GURU' || activeDeviceAlerts.length === 0) {
    return null;
  }

  // Display top priority alert
  const alert: GuruNotificationItem = activeDeviceAlerts[0];
  const count = activeDeviceAlerts.length;

  const handleAction = (item: GuruNotificationItem) => {
    markAsRead(item.id);
    dismissToast(item.id);
    setCurrentPath(item.actionPath);
  };

  const getBadgeStyle = (type: GuruNotificationItem['type']) => {
    switch (type) {
      case 'BADAL':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900';
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
        return 'Tugas Badal';
      case 'ATTENDANCE_OPEN':
        return 'Waktu Presensi';
      case 'JOURNAL_PENDING':
        return 'Isi Jurnal';
      default:
        return 'Pemberitahuan';
    }
  };

  return (
    <div className="fixed top-18 right-4 left-4 sm:left-auto sm:right-6 z-40 max-w-md w-auto animate-in fade-in slide-in-from-top-3 duration-200 print:hidden pointer-events-auto">
      <div className="bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md text-white rounded-xl p-3 sm:p-3.5 shadow-2xl border border-stone-800 flex items-start gap-3">
        {/* Minimalist Indicator Dot */}
        <div className="mt-1 flex-shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getBadgeStyle(alert.type)}`}>
              {getTypeLabel(alert.type)}
            </span>
            <span className="text-[11px] font-semibold text-stone-200 truncate">
              {alert.title}
            </span>
            {count > 1 && (
              <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded-full font-medium ml-auto">
                +{count - 1} lainnya
              </span>
            )}
          </div>

          <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed mb-2.5">
            {alert.subtitle}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction(alert)}
              className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              <span>{alert.actionLabel}</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => dismissToast(alert.id)}
              className="text-[11px] text-stone-400 hover:text-white px-2 py-1.5 transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => dismissToast(alert.id)}
          className="text-stone-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0"
          title="Tutup Notifikasi"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

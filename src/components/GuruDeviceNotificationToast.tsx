import React from 'react';
import { X, ChevronRight, Bell } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { useGuruNotifications, GuruNotificationItem } from '../hooks/useGuruNotifications';

export const GuruDeviceNotificationToast: React.FC = () => {
  const { currentRole, setCurrentPath } = useHRIS();
  const { 
    activeDeviceAlerts, 
    dismissToast, 
    markAsRead, 
    devicePermission, 
    requestDevicePermission 
  } = useGuruNotifications();

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

  return (
    <div className="fixed top-18 right-4 left-4 sm:left-auto sm:right-6 z-40 max-w-sm w-auto animate-in fade-in slide-in-from-top-3 duration-200 print:hidden pointer-events-auto">
      <div className={`rounded-2xl p-3.5 shadow-2xl border flex flex-col gap-2.5 transition-all bg-white dark:bg-[#131f1a] ${
        isBadal 
          ? 'border-l-4 border-l-amber-600 border-slate-200 dark:border-emerald-800/50' 
          : 'border-l-4 border-l-emerald-600 border-slate-200 dark:border-emerald-800/50'
      }`}>
        <div className="flex items-start gap-2.5">
          {/* Minimalist Indicator Dot */}
          <div className="mt-1 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-400"></span>
            </span>
          </div>

          {/* Notification Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-emerald-50 truncate">
                {alert.title}
              </span>
              {count > 1 && (
                <span className="text-[9px] bg-slate-100 dark:bg-[#1a2b24] text-slate-600 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold shrink-0 border border-slate-200 dark:border-emerald-800/40">
                  +{count - 1} lainnya
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 dark:text-emerald-200/70 line-clamp-2 leading-relaxed mb-2.5">
              {alert.subtitle}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction(alert)}
                className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer active:scale-95 inline-flex items-center gap-0.5"
              >
                <span>{alert.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => dismissToast(alert.id)}
                className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                Nanti
              </button>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => dismissToast(alert.id)}
            className="text-slate-400 hover:text-slate-600 dark:text-emerald-400/60 dark:hover:text-emerald-200 p-0.5 rounded transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Device Notification Status Banner for Mobile/Tablet external alerts */}
        {devicePermission !== 'granted' && (
          <div className="pt-2 border-t border-slate-100 dark:border-emerald-900/30 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 dark:text-emerald-300/70 flex items-center gap-1">
              <Bell className="w-3 h-3 text-amber-500" />
              <span>Ingin notifikasi muncul di HP saat aplikasi ditutup?</span>
            </span>
            <button
              onClick={requestDevicePermission}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 cursor-pointer"
            >
              Aktifkan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Monitor, 
  Apple, 
  Volume2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ShieldCheck
} from 'lucide-react';
import { deviceNotificationService } from '../utils/deviceNotificationService';

interface DeviceNotificationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  devicePermission: NotificationPermission;
  onPermissionChange: (perm: NotificationPermission) => void;
}

export const DeviceNotificationGuideModal: React.FC<DeviceNotificationGuideModalProps> = ({
  isOpen,
  onClose,
  devicePermission,
  onPermissionChange
}) => {
  const [testSent, setTestSent] = useState(false);
  const isInIframe = deviceNotificationService.isInIframe();

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await deviceNotificationService.requestPermission();
    onPermissionChange(perm);
  };

  const handleTestChimeAndPush = async () => {
    deviceNotificationService.playChime();
    await deviceNotificationService.sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  const handleOpenDirectTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#121f1a] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/90 dark:border-emerald-900/40 my-auto text-slate-800 dark:text-emerald-100">
        
        {/* Header */}
        <div className="bg-[#09130f] text-white px-5 py-4 flex items-center justify-between border-b border-emerald-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-emerald-50">Notifikasi Layar Kunci & HP</h2>
              <p className="text-[11px] text-emerald-300/70">Panduan & Cara Kerja Sistem Pemberitahuan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Status Alert Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            devicePermission === 'granted'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
          }`}>
            {devicePermission === 'granted' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold">
                  Status Izin Perangkat: {devicePermission === 'granted' ? 'Sudah Aktif ✓' : 'Belum Diberikan Izin'}
                </p>
              </div>
              <p className="text-[11px] mt-0.5 opacity-90">
                {devicePermission === 'granted'
                  ? 'Perangkat Anda siap menerima pemberitahuan langsung di layar kunci dan bilah status saat jam masuk KBM atau tugas badal baru.'
                  : 'Klik tombol "Minta Izin Browser" di bawah atau buka aplikasi di tab mandiri agar browser mengizinkan notifikasi.'}
              </p>
            </div>
          </div>

          {/* Quick Actions (Test Chime & Direct Tab) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleTestChimeAndPush}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#182a23] hover:bg-slate-200 dark:hover:bg-[#1f362c] text-slate-800 dark:text-emerald-200 transition-colors border border-slate-200 dark:border-emerald-800/40 cursor-pointer shadow-xs"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{testSent ? 'Bunyi & Notif Dikirim!' : 'Uji Bunyi Lonceng & Getar'}</span>
            </button>

            {isInIframe ? (
              <button
                onClick={handleOpenDirectTab}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru (Untuk Izin HP)</span>
              </button>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Minta Izin Browser Sekarang</span>
              </button>
            )}
          </div>

          {/* FAQ 1: Bagaimana Cara Kerjanya? */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e1713] border border-slate-200/80 dark:border-emerald-900/40 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-emerald-50">
              <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>1. Bagaimana cara kerja notifikasi ini?</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-emerald-300/80 leading-relaxed pl-5.5">
              Sistem menggunakan teknologi <strong>Web Push & Service Worker</strong> standar peramban. Begitu diaktifkan, sistem akan otomatis membunyikan nada lonceng institusi dan memunculkan pop-up di <em>Layar Kunci</em> atau <em>Notification Bar</em> perangkat asatidz saat:
            </p>
            <ul className="list-disc pl-9 text-[11px] text-slate-600 dark:text-emerald-300/80 space-y-0.5">
              <li>Mendekati jam mengajar / KBM (pengingat absen).</li>
              <li>Ada delegasi tugas <strong>Guru Badal</strong> dari Kepala Sekolah.</li>
              <li>Jurnal mengajar belum terisi setelah sesi KBM selesai.</li>
            </ul>
          </div>

          {/* FAQ 2: Apakah Harus di HP? */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e1713] border border-slate-200/80 dark:border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-emerald-50">
              <Monitor className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>2. Apakah harus di HP? (Kompatibilitas Perangkat)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-emerald-300/80 leading-relaxed pl-5.5">
              <strong>Tidak harus di HP.</strong> Fitur ini bekerja di seluruh platform:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 pl-2">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#14231d] border border-slate-200 dark:border-emerald-800/30">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-emerald-100">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>HP Android</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-emerald-400/70 mt-1">
                  Buka di Chrome/Edge, klik "Izinkan" saat diminta.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#14231d] border border-slate-200 dark:border-emerald-800/30">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-emerald-100">
                  <Apple className="w-3.5 h-3.5 text-slate-700 dark:text-emerald-300" />
                  <span>iPhone / iPad</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-emerald-400/70 mt-1">
                  Buka di Safari &rarr; tombol Share &rarr; <em>"Tambah ke Layar Utama" (PWA)</em>.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#14231d] border border-slate-200 dark:border-emerald-800/30">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-emerald-100">
                  <Monitor className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Laptop / PC</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-emerald-400/70 mt-1">
                  Chrome, Edge, macOS Safari, Windows Desktop.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ 3: Catatan Preview Iframe */}
          {isInIframe && (
            <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-sky-900 dark:text-sky-200">
              <p className="font-semibold text-[11px]">Catatan Pratinjau (Iframe Preview):</p>
              <p className="text-[10px] mt-0.5 leading-relaxed">
                Browser membatasi permintaan izin notifikasi asli jika berada di dalam frame pratinjau editor. Silakan klik tombol <strong>"Buka di Tab Baru"</strong> di atas untuk membuka aplikasi secara mandiri.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-emerald-900/30 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-[#0e1713]/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-[#182a23] hover:bg-slate-300 dark:hover:bg-[#1f362c] text-slate-800 dark:text-emerald-200 transition-colors cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

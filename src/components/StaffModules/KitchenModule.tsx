import React, { useState, useEffect } from 'react';
import { useHRIS } from '../../context/HRISContext';
import { Utensils, CheckCircle, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { StaffExpenseForm } from './StaffExpenseForm';
import { StaffJournalForm } from './StaffJournalForm';
import { validateAttendanceLocation, LocationValidationResult } from '../../utils/geoUtils';

interface KitchenModuleProps {
  showJournalAndExpense?: boolean;
}

export const KitchenModule: React.FC<KitchenModuleProps> = ({ showJournalAndExpense = true }) => {
  const { currentUser, geofenceSettings } = useHRIS();
  const [isPresent, setIsPresent] = useState(false);
  const [hasClockedInToday, setHasClockedInToday] = useState(false);
  const [menuToday, setMenuToday] = useState('');
  const [menuTomorrow, setMenuTomorrow] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // GPS state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

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
        setGpsError('Izin lokasi tidak aktif atau tidak terdeteksi.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, [currentUser?.id]);

  const hasGps = userLat !== null && userLng !== null;
  const locationValidation: LocationValidationResult = validateAttendanceLocation(
    userLat,
    userLng,
    geofenceSettings,
    false
  );
  
  const isGpsRequiredMissing = !hasGps || isLocating;
  const isOutsideRadius = hasGps && !locationValidation.isValid;

  const handleAbsenMasuk = () => {
    if (hasClockedInToday) {
      alert("Anda sudah melakukan absensi hari ini!");
      return;
    }
    if (isGpsRequiredMissing) {
      alert("Tidak dapat absen. Pastikan GPS aktif dan terdeteksi.");
      return;
    }
    if (isOutsideRadius) {
      alert("Tidak dapat absen. Anda berada di luar wilayah pesantren.");
      return;
    }
    
    setIsPresent(true);
    setHasClockedInToday(true);
    toast.success('Bismillah, Absen Masuk Berhasil (Staff Dapur)');
  };

  const handleAbsenPulang = () => {
    setIsPresent(false);
    toast.info('Alhamdulillah, Absen Pulang Berhasil Tercatat');
  };

  const handleSaveMenu = () => {
    setIsSaved(true);
    toast.success('Laporan Menu harian berhasil disimpan sementara untuk sesi ini.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Presensi Kehadiran Card */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200/80 dark:border-emerald-900/40 shadow-xs p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-emerald-50">Presensi Dapur</h3>
            </div>
          </div>

          {/* Lokasi Status */}
          <div className="mb-4 space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Lokasi Anda</span>
               <button onClick={detectLocation} className="text-[10px] flex items-center gap-1 text-emerald-600 cursor-pointer hover:underline">
                 <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                 Segarkan
               </button>
             </div>
             {isLocating ? (
               <div className="p-2 text-xs text-center text-slate-500 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Mendeteksi GPS...</div>
             ) : gpsError || !hasGps ? (
               <div className="p-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded flex gap-2 items-start">
                 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> 
                 <span>{gpsError || 'Lokasi tidak terdeteksi'}</span>
               </div>
             ) : isOutsideRadius ? (
               <div className="p-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded flex gap-2 items-start">
                 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> 
                 <span>Luar Radius ({locationValidation.distanceMeters}m dari pusat)</span>
               </div>
             ) : (
               <div className="p-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded flex gap-2 items-center">
                 <CheckCircle className="w-4 h-4 shrink-0" /> 
                 <span>Di Area Pesantren ({locationValidation.distanceMeters}m)</span>
               </div>
             )}
          </div>

          {!isPresent ? (
            <button 
              onClick={handleAbsenMasuk}
              disabled={isGpsRequiredMissing || isOutsideRadius || hasClockedInToday}
              className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 ${
                isGpsRequiredMissing || isOutsideRadius || hasClockedInToday 
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed' 
                  : 'bg-[#065f46] hover:bg-[#044e3a] text-white active:scale-95 cursor-pointer'
              }`}
            >
              <MapPin className={`w-4 h-4 ${isGpsRequiredMissing || isOutsideRadius || hasClockedInToday ? 'text-slate-400' : 'text-amber-300'}`} />
              <span>{hasClockedInToday ? 'Sudah Absen Hari Ini' : 'Absen Masuk'}</span>
            </button>
          ) : (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 text-center">
              <div className="mx-auto w-9 h-9 bg-emerald-100 dark:bg-emerald-900/60 rounded-full flex items-center justify-center mb-1.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">Hadir Berdinas</h4>
              <button 
                onClick={handleAbsenPulang}
                className="mt-3 w-full py-1.5 bg-white dark:bg-[#16201b] border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold rounded-lg text-xs transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 hover:border-rose-300 cursor-pointer"
              >
                Absen Pulang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sajian Menu Card */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-[#121f1a] rounded-2xl border border-slate-200/80 dark:border-emerald-900/40 shadow-xs p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/40 shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-emerald-50 text-sm">Sajian Menu Konsumsi</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daftar Menu Hari Ini (Pagi, Siang, Malam)
              </label>
              <textarea
                value={menuToday}
                onChange={(e) => setMenuToday(e.target.value)}
                disabled={!isPresent}
                placeholder="Contoh: Pagi: Nasi Uduk & Telur | Siang: Sayur Sop & Ayam Goreng | Malam: Soto Daging"
                className="w-full bg-slate-50 dark:bg-[#0c1813] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-slate-200 min-h-[75px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rencana Menu Besok / Permintaan Belanja Bahan
              </label>
              <textarea
                value={menuTomorrow}
                onChange={(e) => setMenuTomorrow(e.target.value)}
                disabled={!isPresent}
                placeholder="Contoh: Rencana: Pecel Lele, Sayur Asem | Belanja: Beras 50kg, Minyak Goreng 10L"
                className="w-full bg-slate-50 dark:bg-[#0c1813] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-slate-200 min-h-[75px]"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={handleSaveMenu}
                disabled={!isPresent || (!menuToday && !menuTomorrow)}
                className="px-4 py-2 bg-[#065f46] hover:bg-[#044e3a] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-amber-300" /> 
                <span>{isSaved ? 'Perbarui Menu' : 'Simpan Menu'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showJournalAndExpense && (
        <>
          <div className="lg:col-span-3">
            <StaffJournalForm category="DAPUR" />
          </div>
          <div className="lg:col-span-3">
            <StaffExpenseForm category="DAPUR" />
          </div>
        </>
      )}
    </div>
  );
};

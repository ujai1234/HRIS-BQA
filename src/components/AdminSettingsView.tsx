import React, { useState, useEffect } from 'react';
import { MapPin, Save, RotateCcw, Crosshair, Check, Map } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { GeofenceSettings, DEFAULT_GEOFENCE_SETTINGS } from '../types';
import { InteractiveMapPreview } from './InteractiveMapPreview';
import { toast } from 'sonner';

const RADIUS_OPTIONS = [50, 100, 150, 200, 300, 500];

export const AdminSettingsView: React.FC = () => {
  const { geofenceSettings, updateGeofenceSettings, logActivity } = useHRIS();

  const [radiusMeters, setRadiusMeters] = useState<number>(geofenceSettings?.radiusMeters || 150);
  const [latitude, setLatitude] = useState<number>(geofenceSettings?.latitude || -6.589250);
  const [longitude, setLongitude] = useState<number>(geofenceSettings?.longitude || 106.792880);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (geofenceSettings) {
      setRadiusMeters(geofenceSettings.radiusMeters || 150);
      setLatitude(geofenceSettings.latitude || -6.589250);
      setLongitude(geofenceSettings.longitude || 106.792880);
    }
  }, [geofenceSettings]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolokasi GPS.');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setIsDetecting(false);
        toast.success(`Koordinat pusat diperbarui: ${lat}, ${lng}`);
      },
      (err) => {
        setIsDetecting(false);
        toast.error(`Gagal mendeteksi GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateGeofenceSettings({
        name: "Wilayah Baitul Qur'an Al-Ikhwan",
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
        strictMode: true,
        enableMockBypass: false,
      });

      if (success) {
        logActivity(
          'UPDATE_GEOFENCE',
          'SYSTEM',
          `Admin mengatur radius presensi pesantren menjadi ${radiusMeters} meter.`,
          'INFO'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRadiusMeters(DEFAULT_GEOFENCE_SETTINGS.radiusMeters);
    setLatitude(DEFAULT_GEOFENCE_SETTINGS.latitude);
    setLongitude(DEFAULT_GEOFENCE_SETTINGS.longitude);
    toast.info('Radius dikembalikan ke standar (150 meter).');
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Pengaturan Radius Presensi
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Tentukan batas jarak maksimal bagi guru untuk melakukan presensi di lingkungan pesantren.
        </p>
      </div>

      {/* Main Setting Card */}
      <div className="bg-white dark:bg-[#0f1714] rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-xs">
        
        {/* Wilayah Pesantren Info */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Wilayah Absen
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              Baitul Qur'an Al-Ikhwan
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Guru wajib menyalakan GPS smartphone saat presensi.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Status Validasi
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Wajib di Lokasi
            </span>
          </div>
        </div>

        {/* Radius Setting */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Radius Toleransi
            </label>
            <span className="text-sm font-semibold font-mono text-emerald-700 dark:text-emerald-400">
              {radiusMeters} Meter
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {RADIUS_OPTIONS.map((r) => {
              const isSelected = radiusMeters === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusMeters(r)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {r}m
                </button>
              );
            })}
          </div>

          {/* Slider */}
          <input
            type="range"
            min="20"
            max="1000"
            step="10"
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-700 mt-2"
          />
        </div>

        {/* Interactive Map Radius Visualization */}
        <div className="pt-2">
          <InteractiveMapPreview
            latitude={latitude}
            longitude={longitude}
            radiusMeters={radiusMeters}
            onLocationChange={(newLat, newLng) => {
              setLatitude(newLat);
              setLongitude(newLng);
              toast.info(`Titik koordinat diperbarui via peta: ${newLat}, ${newLng}`);
            }}
          />
        </div>

        {/* Toggle Advanced Coordinates */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowAdvancedCoords(!showAdvancedCoords)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium cursor-pointer"
          >
            {showAdvancedCoords ? 'Sembunyikan Koordinat Titik Pusat' : 'Ubah Titik Koordinat Pusat Pesantren'}
          </button>

          {showAdvancedCoords && (
            <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetecting}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                  <span>{isDetecting ? 'Mendeteksi...' : 'Gunakan Titik Saat Ini'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar (150m)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

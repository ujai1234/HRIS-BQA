export * from '../services/geofenceService';
import { GeofenceSettings, DEFAULT_GEOFENCE_SETTINGS } from '../types';

/**
 * Calculates the great-circle distance between two GPS points using the Haversine formula.
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Rounded to nearest meter
}

export interface LocationValidationResult {
  isValid: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  targetLocationName: string;
  isMockBypass: boolean;
  message: string;
  statusType: 'SUCCESS' | 'OUT_OF_RADIUS' | 'GPS_UNAVAILABLE' | 'BYPASS_ACTIVE';
}

/**
 * Validates a user's GPS coordinates against the configured geofence settings.
 */
export function validateAttendanceLocation(
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  settings: GeofenceSettings = DEFAULT_GEOFENCE_SETTINGS,
  isMockBypassed: boolean = false
): LocationValidationResult {
  if (isMockBypassed && settings.enableMockBypass) {
    return {
      isValid: true,
      distanceMeters: 0,
      allowedRadiusMeters: settings.radiusMeters,
      targetLocationName: settings.name,
      isMockBypass: true,
      message: 'Mode simulasi/bypass lokasi aktif untuk pengujian presensi.',
      statusType: 'BYPASS_ACTIVE',
    };
  }

  if (userLat === null || userLat === undefined || userLng === null || userLng === undefined) {
    return {
      isValid: !settings.strictMode,
      distanceMeters: 0,
      allowedRadiusMeters: settings.radiusMeters,
      targetLocationName: settings.name,
      isMockBypass: false,
      message: 'Sinyal GPS belum terdeteksi dari perangkat.',
      statusType: 'GPS_UNAVAILABLE',
    };
  }

  const distanceMeters = calculateHaversineDistance(
    userLat,
    userLng,
    settings.latitude,
    settings.longitude
  );

  const isWithinRadius = distanceMeters <= settings.radiusMeters;

  if (isWithinRadius) {
    return {
      isValid: true,
      distanceMeters,
      allowedRadiusMeters: settings.radiusMeters,
      targetLocationName: settings.name,
      isMockBypass: false,
      message: `Lokasi terverifikasi! Berada ${distanceMeters}m dari titik pusat (${settings.name}).`,
      statusType: 'SUCCESS',
    };
  }

  return {
    isValid: !settings.strictMode,
    distanceMeters,
    allowedRadiusMeters: settings.radiusMeters,
    targetLocationName: settings.name,
    isMockBypass: false,
    message: `Di luar radius! Anda berada ${distanceMeters}m dari titik pusat (Maksimal ${settings.radiusMeters}m).`,
    statusType: 'OUT_OF_RADIUS',
  };
}

export interface GeofencePreset {
  id: string;
  name: string;
  unit: string;
  latitude: number;
  longitude: number;
  recommendedRadius: number;
  description: string;
}

export const PESANTREN_LOCATION_PRESETS: GeofencePreset[] = [
  {
    id: 'central_campus',
    name: "Baitul Qur'an Al-Ikhwan (Kampus Utama)",
    unit: 'Semua Unit',
    latitude: -6.589250,
    longitude: 106.792880,
    recommendedRadius: 150,
    description: 'Titik pusat kantor administrasi, gerbang utama, dan aula serbaguna.',
  },
  {
    id: 'smp_unit',
    name: 'Gedung KBM SMP IT Al-Ikhwan',
    unit: 'SMP',
    latitude: -6.589410,
    longitude: 106.793120,
    recommendedRadius: 100,
    description: 'Gedung KBM kelas VII - IX SMP dan laboratorium sains.',
  },
  {
    id: 'ma_unit',
    name: 'Gedung KBM MA Plus Al-Ikhwan',
    unit: 'MA',
    latitude: -6.589120,
    longitude: 106.792650,
    recommendedRadius: 100,
    description: 'Kompleks kelas X - XII MA dan laboratorium bahasa.',
  },
  {
    id: 'tahfidz_asrama',
    name: 'Masjid Jami & Kompleks Asrama Tahfidz',
    unit: 'Pesantren',
    latitude: -6.589550,
    longitude: 106.792400,
    recommendedRadius: 120,
    description: 'Pusat halaqah tahfidz Al-Qur\'an, asrama santri, dan masjid pesantren.',
  },
];

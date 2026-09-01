import { GeofenceSettings, DEFAULT_GEOFENCE_SETTINGS } from '../types';

/**
 * Result structure returned after verifying a user's location against the Pesantren geofence.
 */
export interface GeofenceVerificationResult {
  /** True if the user is inside the allowed radius (or if bypass is enabled) */
  isValid: boolean;
  /** True strictly based on geometric Haversine distance <= radiusMeters */
  isWithinRadius: boolean;
  /** Computed distance in meters between user GPS and central Pesantren coordinate */
  distanceMeters: number | null;
  /** Allowed radius in meters configured by the Admin in the database */
  allowedRadiusMeters: number;
  /** Name of the target pesantren location */
  targetLocationName: string;
  /** User's resolved coordinates (if successfully obtained from browser) */
  userCoordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  /** Database-stored central Pesantren coordinates */
  pesantrenCoordinates: {
    latitude: number;
    longitude: number;
  };
  /** Status code indicating outcome */
  status: 
    | 'IN_RANGE' 
    | 'OUT_OF_RANGE' 
    | 'PERMISSION_DENIED' 
    | 'POSITION_UNAVAILABLE' 
    | 'TIMEOUT' 
    | 'UNSUPPORTED' 
    | 'BYPASS_ACTIVE'
    | 'FETCH_ERROR';
  /** Human-readable status message */
  message: string;
  /** Timestamp of verification */
  verifiedAt: string;
}

export interface VerifyLocationOptions {
  /** Optional custom GeofenceSettings. If omitted, fetched directly from database API */
  geofenceSettings?: GeofenceSettings;
  /** High accuracy setting for browser GPS (defaults to true) */
  enableHighAccuracy?: boolean;
  /** Timeout in ms for GPS request (defaults to 10000ms) */
  timeout?: number;
  /** Maximum cached age in ms (defaults to 0 for fresh GPS fix) */
  maximumAge?: number;
  /** Whether to bypass distance check if mock mode is allowed in settings */
  allowMockBypass?: boolean;
}

/**
 * Calculates the great-circle distance between two GPS coordinates using the Haversine formula.
 *
 * Formula:
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2( √a, √(1−a) )
 * d = R ⋅ c
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters (rounded to nearest integer)
 */
export function computeHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000; // 6,371 km in meters
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Fetches the latest Pesantren geofence settings from the backend database API.
 */
export async function fetchPesantrenGeofenceSettings(): Promise<GeofenceSettings> {
  try {
    const response = await fetch('/api/settings/geofence');
    if (!response.ok) {
      throw new Error(`Failed to fetch geofence settings: HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      id: data.id || 'default_geofence',
      name: data.name || DEFAULT_GEOFENCE_SETTINGS.name,
      latitude: Number(data.latitude ?? DEFAULT_GEOFENCE_SETTINGS.latitude),
      longitude: Number(data.longitude ?? DEFAULT_GEOFENCE_SETTINGS.longitude),
      radiusMeters: Number(data.radiusMeters ?? DEFAULT_GEOFENCE_SETTINGS.radiusMeters),
      strictMode: Boolean(data.strictMode ?? true),
      enableMockBypass: Boolean(data.enableMockBypass ?? false),
      addressNotes: data.addressNotes || '',
      updatedAt: data.updatedAt || new Date().toISOString(),
      updatedBy: data.updatedBy || 'Administrator',
    };
  } catch (error) {
    console.warn('[GeofenceService] Using fallback geofence settings due to network error:', error);
    return DEFAULT_GEOFENCE_SETTINGS;
  }
}

/**
 * Retrieves the user's current GPS position using the browser's Geolocation API.
 * Returns a Promise that resolves with GeolocationCoordinates or rejects with a descriptive error.
 */
export function getBrowserCurrentPosition(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      reject({
        code: 0,
        message: 'Browser atau perangkat tidak mendukung Geolocation API.',
        type: 'UNSUPPORTED' as const,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position.coords);
      },
      (error) => {
        let type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN' = 'UNKNOWN';
        let customMessage = error.message;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            type = 'PERMISSION_DENIED';
            customMessage = 'Izin akses lokasi ditolak. Harap izinkan akses lokasi pada browser/smartphone Anda.';
            break;
          case error.POSITION_UNAVAILABLE:
            type = 'POSITION_UNAVAILABLE';
            customMessage = 'Lokasi tidak dapat ditentukan. Pastikan GPS smartphone telah aktif.';
            break;
          case error.TIMEOUT:
            type = 'TIMEOUT';
            customMessage = 'Waktu permintaan lokasi habis. Silakan muat ulang sinyal GPS.';
            break;
        }

        reject({
          code: error.code,
          message: customMessage,
          type,
        });
      },
      options
    );
  });
}

/**
 * Validates whether given coordinates fall within the geofence radius.
 */
/**
 * Pre-check status of device GPS and browser location permission.
 */
export type GpsPreCheckState = 
  | 'READY'          // GPS available and location accessible
  | 'PERMISSION_BLOCKED' // User explicitly denied location permission in browser
  | 'LOCATION_DISABLED'  // Hardware GPS is turned off on device or unavailable
  | 'PROMPT_NEEDED'      // Browser hasn't asked or requires user interaction
  | 'UNSUPPORTED';       // Browser lacks Geolocation API

export interface GpsPreCheckResult {
  state: GpsPreCheckState;
  message: string;
  coords?: GeolocationCoordinates;
}

/**
 * Runs a polite, quick pre-check to verify if device GPS is active and allowed.
 */
export async function preCheckDeviceGps(): Promise<GpsPreCheckResult> {
  if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
    return {
      state: 'UNSUPPORTED',
      message: 'Perangkat atau browser tidak mendukung layanan lokasi GPS.',
    };
  }

  // Check Permissions API if supported in modern browsers
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' });
      if (perm.state === 'denied') {
        return {
          state: 'PERMISSION_BLOCKED',
          message: 'Izin akses lokasi sedang diblokir pada browser ini.',
        };
      }
    } catch {
      // Some browsers don't support geolocation permission query, fallback to active test
    }
  }

  // Test fast GPS ping with a gentle timeout
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          state: 'READY',
          message: 'Sinyal GPS aktif dan lokasi terverifikasi.',
          coords: pos.coords,
        });
      },
      (err) => {
        if (err.code === 1) { // PERMISSION_DENIED
          resolve({
            state: 'PERMISSION_BLOCKED',
            message: 'Izin lokasi belum diberikan atau diblokir di browser.',
          });
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          resolve({
            state: 'LOCATION_DISABLED',
            message: 'GPS smartphone belum aktif atau sinyal satelit tidak terdeteksi.',
          });
        } else {
          resolve({
            state: 'LOCATION_DISABLED',
            message: 'Waktu tunggu lokasi habis. Pastikan GPS aktif.',
          });
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}


/**
 * Service layer function that executes the full end-to-end GPS validation workflow:
 * 1. Resolves geofence settings from the database (or uses provided instance)
 * 2. Queries the browser's Geolocation API for the user's current GPS coordinates
 * 3. Computes the Haversine distance to the central Pesantren coordinates
 * 4. Validates if the user is inside the admin-defined radius
 * 5. Returns a structured verification report.
 *
 * @param options Optional configuration parameters
 * @returns Promise<GeofenceVerificationResult>
 */
export async function verifyUserLocationAgainstPesantren(
  options: VerifyLocationOptions = {}
): Promise<GeofenceVerificationResult> {
  const nowIso = new Date().toISOString();

  // 1. Fetch or resolve geofence settings from DB
  let settings: GeofenceSettings;
  try {
    settings = options.geofenceSettings || (await fetchPesantrenGeofenceSettings());
  } catch (err) {
    settings = DEFAULT_GEOFENCE_SETTINGS;
  }

  const baseResult: Omit<GeofenceVerificationResult, 'isValid' | 'isWithinRadius' | 'distanceMeters' | 'userCoordinates' | 'status' | 'message'> = {
    allowedRadiusMeters: settings.radiusMeters,
    targetLocationName: settings.name,
    pesantrenCoordinates: {
      latitude: settings.latitude,
      longitude: settings.longitude,
    },
    verifiedAt: nowIso,
  };

  // Check if mock bypass is active and requested
  if (options.allowMockBypass && settings.enableMockBypass) {
    return {
      ...baseResult,
      isValid: true,
      isWithinRadius: true,
      distanceMeters: 0,
      userCoordinates: {
        latitude: settings.latitude,
        longitude: settings.longitude,
        accuracy: 5,
      },
      status: 'BYPASS_ACTIVE',
      message: 'Mode bypass lokasi aktif untuk simulasi presensi.',
    };
  }

  // 2. Request user GPS coordinates via Browser Geolocation API
  let coords: GeolocationCoordinates;
  try {
    coords = await getBrowserCurrentPosition({
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 0,
    });
  } catch (geoError: any) {
    const errorType = geoError?.type || 'POSITION_UNAVAILABLE';
    const errorMessage = geoError?.message || 'Gagal membaca koordinat GPS perangkat.';

    return {
      ...baseResult,
      isValid: !settings.strictMode, // If not strict, allow through with warning
      isWithinRadius: false,
      distanceMeters: null,
      userCoordinates: null,
      status: errorType,
      message: errorMessage,
    };
  }

  // 3. Compute Haversine distance between user GPS and DB central Pesantren point
  const userLat = coords.latitude;
  const userLng = coords.longitude;
  const distanceMeters = computeHaversineDistance(
    userLat,
    userLng,
    settings.latitude,
    settings.longitude
  );

  // 4. Validate if within admin-configured radius
  const isWithinRadius = distanceMeters <= settings.radiusMeters;
  const isValid = isWithinRadius || (!settings.strictMode);

  return {
    ...baseResult,
    isValid,
    isWithinRadius,
    distanceMeters,
    userCoordinates: {
      latitude: userLat,
      longitude: userLng,
      accuracy: coords.accuracy,
    },
    status: isWithinRadius ? 'IN_RANGE' : 'OUT_OF_RANGE',
    message: isWithinRadius
      ? `Lokasi terverifikasi di wilayah pesantren (${distanceMeters}m dari titik pusat, radius maks ${settings.radiusMeters}m).`
      : `Di luar wilayah pesantren! Anda berjarak ${distanceMeters}m dari titik pusat (batas maksimal radius adalah ${settings.radiusMeters}m).`,
  };
}

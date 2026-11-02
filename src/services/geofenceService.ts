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

export interface AccuratePositionOptions {
  /** Target accuracy in meters to immediately accept (default: 25m) */
  targetAccuracyMeters?: number;
  /** Max time to wait for a better fix in ms before accepting best sample (default: 5000ms) */
  maxWaitMs?: number;
  /** Hard timeout before giving up if no GPS signal in ms (default: 10000ms) */
  timeoutMs?: number;
  /** Callback fired whenever a new satellite sample is received */
  onProgress?: (coords: GeolocationCoordinates, currentAccuracy: number) => void;
}

/**
 * High-precision GPS acquisition helper:
 * Continuously watches GPS coordinates for a few seconds to let hardware satellite lock occur,
 * automatically filtering out coarse cell tower/Wi-Fi triangulations.
 */
export function getAccurateCurrentPosition(
  options: AccuratePositionOptions = {}
): Promise<GeolocationCoordinates> {
  const targetAccuracy = options.targetAccuracyMeters ?? 25;
  const maxWaitMs = options.maxWaitMs ?? 5000;
  const timeoutMs = options.timeoutMs ?? 10000;
  const onProgress = options.onProgress;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      reject({
        code: 0,
        message: 'Browser atau perangkat tidak mendukung Geolocation API.',
        type: 'UNSUPPORTED' as const,
      });
      return;
    }

    let bestCoords: GeolocationCoordinates | null = null;
    let watchId: number | null = null;
    let isSettled = false;
    let settleTimer: any = null;
    let hardTimeoutTimer: any = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
      if (hardTimeoutTimer) {
        clearTimeout(hardTimeoutTimer);
        hardTimeoutTimer = null;
      }
    };

    const finishSuccess = (coords: GeolocationCoordinates) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve(coords);
    };

    const finishError = (error: any) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(error);
    };

    hardTimeoutTimer = setTimeout(() => {
      if (bestCoords) {
        finishSuccess(bestCoords);
      } else {
        finishError({
          code: 3,
          message: 'Waktu permintaan lokasi habis. Pastikan GPS aktif dan berada di area terbuka.',
          type: 'TIMEOUT' as const,
        });
      }
    }, timeoutMs);

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = pos.coords;
          const accuracy = coords.accuracy ?? 999;

          if (onProgress) {
            onProgress(coords, accuracy);
          }

          if (!bestCoords || accuracy < (bestCoords.accuracy ?? 999)) {
            bestCoords = coords;
          }

          if (accuracy <= targetAccuracy) {
            finishSuccess(coords);
            return;
          }

          if (!settleTimer) {
            settleTimer = setTimeout(() => {
              if (bestCoords) {
                finishSuccess(bestCoords);
              }
            }, maxWaitMs);
          }
        },
        (err) => {
          if (bestCoords) {
            finishSuccess(bestCoords);
          } else {
            navigator.geolocation.getCurrentPosition(
              (pos) => finishSuccess(pos.coords),
              (fallbackErr) => {
                let customMessage = 'Lokasi tidak dapat ditentukan. Pastikan GPS smartphone telah aktif.';
                if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
                  customMessage = 'Izin akses lokasi ditolak. Harap izinkan akses lokasi (pilih Akurat/Tepat) pada browser Anda.';
                } else if (fallbackErr.code === fallbackErr.TIMEOUT) {
                  customMessage = 'Waktu permintaan lokasi habis. Silakan muat ulang sinyal GPS.';
                }
                finishError({
                  code: fallbackErr.code,
                  message: customMessage,
                  type: fallbackErr.code === 1 ? 'PERMISSION_DENIED' : fallbackErr.code === 3 ? 'TIMEOUT' : 'POSITION_UNAVAILABLE'
                });
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 0,
        }
      );
    } catch {
      navigator.geolocation.getCurrentPosition(
        (pos) => finishSuccess(pos.coords),
        (err) => finishError(err),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
      );
    }
  });
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
  return getAccurateCurrentPosition({
    timeoutMs: options.timeout,
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

  // 4. Validate if within admin-configured radius (with accuracy tolerance)
  const MAX_ACCURACY_DISCOUNT = 60;
  const accuracyDiscount = coords.accuracy ? Math.min(Math.round(coords.accuracy), MAX_ACCURACY_DISCOUNT) : 0;
  const effectiveDistanceMeters = Math.max(0, distanceMeters - accuracyDiscount);

  const isWithinRadius = effectiveDistanceMeters <= settings.radiusMeters;
  const isValid = isWithinRadius || (!settings.strictMode);

  const accuracyNote = coords.accuracy ? ` (toleransi akurasi ±${Math.round(coords.accuracy)}m)` : '';

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
      ? `Lokasi terverifikasi di wilayah pesantren (${distanceMeters}m dari titik pusat, radius maks ${settings.radiusMeters}m)${accuracyNote}.`
      : `Di luar wilayah pesantren! Anda berjarak ${distanceMeters}m dari titik pusat (batas maksimal radius adalah ${settings.radiusMeters}m).`,
  };
}

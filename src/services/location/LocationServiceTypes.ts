import type { RidePoint } from '@/src/domain/ride';

/**
 * Foreground location permission state used by UI and services.
 */
export type ForegroundLocationPermissionState = 'unknown' | 'granted' | 'denied' | 'unavailable';

/**
 * Normalized foreground location permission result.
 */
export type ForegroundLocationPermissionResult = {
  readonly state: ForegroundLocationPermissionState;
  readonly canAskAgain: boolean;
  readonly servicesEnabled?: boolean;
};

/**
 * Normalized location update for ride recording.
 */
export type LocationRidePoint = RidePoint;

/**
 * Callback invoked when foreground location tracking receives a point.
 */
export type LocationUpdateHandler = (point: LocationRidePoint) => void;

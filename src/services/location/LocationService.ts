import * as Location from 'expo-location';

import type { RidePoint } from '@/src/domain/ride';
import { calculateCoordinateDistanceKm } from '@/src/features/ride-engine';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

import type {
  ForegroundLocationPermissionResult,
  LocationRidePoint,
  LocationUpdateHandler,
} from './LocationServiceTypes';

/**
 * Foreground-only Expo Location adapter.
 *
 * Background tracking is intentionally out of scope. This service owns Expo
 * Location API calls and converts updates into RidePoint-compatible data.
 */
export class LocationService extends BaseService {
  private subscription: Location.LocationSubscription | null = null;
  private previousSpeedPoint: RidePoint | null = null;
  private recentSpeedsKmh: number[] = [];
  private lastAcceptedSpeedKph: number | null = null;
  private lastMovementTimestampMs: number | null = null;
  private pendingJumpSpeedKph: number | null = null;
  private pendingJumpCount = 0;

  constructor(context: ServiceContext) {
    super(context);
  }

  async requestForegroundPermission(): Promise<ServiceResult<ForegroundLocationPermissionResult>> {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) return this.success({ state: 'unavailable', canAskAgain: false, servicesEnabled: false });
      const permission = await Location.requestForegroundPermissionsAsync();
      return this.success({
        state: permission.granted ? 'granted' : 'denied',
        canAskAgain: permission.canAskAgain,
        servicesEnabled,
      });
    } catch (cause) {
      return this.failure({ code: 'unavailable', message: 'Location permission could not be checked.', cause });
    }
  }

  async getCurrentLocation(): Promise<ServiceResult<LocationRidePoint>> {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) return this.failure({ code: 'unavailable', message: 'Foreground location permission is required.' });
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      return this.success(this.toRidePoint(location));
    } catch (cause) {
      return this.failure({ code: 'unavailable', message: 'Your current location could not be determined.', cause });
    }
  }

  async watchLocation(onUpdate: LocationUpdateHandler): Promise<ServiceResult<ForegroundLocationPermissionResult>> {
    const permission = await Location.getForegroundPermissionsAsync();

    if (!permission.granted) {
      return this.success({
        state: 'denied',
        canAskAgain: permission.canAskAgain,
      });
    }

    this.subscription?.remove();
    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1000,
      },
      (location) => {
        onUpdate(this.toRidePoint(location));
      },
    );

    return this.success({
      state: 'granted',
      canAskAgain: permission.canAskAgain,
    });
  }

  async stopWatchingLocation(): Promise<ServiceResult<void>> {
    this.subscription?.remove();
    this.subscription = null;
    this.previousSpeedPoint = null;
    this.recentSpeedsKmh = [];
    this.lastAcceptedSpeedKph = null;
    this.lastMovementTimestampMs = null;
    this.pendingJumpSpeedKph = null;
    this.pendingJumpCount = 0;
    return this.success(undefined);
  }

  toRidePoint(location: Location.LocationObject): LocationRidePoint {
    const point = toRidePoint(location);
    const speedSample = calculateSpeedSample(this.previousSpeedPoint, point);
    const rawSpeedKph = toValidSpeedKph(location.coords.speed);
    const timestampMs = Date.parse(point.timestamp);

    if (!this.previousSpeedPoint) {
      this.previousSpeedPoint = point;
      this.lastMovementTimestampMs = timestampMs;
    }

    if (speedSample.hasSignificantMovement) {
      this.previousSpeedPoint = point;
      this.lastMovementTimestampMs = timestampMs;
    }

    let selectedSpeedKph = rawSpeedKph ?? speedSample.computedSpeedKph;

    if (
      selectedSpeedKph !== undefined &&
      this.lastAcceptedSpeedKph !== null &&
      selectedSpeedKph - this.lastAcceptedSpeedKph > MAX_INSTANT_SPEED_INCREASE_KMH
    ) {
      const confirmsPendingJump = this.pendingJumpSpeedKph !== null &&
        Math.abs(selectedSpeedKph - this.pendingJumpSpeedKph) <= PENDING_JUMP_TOLERANCE_KMH;
      this.pendingJumpCount = confirmsPendingJump ? this.pendingJumpCount + 1 : 1;
      this.pendingJumpSpeedKph = selectedSpeedKph;
      if (this.pendingJumpCount < REQUIRED_JUMP_CONFIRMATIONS) selectedSpeedKph = undefined;
    } else if (selectedSpeedKph !== undefined) {
      this.pendingJumpSpeedKph = null;
      this.pendingJumpCount = 0;
    }

    if (
      selectedSpeedKph === undefined &&
      this.lastMovementTimestampMs !== null &&
      timestampMs - this.lastMovementTimestampMs >= STOP_CONFIRMATION_MS
    ) {
      selectedSpeedKph = 0;
    }

    if (selectedSpeedKph === undefined) {
      return { ...point, speed: rollingAverage(this.recentSpeedsKmh) };
    }

    if (selectedSpeedKph > 0) this.lastMovementTimestampMs = timestampMs;
    this.lastAcceptedSpeedKph = selectedSpeedKph;
    this.recentSpeedsKmh = selectedSpeedKph === 0
      ? [0]
      : [...this.recentSpeedsKmh.slice(-(SPEED_ROLLING_WINDOW - 1)), selectedSpeedKph];
    const smoothedSpeedKph = rollingAverage(this.recentSpeedsKmh);

    return { ...point, speed: smoothedSpeedKph };
  }
}

export const MAX_VALID_SPEED_KMH = 120;
const MAX_INSTANT_SPEED_INCREASE_KMH = 40;
const SPEED_ROLLING_WINDOW = 5;
const MIN_SIGNIFICANT_DISTANCE_METERS = 2;
const STOP_CONFIRMATION_MS = 5_000;
const PENDING_JUMP_TOLERANCE_KMH = 15;
const REQUIRED_JUMP_CONFIRMATIONS = 2;

function toRidePoint(location: Location.LocationObject): RidePoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: normalizeOptionalNumber(location.coords.altitude),
    accuracy: normalizeOptionalNumber(location.coords.accuracy),
    heading: normalizeHeading(location.coords.heading),
    timestamp: new Date(location.timestamp).toISOString(),
  };
}

function calculateSpeedSample(previousPoint: RidePoint | null, currentPoint: RidePoint) {
  if (!previousPoint) {
    return { computedSpeedKph: undefined, hasSignificantMovement: false };
  }

  const timeDeltaSeconds = (Date.parse(currentPoint.timestamp) - Date.parse(previousPoint.timestamp)) / 1000;

  if (!Number.isFinite(timeDeltaSeconds) || timeDeltaSeconds <= 0) {
    return { computedSpeedKph: undefined, hasSignificantMovement: false };
  }

  const distanceMeters = calculateCoordinateDistanceKm(previousPoint, currentPoint) * 1000;

  if (!Number.isFinite(distanceMeters) || distanceMeters < MIN_SIGNIFICANT_DISTANCE_METERS) {
    return { computedSpeedKph: undefined, hasSignificantMovement: false };
  }

  const speedKph = (distanceMeters / timeDeltaSeconds) * 3.6;
  return {
    computedSpeedKph: speedKph <= MAX_VALID_SPEED_KMH ? speedKph : undefined,
    hasSignificantMovement: true,
  };
}

function toValidSpeedKph(speedMetersPerSecond: number | null) {
  if (typeof speedMetersPerSecond !== 'number' || !Number.isFinite(speedMetersPerSecond) || speedMetersPerSecond <= 0) {
    return undefined;
  }

  const speedKph = speedMetersPerSecond * 3.6;
  return speedKph <= MAX_VALID_SPEED_KMH ? speedKph : undefined;
}

function rollingAverage(speedsKmh: readonly number[]) {
  if (speedsKmh.length === 0) return 0;
  return speedsKmh.reduce((total, speed) => total + speed, 0) / speedsKmh.length;
}

function normalizeOptionalNumber(value: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeHeading(value: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(value, 360));
}

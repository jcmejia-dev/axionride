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
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 5,
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
    return this.success(undefined);
  }

  toRidePoint(location: Location.LocationObject): LocationRidePoint {
    const point = toRidePoint(location);
    const speedKph = calculateSpeedKph(this.previousSpeedPoint, point);
    const rawSpeedKph = toValidSpeedKph(location.coords.speed);
    const selectedSpeedKph = rawSpeedKph ?? speedKph;

    console.log({
      rawSpeed: location.coords.speed,
      computedSpeed: speedKph,
    });

    this.previousSpeedPoint = point;

    if (selectedSpeedKph === undefined) {
      this.recentSpeedsKmh = [];
      return { ...point, speed: 0 };
    }

    this.recentSpeedsKmh = [...this.recentSpeedsKmh.slice(-2), selectedSpeedKph];
    const smoothedSpeedKph = this.recentSpeedsKmh.reduce((total, speed) => total + speed, 0) / this.recentSpeedsKmh.length;

    return { ...point, speed: smoothedSpeedKph };
  }
}

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

function calculateSpeedKph(previousPoint: RidePoint | null, currentPoint: RidePoint) {
  if (!previousPoint) {
    return undefined;
  }

  const timeDeltaSeconds = (Date.parse(currentPoint.timestamp) - Date.parse(previousPoint.timestamp)) / 1000;

  if (!Number.isFinite(timeDeltaSeconds) || timeDeltaSeconds <= 0) {
    return undefined;
  }

  const distanceMeters = calculateCoordinateDistanceKm(previousPoint, currentPoint) * 1000;

  if (!Number.isFinite(distanceMeters) || distanceMeters < 2) {
    return undefined;
  }

  const speedKph = (distanceMeters / timeDeltaSeconds) * 3.6;
  return speedKph <= 180 ? speedKph : undefined;
}

function toValidSpeedKph(speedMetersPerSecond: number | null) {
  if (typeof speedMetersPerSecond !== 'number' || !Number.isFinite(speedMetersPerSecond) || speedMetersPerSecond <= 0) {
    return undefined;
  }

  const speedKph = speedMetersPerSecond * 3.6;
  return speedKph <= 180 ? speedKph : undefined;
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

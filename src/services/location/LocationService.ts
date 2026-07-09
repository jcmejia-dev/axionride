import * as Location from 'expo-location';

import type { RidePoint } from '@/src/domain/ride';
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

  constructor(context: ServiceContext) {
    super(context);
  }

  async requestForegroundPermission(): Promise<ServiceResult<ForegroundLocationPermissionResult>> {
    const permission = await Location.requestForegroundPermissionsAsync();

    return this.success({
      state: permission.granted ? 'granted' : 'denied',
      canAskAgain: permission.canAskAgain,
    });
  }

  async getCurrentLocation(): Promise<ServiceResult<LocationRidePoint>> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return this.success(toRidePoint(location));
  }

  async watchLocation(onUpdate: LocationUpdateHandler): Promise<ServiceResult<ForegroundLocationPermissionResult>> {
    const permission = await Location.getForegroundPermissionsAsync();

    if (!permission.granted) {
      return this.success({
        state: 'denied',
        canAskAgain: permission.canAskAgain,
      });
    }

    await this.stopWatchingLocation();
    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 5,
        timeInterval: 1000,
      },
      (location) => {
        onUpdate(toRidePoint(location));
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
    return this.success(undefined);
  }

  toRidePoint(location: Location.LocationObject): LocationRidePoint {
    return toRidePoint(location);
  }
}

function toRidePoint(location: Location.LocationObject): RidePoint {
  const speedKmh =
    typeof location.coords.speed === 'number' && Number.isFinite(location.coords.speed)
      ? Math.max(0, location.coords.speed * 3.6)
      : undefined;

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: normalizeOptionalNumber(location.coords.altitude),
    accuracy: normalizeOptionalNumber(location.coords.accuracy),
    speed: speedKmh,
    heading: normalizeHeading(location.coords.heading),
    timestamp: new Date(location.timestamp).toISOString(),
  };
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

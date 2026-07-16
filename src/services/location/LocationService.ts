import * as Location from "expo-location";

import type { RidePoint } from "@/src/domain/ride";
import { calculateCoordinateDistanceKm } from "@/src/features/ride-engine";
import { BaseService } from "@/src/services/BaseService";
import type { ServiceContext } from "@/src/services/ServiceContext";
import type { ServiceResult } from "@/src/services/ServiceTypes";

import type {
  ForegroundLocationPermissionResult,
  LocationRidePoint,
  LocationUpdateHandler,
} from "./LocationServiceTypes";

// --- Development logging control ---
const DEV_LOG_ENABLED = __DEV__;

function devLog(...args: unknown[]) {
  if (DEV_LOG_ENABLED) {
    console.log("[LocationService]", ...args);
  }
}

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

  /** Stationary detection state */
  private consecutiveStationarySamples = 0;
  private lastStationaryTimestampMs: number | null = null;

  constructor(context: ServiceContext) {
    super(context);
  }

  async requestForegroundPermission(): Promise<
    ServiceResult<ForegroundLocationPermissionResult>
  > {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled)
        return this.success({
          state: "unavailable",
          canAskAgain: false,
          servicesEnabled: false,
        });
      const permission = await Location.requestForegroundPermissionsAsync();
      return this.success({
        state: permission.granted ? "granted" : "denied",
        canAskAgain: permission.canAskAgain,
        servicesEnabled,
      });
    } catch (cause) {
      return this.failure({
        code: "unavailable",
        message: "Location permission could not be checked.",
        cause,
      });
    }
  }

  async getCurrentLocation(): Promise<ServiceResult<LocationRidePoint>> {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted)
        return this.failure({
          code: "unavailable",
          message: "Foreground location permission is required.",
        });
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      return this.success(this.toRidePoint(location));
    } catch (cause) {
      return this.failure({
        code: "unavailable",
        message: "Your current location could not be determined.",
        cause,
      });
    }
  }

  async watchLocation(
    onUpdate: LocationUpdateHandler,
  ): Promise<ServiceResult<ForegroundLocationPermissionResult>> {
    const permission = await Location.getForegroundPermissionsAsync();

    if (!permission.granted) {
      return this.success({
        state: "denied",
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
      state: "granted",
      canAskAgain: permission.canAskAgain,
    });
  }

  async stopWatchingLocation(): Promise<ServiceResult<void>> {
    this.subscription?.remove();
    this.subscription = null;
    this.resetSmoothingState();
    return this.success(undefined);
  }

  /**
   * Reset all smoothing, stationary, and jump-detection state.
   */
  private resetSmoothingState(): void {
    this.previousSpeedPoint = null;
    this.recentSpeedsKmh = [];
    this.lastAcceptedSpeedKph = null;
    this.lastMovementTimestampMs = null;
    this.pendingJumpSpeedKph = null;
    this.pendingJumpCount = 0;
    this.consecutiveStationarySamples = 0;
    this.lastStationaryTimestampMs = null;
  }

  toRidePoint(location: Location.LocationObject): LocationRidePoint {
    const point = toRidePoint(location);
    const speedSample = calculateSpeedSample(this.previousSpeedPoint, point);
    const rawSpeedKph = toValidSpeedKph(location.coords.speed);
    const timestampMs = Date.parse(point.timestamp);
    const accuracyMeters = point.accuracy;

    devLog("--- speed sample ---");
    devLog("native speed (m/s):", location.coords.speed);
    devLog("native speed (km/h):", rawSpeedKph);
    devLog("computed speed (km/h):", speedSample.computedSpeedKph);
    devLog("displacement (m):", speedSample.displacementMeters);
    devLog("accuracy (m):", accuracyMeters);
    devLog("hasSignificantMovement:", speedSample.hasSignificantMovement);

    if (!this.previousSpeedPoint) {
      this.previousSpeedPoint = point;
      this.lastMovementTimestampMs = timestampMs;
    }

    // --- Stationary detection ---
    const isPoorAccuracy =
      typeof accuracyMeters === "number" &&
      accuracyMeters > POOR_ACCURACY_THRESHOLD_METERS;
    const isDisplacementBelowDrift = !speedSample.hasSignificantMovement;
    const isNativeSpeedNull = rawSpeedKph === undefined;
    const isComputedSpeedBelowThreshold =
      speedSample.computedSpeedKph !== undefined &&
      speedSample.computedSpeedKph < STATIONARY_SPEED_THRESHOLD_KMH;

    let isLikelyStationary = false;

    // Stationary condition: poor accuracy with no movement, or native speed null
    // with no significant displacement, or computed speed below threshold
    if (isPoorAccuracy && isDisplacementBelowDrift) {
      isLikelyStationary = true;
    } else if (isNativeSpeedNull && isDisplacementBelowDrift) {
      isLikelyStationary = true;
    } else if (isComputedSpeedBelowThreshold && isDisplacementBelowDrift) {
      isLikelyStationary = true;
    }

    if (isLikelyStationary) {
      this.consecutiveStationarySamples += 1;
      if (this.lastStationaryTimestampMs === null) {
        this.lastStationaryTimestampMs = timestampMs;
      }
    } else {
      // Meaningful movement detected - reset stationary tracking
      if (speedSample.hasSignificantMovement) {
        this.consecutiveStationarySamples = 0;
        this.lastStationaryTimestampMs = null;
      }
    }

    devLog(
      "consecutive stationary samples:",
      this.consecutiveStationarySamples,
    );
    devLog(
      "stationary duration (ms):",
      this.lastStationaryTimestampMs !== null
        ? timestampMs - this.lastStationaryTimestampMs
        : 0,
    );

    if (speedSample.hasSignificantMovement) {
      this.previousSpeedPoint = point;
      this.lastMovementTimestampMs = timestampMs;
    }

    // --- Determine if we should force speed to 0 ---
    const isStationaryConfirmed =
      this.consecutiveStationarySamples >= REQUIRED_STATIONARY_SAMPLES;
    const stationaryDurationMs =
      this.lastStationaryTimestampMs !== null
        ? timestampMs - this.lastStationaryTimestampMs
        : 0;
    const stationaryDurationMet =
      stationaryDurationMs >= STATIONARY_DURATION_MS;

    const shouldForceStationary =
      isStationaryConfirmed && stationaryDurationMet;

    devLog(
      "shouldForceStationary:",
      shouldForceStationary,
      "(samples:",
      this.consecutiveStationarySamples,
      "/",
      REQUIRED_STATIONARY_SAMPLES,
      "duration:",
      stationaryDurationMs,
      "/",
      STATIONARY_DURATION_MS,
      "ms)",
    );

    if (shouldForceStationary) {
      // Force speed to exactly 0 and reset smoothing
      this.recentSpeedsKmh = [0];
      this.lastAcceptedSpeedKph = 0;
      this.lastMovementTimestampMs = null;
      this.pendingJumpSpeedKph = null;
      this.pendingJumpCount = 0;

      // Keep stationary sample count so we don't immediately revert
      devLog("final displayed speed: 0 km/h (STATIONARY)");
      return { ...point, speed: 0 };
    }

    // --- Normal speed calculation (when not stationary) ---
    let selectedSpeedKph = rawSpeedKph ?? speedSample.computedSpeedKph;

    if (
      selectedSpeedKph !== undefined &&
      this.lastAcceptedSpeedKph !== null &&
      selectedSpeedKph - this.lastAcceptedSpeedKph >
        MAX_INSTANT_SPEED_INCREASE_KMH
    ) {
      const confirmsPendingJump =
        this.pendingJumpSpeedKph !== null &&
        Math.abs(selectedSpeedKph - this.pendingJumpSpeedKph) <=
          PENDING_JUMP_TOLERANCE_KMH;
      this.pendingJumpCount = confirmsPendingJump
        ? this.pendingJumpCount + 1
        : 1;
      this.pendingJumpSpeedKph = selectedSpeedKph;
      if (this.pendingJumpCount < REQUIRED_JUMP_CONFIRMATIONS)
        selectedSpeedKph = undefined;
    } else if (selectedSpeedKph !== undefined) {
      this.pendingJumpSpeedKph = null;
      this.pendingJumpCount = 0;
    }

    // If still no valid speed and movement hasn't happened for a while, force 0
    if (
      selectedSpeedKph === undefined &&
      this.lastMovementTimestampMs !== null &&
      timestampMs - this.lastMovementTimestampMs >= STOP_CONFIRMATION_MS
    ) {
      selectedSpeedKph = 0;
    }

    if (selectedSpeedKph === undefined) {
      const averaged = rollingAverage(this.recentSpeedsKmh);
      devLog(
        "final displayed speed:",
        averaged,
        "km/h (rolling average fallback)",
      );
      return { ...point, speed: averaged };
    }

    if (selectedSpeedKph > 0) {
      this.lastMovementTimestampMs = timestampMs;
      // Reset stationary tracking on movement
      this.consecutiveStationarySamples = 0;
      this.lastStationaryTimestampMs = null;
    }

    this.lastAcceptedSpeedKph = selectedSpeedKph;
    this.recentSpeedsKmh =
      selectedSpeedKph === 0
        ? [0]
        : [
            ...this.recentSpeedsKmh.slice(-(SPEED_ROLLING_WINDOW - 1)),
            selectedSpeedKph,
          ];
    const smoothedSpeedKph = rollingAverage(this.recentSpeedsKmh);

    devLog("final displayed speed:", smoothedSpeedKph, "km/h");
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

// --- Stationary detection constants ---
/** Speed below which the rider is considered potentially stationary */
const STATIONARY_SPEED_THRESHOLD_KMH = 3;
/** Number of consecutive samples indicating stationary before confirmed */
const REQUIRED_STATIONARY_SAMPLES = 3;
/** Duration in ms that stationary must persist before forcing 0 */
const STATIONARY_DURATION_MS = 2_500;
/** Accuracy threshold in meters – above this, GPS is considered poor */
const POOR_ACCURACY_THRESHOLD_METERS = 20;

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

function calculateSpeedSample(
  previousPoint: RidePoint | null,
  currentPoint: RidePoint,
) {
  if (!previousPoint) {
    return {
      computedSpeedKph: undefined,
      hasSignificantMovement: false,
      displacementMeters: 0,
    };
  }

  const timeDeltaSeconds =
    (Date.parse(currentPoint.timestamp) - Date.parse(previousPoint.timestamp)) /
    1000;

  if (!Number.isFinite(timeDeltaSeconds) || timeDeltaSeconds <= 0) {
    return {
      computedSpeedKph: undefined,
      hasSignificantMovement: false,
      displacementMeters: 0,
    };
  }

  const distanceMeters =
    calculateCoordinateDistanceKm(previousPoint, currentPoint) * 1000;

  if (
    !Number.isFinite(distanceMeters) ||
    distanceMeters < MIN_SIGNIFICANT_DISTANCE_METERS
  ) {
    return {
      computedSpeedKph: undefined,
      hasSignificantMovement: false,
      displacementMeters: distanceMeters,
    };
  }

  const speedKph = (distanceMeters / timeDeltaSeconds) * 3.6;
  return {
    computedSpeedKph: speedKph <= MAX_VALID_SPEED_KMH ? speedKph : undefined,
    hasSignificantMovement: true,
    displacementMeters: distanceMeters,
  };
}

function toValidSpeedKph(speedMetersPerSecond: number | null) {
  if (
    typeof speedMetersPerSecond !== "number" ||
    !Number.isFinite(speedMetersPerSecond) ||
    speedMetersPerSecond <= 0
  ) {
    return undefined;
  }

  const speedKph = speedMetersPerSecond * 3.6;
  return speedKph <= MAX_VALID_SPEED_KMH ? speedKph : undefined;
}

function rollingAverage(speedsKmh: readonly number[]) {
  if (speedsKmh.length === 0) return 0;
  return (
    speedsKmh.reduce((total, speed) => total + speed, 0) / speedsKmh.length
  );
}

function normalizeOptionalNumber(value: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function normalizeHeading(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(value, 360));
}

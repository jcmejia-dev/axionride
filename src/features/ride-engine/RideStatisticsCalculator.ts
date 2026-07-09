import type { Ride } from '@/src/domain/ride';

import { DEFAULT_FUEL_ECONOMY_KM_PER_LITER } from './RideEngineRules';
import type {
  FuelEstimateInput,
  RideEngineStatistics,
  RideStatisticsInput,
  RideSummary,
  RideSummaryInput,
} from './RideEngineTypes';
import { calculateRideDistance } from './RideDistanceCalculator';
import { calculateMovingTime, calculateRideDuration, calculateStoppedTime } from './RideDurationCalculator';
import { calculateAverageSpeed, calculateMaximumSpeed } from './RideSpeedCalculator';

/**
 * Estimate fuel consumption in liters.
 *
 * Returns null when distance or fuel economy is missing/invalid.
 */
export function estimateFuelConsumption(input: FuelEstimateInput): number | null {
  const fuelEconomy = normalizeFuelEconomy(input.fuelEconomyKmPerLiter);

  if (!isNonNegativeNumber(input.distanceKm) || fuelEconomy === null) {
    return null;
  }

  return roundTo(input.distanceKm / fuelEconomy, 2);
}

/**
 * Calculate a typed summary for one ride.
 */
export function calculateRideSummary(input: RideSummaryInput): RideSummary {
  const route = input.route ?? [];
  const routeDistance = calculateRideDistance({ route });
  const distance = firstUsableNumber(input.ride?.distanceKm, routeDistance);
  const duration = firstUsableNumber(
    input.ride?.durationSeconds,
    calculateRideDuration({
      startTime: input.ride?.startTime,
      endTime: input.ride?.endTime,
    }),
  );
  const movingTime = calculateMovingTime({
    route,
    movingSpeedThresholdKmh: input.movingSpeedThresholdKmh,
  });
  const stoppedTime = calculateStoppedTime({
    route,
    movingSpeedThresholdKmh: input.movingSpeedThresholdKmh,
  });
  const maximumSpeed = calculateMaximumSpeed(route);
  const averageSpeed = calculateAverageSpeed(distance, duration);

  return {
    distance,
    duration,
    averageSpeed,
    maximumSpeed,
    movingTime,
    stoppedTime,
    estimatedFuel: estimateFuelConsumption({
      distanceKm: distance,
      fuelEconomyKmPerLiter: input.fuelEconomyKmPerLiter,
    }),
  };
}

/**
 * Calculate aggregate ride statistics across ride records.
 */
export function calculateRideStatistics(input: RideStatisticsInput): RideEngineStatistics {
  const rides = input.rides ?? [];
  const totals = rides.reduce(
    (result, ride) => ({
      distance: result.distance + safeNonNegative(ride.distanceKm),
      duration: result.duration + safeNonNegative(ride.durationSeconds),
      movingTime: result.movingTime + safeNonNegative(ride.movingTimeSeconds),
      stoppedTime: result.stoppedTime + safeNonNegative(ride.stoppedTimeSeconds),
      topSpeed: Math.max(result.topSpeed, safeNonNegative(ride.maximumSpeedKmh)),
    }),
    {
      distance: 0,
      duration: 0,
      movingTime: 0,
      stoppedTime: 0,
      topSpeed: 0,
    },
  );

  return {
    averageSpeed: calculateAverageSpeed(totals.distance, totals.duration),
    topSpeed: roundTo(totals.topSpeed, 1),
    distance: roundTo(totals.distance, 3),
    movingTime: Math.round(totals.movingTime),
    stoppedTime: Math.round(totals.stoppedTime),
    rideCount: rides.length,
  };
}

/**
 * Convert a completed ride into a summary using stored ride values.
 */
export function summarizeRide(ride: Pick<Ride, 'distanceKm' | 'durationSeconds' | 'averageSpeedKmh' | 'maximumSpeedKmh' | 'movingTimeSeconds' | 'stoppedTimeSeconds' | 'fuelConsumedLiters'>): RideSummary {
  return {
    distance: safeNonNegative(ride.distanceKm),
    duration: safeNonNegative(ride.durationSeconds),
    averageSpeed: safeNonNegative(ride.averageSpeedKmh),
    maximumSpeed: safeNonNegative(ride.maximumSpeedKmh),
    movingTime: safeNonNegative(ride.movingTimeSeconds),
    stoppedTime: safeNonNegative(ride.stoppedTimeSeconds),
    estimatedFuel: ride.fuelConsumedLiters ?? null,
  };
}

function normalizeFuelEconomy(value: number | null | undefined) {
  if (value === undefined || value === null) {
    return DEFAULT_FUEL_ECONOMY_KM_PER_LITER;
  }

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function firstUsableNumber(preferred: number | null | undefined, fallback: number) {
  return isNonNegativeNumber(preferred) ? preferred : fallback;
}

function safeNonNegative(value: number | null | undefined) {
  return isNonNegativeNumber(value) ? value : 0;
}

function isNonNegativeNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function roundTo(value: number, decimals: number) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

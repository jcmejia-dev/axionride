import type { Ride, RidePoint, RideStatistics } from '@/src/domain/ride';

/**
 * Input for distance calculations from GPS-like route points.
 */
export type RideDistanceInput = {
  readonly route?: readonly RidePoint[] | null;
};

/**
 * Input for duration calculations.
 */
export type RideDurationInput = {
  readonly startTime?: string | null;
  readonly endTime?: string | null;
};

/**
 * Input for moving/stopped time calculations.
 */
export type RideTimeBreakdownInput = {
  readonly route?: readonly RidePoint[] | null;
  readonly movingSpeedThresholdKmh?: number | null;
};

/**
 * Input for fuel estimate calculations.
 */
export type FuelEstimateInput = {
  readonly distanceKm?: number | null;
  readonly fuelEconomyKmPerLiter?: number | null;
};

/**
 * Summary returned by the ride engine for one ride.
 */
export type RideSummary = {
  readonly distance: number;
  readonly duration: number;
  readonly averageSpeed: number;
  readonly maximumSpeed: number;
  readonly movingTime: number;
  readonly stoppedTime: number;
  readonly estimatedFuel: number | null;
};

/**
 * Input for calculating a single ride summary.
 */
export type RideSummaryInput = {
  readonly ride?: Partial<Pick<Ride, 'startTime' | 'endTime' | 'distanceKm' | 'durationSeconds'>> | null;
  readonly route?: readonly RidePoint[] | null;
  readonly fuelEconomyKmPerLiter?: number | null;
  readonly movingSpeedThresholdKmh?: number | null;
};

/**
 * Input for aggregate ride statistics.
 */
export type RideStatisticsInput = {
  readonly rides?: readonly Partial<Pick<Ride, 'distanceKm' | 'durationSeconds' | 'maximumSpeedKmh' | 'movingTimeSeconds' | 'stoppedTimeSeconds'>>[] | null;
};

/**
 * Aggregate ride statistics returned by the engine.
 */
export type RideEngineStatistics = RideStatistics;

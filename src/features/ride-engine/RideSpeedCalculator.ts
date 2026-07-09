import type { RidePoint } from '@/src/domain/ride';

import { SECONDS_PER_HOUR } from './RideEngineRules';

/**
 * Calculate average speed in kilometers per hour.
 */
export function calculateAverageSpeed(distanceKm?: number | null, durationSeconds?: number | null): number {
  if (!isNonNegativeNumber(distanceKm) || !isPositiveNumber(durationSeconds)) {
    return 0;
  }

  return roundTo(distanceKm / (durationSeconds / SECONDS_PER_HOUR), 1);
}

/**
 * Calculate maximum speed in kilometers per hour from route point speeds.
 */
export function calculateMaximumSpeed(route?: readonly RidePoint[] | null): number {
  const speeds = (route ?? [])
    .map((point) => point.speed)
    .filter((speed): speed is number => typeof speed === 'number' && Number.isFinite(speed) && speed >= 0);

  if (speeds.length === 0) {
    return 0;
  }

  return roundTo(Math.max(...speeds), 1);
}

/**
 * Return the latest known current speed in kilometers per hour.
 */
export function calculateCurrentSpeed(route?: readonly RidePoint[] | null): number {
  const points = route ?? [];

  for (let index = points.length - 1; index >= 0; index -= 1) {
    const speed = points[index].speed;

    if (typeof speed === 'number' && Number.isFinite(speed) && speed >= 0) {
      return roundTo(speed, 1);
    }
  }

  return 0;
}

function isNonNegativeNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function roundTo(value: number, decimals: number) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

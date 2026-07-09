import type { RidePoint } from '@/src/domain/ride';

import { DEFAULT_MOVING_SPEED_THRESHOLD_KMH } from './RideEngineRules';
import type { RideDurationInput, RideTimeBreakdownInput } from './RideEngineTypes';

/**
 * Calculate total duration in seconds from start and end timestamps.
 */
export function calculateRideDuration(input: RideDurationInput): number {
  const startTime = parseTimestamp(input.startTime);
  const endTime = parseTimestamp(input.endTime);

  if (startTime === null || endTime === null || endTime < startTime) {
    return 0;
  }

  return Math.round((endTime - startTime) / 1000);
}

/**
 * Calculate moving time in seconds from route point timestamps.
 *
 * A segment counts as moving when either adjacent point reports speed above
 * the threshold. Missing timestamps or invalid intervals are skipped.
 */
export function calculateMovingTime(input: RideTimeBreakdownInput): number {
  const route = input.route ?? [];
  const threshold = normalizeSpeedThreshold(input.movingSpeedThresholdKmh);

  return calculateSegmentTime(route, (previousPoint, currentPoint) => {
    const previousSpeed = previousPoint.speed ?? 0;
    const currentSpeed = currentPoint.speed ?? 0;
    return previousSpeed >= threshold || currentSpeed >= threshold;
  });
}

/**
 * Calculate stopped time in seconds from route point timestamps.
 */
export function calculateStoppedTime(input: RideTimeBreakdownInput): number {
  const route = input.route ?? [];
  const threshold = normalizeSpeedThreshold(input.movingSpeedThresholdKmh);

  return calculateSegmentTime(route, (previousPoint, currentPoint) => {
    const previousSpeed = previousPoint.speed ?? 0;
    const currentSpeed = currentPoint.speed ?? 0;
    return previousSpeed < threshold && currentSpeed < threshold;
  });
}

function calculateSegmentTime(
  route: readonly RidePoint[],
  shouldIncludeSegment: (previousPoint: RidePoint, currentPoint: RidePoint) => boolean,
) {
  if (route.length < 2) {
    return 0;
  }

  let seconds = 0;

  for (let index = 1; index < route.length; index += 1) {
    const previousPoint = route[index - 1];
    const currentPoint = route[index];
    const previousTime = parseTimestamp(previousPoint.timestamp);
    const currentTime = parseTimestamp(currentPoint.timestamp);

    if (previousTime !== null && currentTime !== null && currentTime >= previousTime && shouldIncludeSegment(previousPoint, currentPoint)) {
      seconds += Math.round((currentTime - previousTime) / 1000);
    }
  }

  return seconds;
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSpeedThreshold(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return DEFAULT_MOVING_SPEED_THRESHOLD_KMH;
  }

  return value;
}

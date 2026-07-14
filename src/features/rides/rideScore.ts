import type { Ride, RidePoint, RideSegment } from '@/src/domain/ride';
import { analyzeRideSegments, DEFAULT_FUEL_ECONOMY_KM_PER_LITER } from '@/src/features/ride-engine';

export type RideScoreGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export type RideScore = {
  readonly total: number;
  readonly grade: RideScoreGrade;
  readonly smoothness: number;
  readonly consistency: number;
  readonly trafficHandling: number;
  readonly efficiency: number;
};

export type RideScoreInput = {
  readonly route: readonly RidePoint[];
  readonly segments: readonly RideSegment[];
  readonly durationSeconds: number;
  readonly distanceKm: number;
  readonly fuelUsedLiters: number;
  readonly expectedEfficiencyKmPerLiter: number;
};

const SCORE_WEIGHTS = {
  smoothness: .3,
  consistency: .25,
  trafficHandling: .25,
  efficiency: .2,
} as const;

/** Derives a deterministic ride score from already-filtered ride telemetry. */
export function calculateRideScore(input: RideScoreInput): RideScore {
  const smoothness = calculateSmoothness(input.route);
  const consistency = calculateConsistency(input.route);
  const trafficHandling = calculateTrafficHandling(input.segments, input.durationSeconds);
  const efficiency = calculateEfficiency(
    input.distanceKm,
    input.fuelUsedLiters,
    input.expectedEfficiencyKmPerLiter,
  );
  const total = clampScore(
    smoothness * SCORE_WEIGHTS.smoothness
      + consistency * SCORE_WEIGHTS.consistency
      + trafficHandling * SCORE_WEIGHTS.trafficHandling
      + efficiency * SCORE_WEIGHTS.efficiency,
  );

  return {
    total,
    grade: toRideScoreGrade(total),
    smoothness,
    consistency,
    trafficHandling,
    efficiency,
  };
}

/** Maps an already-completed ride into the shared score input. */
export function calculateRideScoreForRide(ride: Ride): RideScore {
  const expectedEfficiencyKmPerLiter = ride.fuelEfficiencyKmPerLiter
    ?? DEFAULT_FUEL_ECONOMY_KM_PER_LITER;
  return calculateRideScore({
    route: ride.route,
    segments: ride.segments ?? analyzeRideSegments(ride.route),
    durationSeconds: ride.durationSeconds,
    distanceKm: ride.distanceKm,
    fuelUsedLiters: ride.fuelConsumedLiters
      ?? (ride.distanceKm / expectedEfficiencyKmPerLiter),
    expectedEfficiencyKmPerLiter,
  });
}

export function createRideScoreSuggestion(score: RideScore) {
  const weakest = ([
    ['smoothness', score.smoothness],
    ['consistency', score.consistency],
    ['trafficHandling', score.trafficHandling],
    ['efficiency', score.efficiency],
  ] as const).reduce((lowest, metric) => metric[1] < lowest[1] ? metric : lowest);

  if (weakest[0] === 'smoothness') return 'Try easing into acceleration and braking more gradually.';
  if (weakest[0] === 'consistency') return 'Hold a steadier pace where road conditions allow.';
  if (weakest[0] === 'trafficHandling') return 'Look further ahead to anticipate slowdowns and stops.';
  return 'Use gentler throttle input to improve fuel efficiency.';
}

export function toRideScoreGrade(score: number): RideScoreGrade {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

function calculateSmoothness(route: readonly RidePoint[]) {
  const accelerationSamples: number[] = [];

  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const current = route[index];
    if (!isValidSpeed(previous.speed) || !isValidSpeed(current.speed)) continue;
    const elapsedSeconds = (Date.parse(current.timestamp) - Date.parse(previous.timestamp)) / 1000;
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0 || elapsedSeconds > 10) continue;
    accelerationSamples.push(Math.abs(current.speed - previous.speed) / elapsedSeconds);
  }

  if (accelerationSamples.length === 0) return validSpeeds(route).length > 0 ? 90 : 70;
  const averageExcess = average(accelerationSamples.map((change) => Math.max(0, change - 5)));
  const spikeRatio = accelerationSamples.filter((change) => change > 12).length / accelerationSamples.length;
  return clampScore(100 - averageExcess * 3 - spikeRatio * 30);
}

function calculateConsistency(route: readonly RidePoint[]) {
  const speeds = validSpeeds(route).filter((speed) => speed >= 2);
  if (speeds.length < 2) return speeds.length === 1 ? 90 : 70;
  const mean = average(speeds);
  if (mean <= 0) return 70;
  const variance = average(speeds.map((speed) => (speed - mean) ** 2));
  const coefficientOfVariation = Math.sqrt(variance) / mean;
  return clampScore(100 - coefficientOfVariation * 120);
}

function calculateTrafficHandling(segments: readonly RideSegment[], durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 70;
  const stoppedSeconds = segmentDuration(segments, 'stopped');
  const slowSeconds = segmentDuration(segments, 'slow');
  const stoppedRatio = clampRatio(stoppedSeconds / durationSeconds);
  const slowRatio = clampRatio(slowSeconds / durationSeconds);
  return clampScore(100 - stoppedRatio * 115 - slowRatio * 45);
}

function calculateEfficiency(
  distanceKm: number,
  fuelUsedLiters: number,
  expectedEfficiencyKmPerLiter: number,
) {
  if (
    !Number.isFinite(distanceKm)
    || distanceKm <= 0
    || !Number.isFinite(fuelUsedLiters)
    || fuelUsedLiters <= 0
    || !Number.isFinite(expectedEfficiencyKmPerLiter)
    || expectedEfficiencyKmPerLiter <= 0
  ) return 70;

  const expectedFuelLiters = distanceKm / expectedEfficiencyKmPerLiter;
  const usageRatio = fuelUsedLiters / expectedFuelLiters;
  if (usageRatio <= 1) return 100;
  return clampScore(100 - (usageRatio - 1) * 100);
}

function validSpeeds(route: readonly RidePoint[]) {
  return route
    .map((point) => point.speed)
    .filter(isValidSpeed);
}

function isValidSpeed(speed: number | undefined): speed is number {
  return typeof speed === 'number' && Number.isFinite(speed) && speed >= 0 && speed <= 120;
}

function segmentDuration(segments: readonly RideSegment[], kind: RideSegment['kind']) {
  return segments
    .filter((segment) => segment.kind === kind)
    .reduce((total, segment) => total + Math.max(0, segment.durationSeconds), 0);
}

function average(values: readonly number[]) {
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function clampRatio(value: number) {
  return Math.max(0, Math.min(1, value));
}

function clampScore(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)));
}

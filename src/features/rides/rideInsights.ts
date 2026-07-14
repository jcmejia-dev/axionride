import type { RidePoint, RideSegment, RideSegmentKind } from '@/src/domain/ride';

export type RideInsightInput = {
  readonly averageSpeedKmh: number;
  readonly maximumSpeedKmh: number;
  readonly durationSeconds: number;
  readonly stoppedSeconds: number;
  readonly slowSeconds: number;
  readonly route?: readonly RidePoint[];
};

export function getSegmentDurationSeconds(segments: readonly RideSegment[], kind: RideSegmentKind) {
  return Math.round(
    segments
      .filter((segment) => segment.kind === kind)
      .reduce((total, segment) => total + segment.durationSeconds, 0),
  );
}

export function formatInsightDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m${remainder > 0 ? ` ${remainder}s` : ''}` : `${remainder}s`;
}

export function createRidePersonality(input: RideInsightInput) {
  const stoppedRatio = ratio(input.stoppedSeconds, input.durationSeconds);
  const slowRatio = ratio(input.slowSeconds, input.durationSeconds);
  if (input.averageSpeedKmh >= 55 || (input.maximumSpeedKmh >= 90 && input.averageSpeedKmh >= 40)) {
    return 'Fast and aggressive riding pattern.';
  }
  if (stoppedRatio >= 0.25) return 'Heavy traffic ride. Frequent stops detected.';
  if (slowRatio >= 0.42) return 'Measured city ride through slower streets.';
  if (stoppedRatio <= 0.08 && slowRatio <= 0.28) return 'Smooth city cruise with minimal stops.';
  return 'Balanced urban ride with a steady rhythm.';
}

export function createSmartRideInsights(input: RideInsightInput) {
  const stoppedPercent = Math.round(ratio(input.stoppedSeconds, input.durationSeconds) * 100);
  const slowPercent = Math.round(ratio(input.slowSeconds, input.durationSeconds) * 100);
  const insights: string[] = [
    stoppedPercent > 0
      ? `You spent ${stoppedPercent}% of your ride stopped.`
      : 'No extended stops were detected.',
  ];
  const consistency = getSpeedConsistency(input.route ?? []);
  if (consistency === 'consistent') insights.push('Your speed was consistent throughout the ride.');
  if (consistency === 'variable') insights.push('Your pace changed often across this ride.');
  if (stoppedPercent + slowPercent >= 45) insights.push('This ride showed a congested traffic pattern.');
  else if (slowPercent >= 20) insights.push(`${slowPercent}% of the ride was in slower sections.`);
  else insights.push('The route stayed flowing for most of the ride.');
  return insights.slice(0, 3);
}

function getSpeedConsistency(route: readonly RidePoint[]) {
  const speeds = route
    .map((point) => point.speed)
    .filter((speed): speed is number => typeof speed === 'number' && Number.isFinite(speed) && speed >= 2);
  if (speeds.length < 4) return 'unknown' as const;
  const mean = speeds.reduce((total, speed) => total + speed, 0) / speeds.length;
  if (mean <= 0) return 'unknown' as const;
  const variance = speeds.reduce((total, speed) => total + ((speed - mean) ** 2), 0) / speeds.length;
  return Math.sqrt(variance) / mean <= 0.24 ? 'consistent' as const : 'variable' as const;
}

function ratio(value: number, total: number) {
  return total > 0 ? Math.max(0, value) / total : 0;
}

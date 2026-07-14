import type { RidePoint, RideSegment, RideSegmentKind } from '@/src/domain/ride';

import { calculateCoordinateDistanceKm } from './RideDistanceCalculator';

const STOPPED_SPEED_KMH = 2;
const SLOW_SPEED_KMH = 10;
const STOPPED_CONFIRMATION_SECONDS = 5;

type Interval = {
  readonly startPointIndex: number;
  readonly endPointIndex: number;
  readonly durationSeconds: number;
  readonly distanceKm: number;
  readonly speedKmh: number;
  readonly provisionalKind: RideSegmentKind | 'stopped-candidate';
};

/** Builds stable, persistable ride sections from consecutive GPS samples. */
export function analyzeRideSegments(route: readonly RidePoint[]): readonly RideSegment[] {
  if (route.length < 2) return [];

  const intervals: Interval[] = [];
  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const current = route[index];
    const durationSeconds = Math.max(0, (Date.parse(current.timestamp) - Date.parse(previous.timestamp)) / 1000);
    if (durationSeconds <= 0) continue;
    const distanceKm = calculateCoordinateDistanceKm(previous, current);
    const computedSpeedKmh = (distanceKm / durationSeconds) * 3600;
    const speedKmh = validSpeed(current.speed) ?? validSpeed(previous.speed) ?? computedSpeedKmh;
    intervals.push({
      startPointIndex: index - 1,
      endPointIndex: index,
      durationSeconds,
      distanceKm,
      speedKmh,
      provisionalKind: speedKmh < STOPPED_SPEED_KMH
        ? 'stopped-candidate'
        : speedKmh < SLOW_SPEED_KMH ? 'slow' : 'normal',
    });
  }

  const classified: Array<Interval & { readonly kind: RideSegmentKind }> = [];
  for (let index = 0; index < intervals.length;) {
    const first = intervals[index];
    if (first.provisionalKind !== 'stopped-candidate') {
      classified.push({ ...first, kind: first.provisionalKind });
      index += 1;
      continue;
    }
    let end = index;
    let stoppedSeconds = 0;
    while (end < intervals.length && intervals[end].provisionalKind === 'stopped-candidate') {
      stoppedSeconds += intervals[end].durationSeconds;
      end += 1;
    }
    const kind: RideSegmentKind = stoppedSeconds >= STOPPED_CONFIRMATION_SECONDS ? 'stopped' : 'slow';
    for (let cursor = index; cursor < end; cursor += 1) classified.push({ ...intervals[cursor], kind });
    index = end;
  }

  const segments: RideSegment[] = [];
  for (const interval of classified) {
    const previousSegment = segments[segments.length - 1];
    if (previousSegment?.kind === interval.kind && previousSegment.endPointIndex === interval.startPointIndex) {
      const durationSeconds = previousSegment.durationSeconds + interval.durationSeconds;
      segments[segments.length - 1] = {
        ...previousSegment,
        endPointIndex: interval.endPointIndex,
        endTime: route[interval.endPointIndex].timestamp,
        durationSeconds,
        distanceKm: previousSegment.distanceKm + interval.distanceKm,
        averageSpeedKmh: durationSeconds > 0
          ? ((previousSegment.averageSpeedKmh * previousSegment.durationSeconds) + (interval.speedKmh * interval.durationSeconds)) / durationSeconds
          : 0,
      };
      continue;
    }
    segments.push({
      kind: interval.kind,
      startPointIndex: interval.startPointIndex,
      endPointIndex: interval.endPointIndex,
      startTime: route[interval.startPointIndex].timestamp,
      endTime: route[interval.endPointIndex].timestamp,
      durationSeconds: interval.durationSeconds,
      distanceKm: interval.distanceKm,
      averageSpeedKmh: interval.speedKmh,
    });
  }
  return segments;
}

function validSpeed(speedKmh: number | undefined) {
  return typeof speedKmh === 'number' && Number.isFinite(speedKmh) && speedKmh >= 0 ? speedKmh : undefined;
}

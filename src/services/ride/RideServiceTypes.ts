import type { Ride, RideId } from '@/src/domain/ride';
import type { RideSummary } from '@/src/features/ride-engine';

export type RideRecordingStatus = 'idle' | 'active' | 'paused' | 'completed';

export type RideSessionSnapshot = {
  readonly id: RideId | null;
  readonly status: RideRecordingStatus;
  readonly startedAt: string | null;
  readonly pausedAt: string | null;
  readonly elapsedSeconds: number;
  readonly distanceKm: number;
  readonly averageSpeedKmh: number;
  readonly maximumSpeedKmh: number;
  readonly hasGpsSignal: boolean;
  readonly ridePointCount: number;
};

export type CompletedRideResult = {
  readonly ride: Ride;
  readonly summary: RideSummary;
};

export type RideHistoryItem = {
  readonly ride: Ride;
  readonly summary: RideSummary;
};

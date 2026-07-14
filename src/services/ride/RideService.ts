import {
  createDefaultRideName,
  RideStatus,
  RideType,
  type Ride,
  type RidePoint,
} from '@/src/domain/ride';
import {
  analyzeRideSegments,
  calculateConfirmedMaximumSpeed,
  calculateRideDistance,
  calculateRideSummary,
  summarizeRide,
  DEFAULT_FUEL_ECONOMY_KM_PER_LITER,
} from '@/src/features/ride-engine';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { RiderProgressService } from '@/src/services/rider-progress';

import type { CompletedRideResult, RideHistoryItem, RideRecordingStatus, RideSessionSnapshot } from './RideServiceTypes';

const DEMO_SPEED_KMH = 36;
const DEMO_ROUTE_START_LATITUDE = 14.5995;
const DEMO_ROUTE_START_LONGITUDE = 120.9842;
const RIDE_HISTORY_CACHE_TTL_MS = 30_000;
const rideHistoryCache = new Map<string, { readonly cachedAt: number; readonly items: readonly RideHistoryItem[] }>();

type ActiveRideSession = {
  readonly id: string;
  readonly startedAt: Date;
  readonly motorcycleId: string;
  readonly title: string;
  readonly fuelEfficiencyKmPerLiter: number;
  pausedAt: Date | null;
  totalPausedSeconds: number;
  status: Exclude<RideRecordingStatus, 'idle' | 'completed'>;
  ridePoints: RidePoint[];
};

export class RideService extends BaseService {
  private currentSession: ActiveRideSession | null = null;
  private readonly riderProgressService: RiderProgressService;

  constructor(context: ServiceContext, riderProgressService = new RiderProgressService(context)) {
    super(context);
    this.riderProgressService = riderProgressService;
  }

  async startRide(): Promise<ServiceResult<RideSessionSnapshot>> {
    if (this.currentSession && this.currentSession.status !== 'paused') {
      return this.failure({
        code: 'conflict',
        message: 'A ride is already active.',
      });
    }

    const now = new Date();
    const rideName = createDefaultRideName(now);
    const motorcycle = await this.context.repositories.motorcycles.getPrimaryMotorcycle();
    if (!motorcycle) return this.failure({ code: 'not_found', message: 'Add a motorcycle and select it as primary before starting a ride.' });
    this.currentSession = {
      id: `ride-${now.getTime()}`,
      startedAt: now,
      motorcycleId: motorcycle.id,
      title: rideName,
      fuelEfficiencyKmPerLiter: motorcycle.fuelEfficiencyKmPerLiter ?? DEFAULT_FUEL_ECONOMY_KM_PER_LITER,
      pausedAt: null,
      totalPausedSeconds: 0,
      status: 'active',
      ridePoints: [],
    };

    return this.success(this.createSnapshot(now));
  }

  addRidePoint(point: RidePoint): ServiceResult<RideSessionSnapshot> {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      return this.failure({
        code: 'conflict',
        message: 'No active ride is available for GPS updates.',
      });
    }

    this.currentSession.ridePoints.push(point);
    return this.success(this.createSnapshot(new Date(point.timestamp)));
  }

  pauseRide(): ServiceResult<RideSessionSnapshot> {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      return this.failure({
        code: 'conflict',
        message: 'No active ride is available to pause.',
      });
    }

    this.currentSession.pausedAt = new Date();
    this.currentSession.status = 'paused';
    return this.success(this.createSnapshot(this.currentSession.pausedAt));
  }

  resumeRide(): ServiceResult<RideSessionSnapshot> {
    if (!this.currentSession || this.currentSession.status !== 'paused' || !this.currentSession.pausedAt) {
      return this.failure({
        code: 'conflict',
        message: 'No paused ride is available to resume.',
      });
    }

    const now = new Date();
    this.currentSession.totalPausedSeconds += secondsBetween(this.currentSession.pausedAt, now);
    this.currentSession.pausedAt = null;
    this.currentSession.status = 'active';
    return this.success(this.createSnapshot(now));
  }

  async finishRide(): Promise<ServiceResult<CompletedRideResult>> {
    if (!this.currentSession) {
      return this.failure({
        code: 'conflict',
        message: 'No ride is available to finish.',
      });
    }

    const finishedAt = this.currentSession.status === 'paused' && this.currentSession.pausedAt
      ? this.currentSession.pausedAt
      : new Date();
    const elapsedSeconds = this.getElapsedSeconds(finishedAt);
    const durationSeconds = Math.max(elapsedSeconds, 1);
    const completedAt = new Date(this.currentSession.startedAt.getTime() + durationSeconds * 1000);
    const route = this.currentSession.ridePoints.length >= 2
      ? [...this.currentSession.ridePoints]
      : createDemoRoute(this.currentSession.startedAt, durationSeconds);
    const distanceKm = calculateRideDistance({ route });
    const maximumSpeedKmh = calculateConfirmedMaximumSpeed(route);
    const summary = calculateRideSummary({
      ride: {
        startTime: this.currentSession.startedAt.toISOString(),
        endTime: completedAt.toISOString(),
        distanceKm,
        durationSeconds,
      },
      route,
      fuelEconomyKmPerLiter: this.currentSession.fuelEfficiencyKmPerLiter,
    });
    const segments = analyzeRideSegments(route);
    const stoppedTimeSeconds = Math.min(
      durationSeconds,
      Math.round(segments.filter((segment) => segment.kind === 'stopped').reduce((total, segment) => total + segment.durationSeconds, 0)),
    );
    const ride: Ride = {
      id: this.currentSession.id,
      motorcycleId: this.currentSession.motorcycleId,
      title: this.currentSession.title,
      rideName: this.currentSession.title,
      description: this.currentSession.ridePoints.length >= 2
        ? 'Recorded with foreground GPS tracking.'
        : 'Recorded with demo ride mode. GPS is not connected yet.',
      status: RideStatus.Completed,
      type: RideType.City,
      startTime: this.currentSession.startedAt.toISOString(),
      endTime: completedAt.toISOString(),
      distanceKm: summary.distance,
      durationSeconds: summary.duration,
      averageSpeedKmh: summary.averageSpeed,
      maximumSpeedKmh,
      movingTimeSeconds: Math.max(0, durationSeconds - stoppedTimeSeconds),
      stoppedTimeSeconds,
      fuelConsumedLiters: summary.estimatedFuel ?? undefined,
      fuelEfficiencyKmPerLiter: this.currentSession.fuelEfficiencyKmPerLiter,
      segments,
      weather: {
        condition: 'Demo clear',
      },
      notes: this.currentSession.ridePoints.length >= 2
        ? 'Foreground GPS ride recording.'
        : 'Demo ride recording without GPS.',
      route,
      createdAt: this.currentSession.startedAt.toISOString(),
      updatedAt: completedAt.toISOString(),
    };

    const saveResult = await this.context.repositories.rides.saveRide(ride);

    if (!saveResult.ok) {
      logRideSaveFailure(this.context, ride, saveResult.error);

      return this.failure({
        code: 'repository_error',
        message: saveResult.error.message,
        cause: saveResult.error,
      });
    }

    const workspaceId = await this.context.repositories.workspaces.getActiveWorkspaceId();
    rideHistoryCache.delete(workspaceId);
    const progressResult = await this.riderProgressService.recordRideCompleted(saveResult.value.id);
    if (!progressResult.ok) {
      this.context.logger?.warn?.('Ride was saved, but rider progress could not be updated.', {
        rideId: saveResult.value.id,
        error: progressResult.error,
      });
    }

    this.currentSession = null;
    return this.success({
      ride: saveResult.value,
      summary: summarizeRide(saveResult.value),
    });
  }

  cancelRide(): ServiceResult<RideSessionSnapshot> {
    this.currentSession = null;
    return this.success(createIdleSnapshot());
  }

  getCurrentRide(): ServiceResult<RideSessionSnapshot> {
    return this.success(this.createSnapshot(new Date()));
  }

  async getRideHistory(forceRefresh = false): Promise<ServiceResult<readonly RideHistoryItem[]>> {
    const workspaceId = await this.context.repositories.workspaces.getActiveWorkspaceId();
    const cached = rideHistoryCache.get(workspaceId);
    if (!forceRefresh && cached && Date.now() - cached.cachedAt < RIDE_HISTORY_CACHE_TTL_MS) {
      return this.success(cached.items);
    }
    const rides = await this.context.repositories.rides.getAllRides();
    const items = rides.map((ride) => ({
        ride,
        summary: summarizeRide(ride),
      })).sort((first, second) => Date.parse(second.ride.startTime) - Date.parse(first.ride.startTime));
    rideHistoryCache.set(workspaceId, { cachedAt: Date.now(), items });
    return this.success(items);
  }

  async getRideById(id: string): Promise<ServiceResult<Ride>> {
    const ride = await this.context.repositories.rides.getRide(id);
    return ride
      ? this.success(ride)
      : this.failure({ code: 'not_found', message: 'Ride was not found.' });
  }

  async renameRide(id: string, rideName: string): Promise<ServiceResult<Ride>> {
    const normalizedName = rideName.trim();
    if (!normalizedName || normalizedName.length > 120) {
      return this.failure({
        code: 'validation_failed',
        message: 'Ride name must be between 1 and 120 characters.',
      });
    }
    const ride = await this.context.repositories.rides.getRide(id);
    if (!ride) return this.failure({ code: 'not_found', message: 'Ride was not found.' });
    const updatedRide: Ride = {
      ...ride,
      title: normalizedName,
      rideName: normalizedName,
      updatedAt: new Date().toISOString(),
    };
    const result = await this.context.repositories.rides.updateRide(updatedRide);
    if (!result.ok) {
      return this.failure({ code: 'repository_error', message: result.error.message, cause: result.error });
    }
    const workspaceId = await this.context.repositories.workspaces.getActiveWorkspaceId();
    rideHistoryCache.delete(workspaceId);
    return this.success(result.value);
  }

  private createSnapshot(now: Date): RideSessionSnapshot {
    if (!this.currentSession) {
      return createIdleSnapshot();
    }

    const elapsedSeconds = this.getElapsedSeconds(now);
    const hasGpsSignal = this.currentSession.ridePoints.length > 0;
    const distanceKm = hasGpsSignal
      ? calculateRideDistance({ route: this.currentSession.ridePoints })
      : roundTo((elapsedSeconds / 3600) * DEMO_SPEED_KMH, 2);
    const maximumSpeedKmh = hasGpsSignal
      ? calculateConfirmedMaximumSpeed(this.currentSession.ridePoints)
      : elapsedSeconds > 0 ? DEMO_SPEED_KMH : 0;
    const latestGpsSpeedKmh = getLatestRidePointSpeed(this.currentSession.ridePoints);

    return {
      id: this.currentSession.id,
      status: this.currentSession.status,
      startedAt: this.currentSession.startedAt.toISOString(),
      pausedAt: this.currentSession.pausedAt?.toISOString() ?? null,
      elapsedSeconds,
      distanceKm,
      averageSpeedKmh: latestGpsSpeedKmh ?? (elapsedSeconds > 0 ? DEMO_SPEED_KMH : 0),
      maximumSpeedKmh,
      hasGpsSignal,
      ridePointCount: this.currentSession.ridePoints.length,
    };
  }

  private getElapsedSeconds(now: Date) {
    if (!this.currentSession) {
      return 0;
    }

    const effectiveNow = this.currentSession.status === 'paused' && this.currentSession.pausedAt
      ? this.currentSession.pausedAt
      : now;
    return Math.max(0, secondsBetween(this.currentSession.startedAt, effectiveNow) - this.currentSession.totalPausedSeconds);
  }

}

function createIdleSnapshot(): RideSessionSnapshot {
  return {
    id: null,
    status: 'idle',
    startedAt: null,
    pausedAt: null,
    elapsedSeconds: 0,
    distanceKm: 0,
    averageSpeedKmh: 0,
    maximumSpeedKmh: 0,
    hasGpsSignal: false,
    ridePointCount: 0,
  };
}

function getLatestRidePointSpeed(route: readonly RidePoint[]) {
  for (let index = route.length - 1; index >= 0; index -= 1) {
    const speed = route[index].speed;

    if (typeof speed === 'number' && Number.isFinite(speed) && speed >= 0) {
      return roundTo(speed, 1);
    }
  }

  return null;
}

function createDemoRoute(startedAt: Date, durationSeconds: number): readonly RidePoint[] {
  const safeDurationSeconds = Math.max(1, durationSeconds);
  const finishedAt = new Date(startedAt.getTime() + safeDurationSeconds * 1000);
  const distanceKm = (DEMO_SPEED_KMH * safeDurationSeconds) / 3600;
  const kilometersPerLongitudeDegree =
    111.32 * Math.cos((DEMO_ROUTE_START_LATITUDE * Math.PI) / 180);
  const longitudeDelta = distanceKm / kilometersPerLongitudeDegree;

  return [
    {
      latitude: DEMO_ROUTE_START_LATITUDE,
      longitude: DEMO_ROUTE_START_LONGITUDE,
      speed: DEMO_SPEED_KMH,
      timestamp: startedAt.toISOString(),
    },
    {
      latitude: DEMO_ROUTE_START_LATITUDE,
      longitude: DEMO_ROUTE_START_LONGITUDE + longitudeDelta,
      speed: DEMO_SPEED_KMH,
      timestamp: finishedAt.toISOString(),
    },
  ];
}

function logRideSaveFailure(context: ServiceContext, ride: Ride, error: unknown) {
  const metadata = {
    rideId: ride.id,
    motorcycleId: ride.motorcycleId,
    distanceKm: ride.distanceKm,
    durationSeconds: ride.durationSeconds,
    averageSpeedKmh: ride.averageSpeedKmh,
    maximumSpeedKmh: ride.maximumSpeedKmh,
    movingTimeSeconds: ride.movingTimeSeconds,
    stoppedTimeSeconds: ride.stoppedTimeSeconds,
    error,
  };

  context.logger?.error?.('Ride save failed.', metadata);
  console.warn('[RideService] Ride save failed.', metadata);
}

function secondsBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

function roundTo(value: number, decimals: number) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

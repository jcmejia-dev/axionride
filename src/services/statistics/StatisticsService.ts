import { MaintenanceStatus, type Maintenance } from '@/src/domain/maintenance';
import type { Motorcycle } from '@/src/domain/motorcycle';
import type { Ride } from '@/src/domain/ride';
import { calculateRideStatistics } from '@/src/features/ride-engine';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

import type {
  MaintenanceStatisticsSummary,
  MotorcycleStatisticsSummary,
  RideStatisticsSummary,
  StatisticsDashboardSummary,
} from './StatisticsServiceTypes';

/**
 * Read-only application service for dashboard statistics.
 *
 * UI callers receive a composed summary and never query repositories or SQLite
 * directly. Ride aggregation reuses the Ride Engine instead of duplicating
 * distance, duration, and speed calculations in the UI.
 */
export class StatisticsService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }

  async getDashboardStatistics(): Promise<ServiceResult<StatisticsDashboardSummary>> {
    const [rides, maintenanceRecords, motorcycles] = await Promise.all([
      this.context.repositories.rides.getAllRides(),
      this.context.repositories.maintenance.getAllMaintenance(),
      this.context.repositories.motorcycles.getAllMotorcycles(),
    ]);
    const sortedRides = [...rides].sort(compareRideDateDescending);

    return this.success({
      generatedAt: new Date().toISOString(),
      rides: createRideSummary(rides),
      maintenance: createMaintenanceSummary(maintenanceRecords),
      motorcycles: createMotorcycleSummary(motorcycles),
      recentRide: sortedRides[0] ?? null,
    });
  }
}

function createRideSummary(rides: readonly Ride[]): RideStatisticsSummary {
  if (rides.length === 0) {
    return {
      hasData: false,
      totalRides: 0,
      totalDistanceKm: 0,
      totalRideTimeSeconds: 0,
      averageRideDurationSeconds: 0,
      longestRideKm: 0,
      averageSpeedKmh: 0,
      lastRideDate: null,
    };
  }

  const aggregate = calculateRideStatistics({ rides });
  const totalRideTimeSeconds = rides.reduce((total, ride) => total + safeNonNegative(ride.durationSeconds), 0);
  const longestRideKm = rides.reduce(
    (longestDistance, ride) => Math.max(longestDistance, safeNonNegative(ride.distanceKm)),
    0,
  );
  const lastRide = [...rides].sort(compareRideDateDescending)[0] ?? null;

  return {
    hasData: true,
    totalRides: aggregate.rideCount,
    totalDistanceKm: aggregate.distance,
    totalRideTimeSeconds,
    averageRideDurationSeconds: totalRideTimeSeconds / rides.length,
    longestRideKm,
    averageSpeedKmh: aggregate.averageSpeed,
    lastRideDate: lastRide?.endTime ?? lastRide?.startTime ?? null,
  };
}

function createMaintenanceSummary(
  maintenanceRecords: readonly Maintenance[],
): MaintenanceStatisticsSummary {
  if (maintenanceRecords.length === 0) {
    return {
      hasData: false,
      totalRecords: 0,
      upcomingCount: 0,
      overdueCount: 0,
      completedCount: 0,
      nextScheduledService: null,
    };
  }

  const actionableMaintenance = maintenanceRecords.filter(
    (maintenance) => maintenance.status !== MaintenanceStatus.Completed && maintenance.status !== MaintenanceStatus.Skipped,
  );

  return {
    hasData: true,
    totalRecords: maintenanceRecords.length,
    upcomingCount: actionableMaintenance.length,
    overdueCount: maintenanceRecords.filter((maintenance) => maintenance.status === MaintenanceStatus.Overdue).length,
    completedCount: maintenanceRecords.filter((maintenance) => maintenance.status === MaintenanceStatus.Completed).length,
    nextScheduledService: [...actionableMaintenance].sort(compareMaintenanceSchedule)[0] ?? null,
  };
}

function createMotorcycleSummary(motorcycles: readonly Motorcycle[]): MotorcycleStatisticsSummary {
  if (motorcycles.length === 0) {
    return {
      hasData: false,
      totalMotorcycles: 0,
      defaultMotorcycle: null,
      totalEstimatedMileageKm: 0,
    };
  }

  return {
    hasData: true,
    totalMotorcycles: motorcycles.length,
    defaultMotorcycle: [...motorcycles].sort(compareMotorcycleUpdatedAtDescending)[0] ?? null,
    totalEstimatedMileageKm: motorcycles.reduce(
      (total, motorcycle) => total + safeNonNegative(motorcycle.odometerKm),
      0,
    ),
  };
}

function compareRideDateDescending(first: Ride, second: Ride) {
  return getRideTime(second) - getRideTime(first);
}

function getRideTime(ride: Ride) {
  return Date.parse(ride.endTime ?? ride.startTime);
}

function compareMaintenanceSchedule(first: Maintenance, second: Maintenance) {
  const firstDate = first.nextDueDate ? Date.parse(first.nextDueDate) : Number.POSITIVE_INFINITY;
  const secondDate = second.nextDueDate ? Date.parse(second.nextDueDate) : Number.POSITIVE_INFINITY;

  if (firstDate !== secondDate) {
    return firstDate - secondDate;
  }

  const firstOdometer = first.nextDueOdometerKm ?? Number.POSITIVE_INFINITY;
  const secondOdometer = second.nextDueOdometerKm ?? Number.POSITIVE_INFINITY;

  return firstOdometer - secondOdometer;
}

function compareMotorcycleUpdatedAtDescending(first: Motorcycle, second: Motorcycle) {
  return Date.parse(second.updatedAt) - Date.parse(first.updatedAt);
}

function safeNonNegative(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

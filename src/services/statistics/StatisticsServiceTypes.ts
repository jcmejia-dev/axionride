import type { Maintenance } from '@/src/domain/maintenance';
import type { Motorcycle } from '@/src/domain/motorcycle';
import type { Ride } from '@/src/domain/ride';

/**
 * Aggregated ride metrics for the statistics dashboard.
 */
export type RideStatisticsSummary = {
  readonly hasData: boolean;
  readonly totalRides: number;
  readonly totalDistanceKm: number;
  readonly totalRideTimeSeconds: number;
  readonly averageRideDurationSeconds: number;
  readonly longestRideKm: number;
  readonly averageSpeedKmh: number;
  readonly lastRideDate: string | null;
};

/**
 * Aggregated maintenance metrics for the statistics dashboard.
 */
export type MaintenanceStatisticsSummary = {
  readonly hasData: boolean;
  readonly totalRecords: number;
  readonly upcomingCount: number;
  readonly overdueCount: number;
  readonly completedCount: number;
  readonly nextScheduledService: Maintenance | null;
};

/**
 * Aggregated motorcycle metrics for the statistics dashboard.
 */
export type MotorcycleStatisticsSummary = {
  readonly hasData: boolean;
  readonly totalMotorcycles: number;
  readonly defaultMotorcycle: Motorcycle | null;
  readonly totalEstimatedMileageKm: number;
};

/**
 * Full statistics dashboard read model produced by StatisticsService.
 */
export type StatisticsDashboardSummary = {
  readonly generatedAt: string;
  readonly rides: RideStatisticsSummary;
  readonly maintenance: MaintenanceStatisticsSummary;
  readonly motorcycles: MotorcycleStatisticsSummary;
  readonly recentRide: Ride | null;
};

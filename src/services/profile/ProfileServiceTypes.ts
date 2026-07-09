import type { StatisticsDashboardSummary } from '@/src/services/statistics';

/**
 * Local-only rider profile shown before authentication and cloud sync exist.
 */
export type LocalProfile = {
  readonly riderName: string;
  readonly membershipStatus: string;
  readonly accountMode: 'local_demo';
  readonly notice: string;
};

/**
 * Profile screen read model composed by ProfileService.
 */
export type ProfileOverview = {
  readonly profile: LocalProfile;
  readonly statistics: StatisticsDashboardSummary;
};

import type { StatisticsDashboardSummary } from '@/src/services/statistics';

/**
 * Authenticated rider identity combined with local workspace state.
 */
export type LocalProfile = {
  readonly riderName: string;
  readonly email: string;
  readonly membershipStatus: string;
  readonly accountMode: 'authenticated';
  readonly notice: string;
  readonly imageUri: string | null;
};

export type ProfileIdentity = { readonly displayName?: string; readonly email: string };
export type UpdateLocalProfileInput = { readonly nickname: string; readonly imageUri: string | null };

/**
 * Profile screen read model composed by ProfileService.
 */
export type ProfileOverview = {
  readonly profile: LocalProfile;
  readonly statistics: StatisticsDashboardSummary;
};

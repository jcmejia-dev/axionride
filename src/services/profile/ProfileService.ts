import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { StatisticsService } from '@/src/services/statistics';

import type { ProfileIdentity, ProfileOverview } from './ProfileServiceTypes';

/**
 * Local profile application service.
 *
 * This service accepts a provider-neutral authenticated identity and combines
 * it with workspace-scoped local statistics. It does not query Supabase or
 * implement cloud synchronization.
 */
export class ProfileService extends BaseService {
  private readonly statisticsService: StatisticsService;

  constructor(context: ServiceContext) {
    super(context);
    this.statisticsService = new StatisticsService(context);
  }

  async getProfileOverview(identity: ProfileIdentity): Promise<ServiceResult<ProfileOverview>> {
    const statisticsResult = await this.statisticsService.getDashboardStatistics();

    if (!statisticsResult.ok) {
      return this.failure(statisticsResult.error);
    }

    return this.success({
      profile: {
        riderName: identity.displayName?.trim() || identity.email.split('@')[0] || 'Axion Rider',
        email: identity.email,
        membershipStatus: 'Authenticated Rider',
        accountMode: 'authenticated',
        notice: 'Your account is authenticated. Motorcycle and ride data remain isolated in SQLite on this device; cloud sync is not enabled.',
      },
      statistics: statisticsResult.value,
    });
  }
}

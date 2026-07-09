import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { StatisticsService } from '@/src/services/statistics';

import type { ProfileOverview } from './ProfileServiceTypes';

/**
 * Local profile application service.
 *
 * This service intentionally does not know about authentication, Supabase, or
 * cloud sync. It composes local/demo profile data with repository-backed
 * statistics for the Profile tab.
 */
export class ProfileService extends BaseService {
  private readonly statisticsService: StatisticsService;

  constructor(context: ServiceContext) {
    super(context);
    this.statisticsService = new StatisticsService(context);
  }

  async getProfileOverview(): Promise<ServiceResult<ProfileOverview>> {
    const statisticsResult = await this.statisticsService.getDashboardStatistics();

    if (!statisticsResult.ok) {
      return this.failure(statisticsResult.error);
    }

    return this.success({
      profile: {
        riderName: 'Axion Rider',
        membershipStatus: 'Local Demo Rider',
        accountMode: 'local_demo',
        notice: 'Profile data is stored locally for now. Sign-in and sync are disabled in this build.',
      },
      statistics: statisticsResult.value,
    });
  }
}

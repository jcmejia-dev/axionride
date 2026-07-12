import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { StatisticsService } from '@/src/services/statistics';

import type { ProfileIdentity, ProfileOverview, UpdateLocalProfileInput } from './ProfileServiceTypes';

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
    const [statisticsResult, workspace] = await Promise.all([
      this.statisticsService.getDashboardStatistics(),
      this.context.repositories.workspaces.getActiveWorkspace(),
    ]);

    if (!statisticsResult.ok) {
      return this.failure(statisticsResult.error);
    }

    return this.success({
      profile: {
        riderName: workspace.profileNickname || identity.displayName?.trim() || identity.email.split('@')[0] || 'Axion Rider',
        email: identity.email,
        membershipStatus: 'Authenticated Rider',
        accountMode: 'authenticated',
        notice: 'Your account is authenticated. Motorcycle and ride data remain isolated in SQLite on this device; cloud sync is not enabled.',
        imageUri: workspace.profileImageUri ?? null,
      },
      statistics: statisticsResult.value,
    });
  }

  async updateLocalProfile(input: UpdateLocalProfileInput): Promise<ServiceResult<void>> {
    const nickname = input.nickname.trim();
    if (nickname.length < 2 || nickname.length > 32) {
      return this.failure({ code: 'validation_failed', message: 'Nickname must be between 2 and 32 characters.' });
    }
    const updateProfile = this.context.repositories.workspaces.updateActiveProfile;
    if (!updateProfile) {
      return this.failure({ code: 'unavailable', message: 'Local profile editing is unavailable.' });
    }
    await updateProfile.call(this.context.repositories.workspaces, { nickname, imageUri: input.imageUri });
    return this.success(undefined);
  }
}

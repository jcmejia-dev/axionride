import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

import type { RideScoreComparison } from './RideScoreProgressServiceTypes';

export class RideScoreProgressService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }

  async recordScore(score: number): Promise<ServiceResult<RideScoreComparison>> {
    try {
      const repository = this.context.repositories.rideScoreProgress;
      if (!repository) throw new Error('Ride Score progress repository is unavailable.');
      const result = await repository.recordScore(score);
      return this.success({
        ...result,
        isPersonalBest: result.previousBestScore !== null && result.currentScore > result.previousBestScore,
        changeFromLast: result.previousLastScore === null
          ? null
          : result.currentScore - result.previousLastScore,
      });
    } catch (cause) {
      return this.failure({
        code: 'repository_error',
        message: 'Ride Score comparison could not be saved.',
        cause,
      });
    }
  }
}

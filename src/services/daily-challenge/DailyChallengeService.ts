import {
  createDailyChallenge,
  evaluateDailyChallenge,
  hydrateDailyChallenge,
  toLocalChallengeDate,
  type DailyChallengeEvaluation,
  type DailyChallengeRideResult,
  type DailyRideChallenge,
} from '@/src/features/daily-challenge';
import type { RidePoint } from '@/src/domain/ride';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { RiderProgressService } from '@/src/services/rider-progress';

export class DailyChallengeService extends BaseService {
  private readonly riderProgressService: RiderProgressService;

  constructor(context: ServiceContext, riderProgressService = new RiderProgressService(context)) {
    super(context);
    this.riderProgressService = riderProgressService;
  }

  async getTodayChallenge(now = new Date()): Promise<ServiceResult<DailyRideChallenge>> {
    try {
      const repository = this.requireRepository();
      const date = toLocalChallengeDate(now);
      const existing = await repository.getByDate(date);
      if (existing) return this.success(hydrateDailyChallenge(existing));
      const generated = createDailyChallenge(date);
      const stored = await repository.create(generated);
      return this.success(hydrateDailyChallenge(stored));
    } catch (cause) {
      return this.failure({ code: 'repository_error', message: "Today's ride challenge could not be loaded.", cause });
    }
  }

  async saveProgress(challenge: DailyRideChallenge, evaluation: DailyChallengeEvaluation): Promise<ServiceResult<DailyRideChallenge>> {
    try {
      const update = await this.requireRepository().updateProgress(
        challenge.challengeId,
        challenge.date,
        Math.min(evaluation.progress, 99),
        false,
      );
      return this.success(hydrateDailyChallenge(update.challenge));
    } catch (cause) {
      return this.failure({ code: 'repository_error', message: 'Challenge progress could not be saved.', cause });
    }
  }

  async finishRide(challenge: DailyRideChallenge, route: readonly RidePoint[]): Promise<ServiceResult<DailyChallengeRideResult>> {
    try {
      const evaluation = evaluateDailyChallenge(challenge, route);
      const wasAlreadyCompleted = challenge.completed;
      const update = await this.requireRepository().updateProgress(
        challenge.challengeId,
        challenge.date,
        evaluation.progress,
        evaluation.completed,
      );
      const updatedChallenge = hydrateDailyChallenge(update.challenge);
      let bonusXp = 0;
      if (evaluation.completed || wasAlreadyCompleted) {
        const progressResult = await this.riderProgressService.recordDailyChallengeCompleted(challenge.challengeId);
        if (progressResult.ok) bonusXp = progressResult.value.xpGained;
      }
      return this.success({
        challenge: updatedChallenge,
        outcome: wasAlreadyCompleted
          ? 'already_completed'
          : evaluation.completed ? 'completed' : 'failed',
        reason: evaluation.reason,
        bonusXp,
      });
    } catch (cause) {
      return this.failure({ code: 'repository_error', message: 'Daily challenge result could not be saved.', cause });
    }
  }

  private requireRepository() {
    const repository = this.context.repositories.dailyChallenges;
    if (!repository) throw new Error('Daily challenge repository is unavailable.');
    return repository;
  }
}

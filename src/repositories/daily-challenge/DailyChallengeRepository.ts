import type { DailyChallengeType } from '@/src/features/daily-challenge';

export type StoredDailyChallenge = {
  readonly challengeId: string;
  readonly date: string;
  readonly type: DailyChallengeType;
  readonly progress: number;
  readonly completed: boolean;
};

export type DailyChallengeProgressUpdate = {
  readonly challenge: StoredDailyChallenge;
  readonly newlyCompleted: boolean;
};

export interface DailyChallengeRepository {
  getByDate(date: string): Promise<StoredDailyChallenge | null>;
  create(challenge: StoredDailyChallenge): Promise<StoredDailyChallenge>;
  updateProgress(challengeId: string, date: string, progress: number, completed: boolean): Promise<DailyChallengeProgressUpdate>;
  clear(): Promise<void>;
}

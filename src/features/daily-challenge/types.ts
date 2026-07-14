export type DailyChallengeType =
  | 'smooth_speed'
  | 'no_stops'
  | 'steady_above_20'
  | 'minimize_slow';

export type DailyRideChallenge = {
  readonly challengeId: string;
  readonly date: string;
  readonly type: DailyChallengeType;
  readonly title: string;
  readonly description: string;
  readonly targetSeconds: number;
  readonly progress: number;
  readonly completed: boolean;
};

export type DailyChallengeEvaluation = {
  readonly progress: number;
  readonly completed: boolean;
  readonly reason: string;
};

export type DailyChallengeRideResult = {
  readonly challenge: DailyRideChallenge;
  readonly outcome: 'completed' | 'failed' | 'already_completed';
  readonly reason: string;
  readonly bonusXp: number;
};

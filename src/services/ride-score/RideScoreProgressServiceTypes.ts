export type RideScoreComparison = {
  readonly currentScore: number;
  readonly previousBestScore: number | null;
  readonly previousLastScore: number | null;
  readonly bestScore: number;
  readonly lastScore: number;
  readonly isPersonalBest: boolean;
  readonly changeFromLast: number | null;
};

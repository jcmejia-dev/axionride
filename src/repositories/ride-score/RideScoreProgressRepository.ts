export type StoredRideScoreProgress = {
  readonly bestScore: number | null;
  readonly lastScore: number | null;
};

export type RecordRideScoreResult = {
  readonly currentScore: number;
  readonly previousBestScore: number | null;
  readonly previousLastScore: number | null;
  readonly bestScore: number;
  readonly lastScore: number;
};

export interface RideScoreProgressRepository {
  getProgress(): Promise<StoredRideScoreProgress>;
  recordScore(score: number): Promise<RecordRideScoreResult>;
  clear(): Promise<void>;
}

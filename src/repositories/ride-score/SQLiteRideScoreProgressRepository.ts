import type { WorkspaceScope } from '@/src/repositories/workspace';
import { getFirst, runStatement, SQLITE_TABLES, withDatabase } from '@/src/storage/sqlite';

import type {
  RecordRideScoreResult,
  RideScoreProgressRepository,
  StoredRideScoreProgress,
} from './RideScoreProgressRepository';

type RideScoreProgressRow = {
  readonly best_score: number | null;
  readonly last_score: number | null;
};

export class SQLiteRideScoreProgressRepository implements RideScoreProgressRepository {
  constructor(private readonly workspaceScope: WorkspaceScope) {}

  async getProgress(): Promise<StoredRideScoreProgress> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const row = await getFirst<RideScoreProgressRow>(
      `SELECT best_score, last_score
       FROM ${SQLITE_TABLES.rideScoreProgress}
       WHERE workspace_id = ? LIMIT 1;`,
      [workspaceId],
    );
    return toProgress(row);
  }

  async recordScore(score: number): Promise<RecordRideScoreResult> {
    const currentScore = normalizeScore(score);
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    let previousBestScore: number | null = null;
    let previousLastScore: number | null = null;

    await withDatabase((database) => database.withExclusiveTransactionAsync(async (transaction) => {
      const current = await transaction.getFirstAsync<RideScoreProgressRow>(
        `SELECT best_score, last_score
         FROM ${SQLITE_TABLES.rideScoreProgress}
         WHERE workspace_id = ? LIMIT 1;`,
        [workspaceId],
      );
      previousBestScore = current?.best_score ?? null;
      previousLastScore = current?.last_score ?? null;
      const nextBestScore = previousBestScore === null
        ? currentScore
        : Math.max(previousBestScore, currentScore);
      await transaction.runAsync(
        `INSERT INTO ${SQLITE_TABLES.rideScoreProgress}
         (workspace_id, best_score, last_score, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(workspace_id) DO UPDATE SET
           best_score = excluded.best_score,
           last_score = excluded.last_score,
           updated_at = excluded.updated_at;`,
        [workspaceId, nextBestScore, currentScore, new Date().toISOString()],
      );
    }));

    return {
      currentScore,
      previousBestScore,
      previousLastScore,
      bestScore: previousBestScore === null ? currentScore : Math.max(previousBestScore, currentScore),
      lastScore: currentScore,
    };
  }

  async clear() {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await runStatement(
      `DELETE FROM ${SQLITE_TABLES.rideScoreProgress} WHERE workspace_id = ?;`,
      [workspaceId],
    );
  }
}

function toProgress(row: RideScoreProgressRow | null): StoredRideScoreProgress {
  return {
    bestScore: row?.best_score ?? null,
    lastScore: row?.last_score ?? null,
  };
}

function normalizeScore(score: number) {
  if (!Number.isFinite(score)) throw new Error('Ride score must be a finite number.');
  return Math.round(Math.max(0, Math.min(100, score)));
}

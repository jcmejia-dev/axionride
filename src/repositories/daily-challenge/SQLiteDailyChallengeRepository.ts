import type { DailyChallengeType } from '@/src/features/daily-challenge';
import type { WorkspaceScope } from '@/src/repositories/workspace';
import { getFirst, runStatement, SQLITE_TABLES, withDatabase } from '@/src/storage/sqlite';

import type {
  DailyChallengeProgressUpdate,
  DailyChallengeRepository,
  StoredDailyChallenge,
} from './DailyChallengeRepository';

type DailyChallengeRow = {
  readonly challenge_id: string;
  readonly challenge_date: string;
  readonly challenge_type: DailyChallengeType;
  readonly progress: number;
  readonly completed: number;
};

export class SQLiteDailyChallengeRepository implements DailyChallengeRepository {
  constructor(private readonly workspaceScope: WorkspaceScope) {}

  async getByDate(date: string) {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const row = await getFirst<DailyChallengeRow>(
      `SELECT challenge_id, challenge_date, challenge_type, progress, completed
       FROM ${SQLITE_TABLES.dailyRideChallenges}
       WHERE workspace_id = ? AND challenge_date = ? LIMIT 1;`,
      [workspaceId, date],
    );
    return row ? toStoredChallenge(row) : null;
  }

  async create(challenge: StoredDailyChallenge) {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await runStatement(
      `INSERT OR IGNORE INTO ${SQLITE_TABLES.dailyRideChallenges}
       (workspace_id, challenge_date, challenge_id, challenge_type, progress, completed, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        workspaceId,
        challenge.date,
        challenge.challengeId,
        challenge.type,
        normalizeProgress(challenge.progress),
        challenge.completed ? 1 : 0,
        challenge.completed ? new Date().toISOString() : null,
        new Date().toISOString(),
      ],
    );
    return (await this.getByDate(challenge.date)) ?? challenge;
  }

  async updateProgress(challengeId: string, date: string, progress: number, completed: boolean): Promise<DailyChallengeProgressUpdate> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    let newlyCompleted = false;
    const normalizedProgress = normalizeProgress(progress);

    await withDatabase((database) => database.withExclusiveTransactionAsync(async (transaction) => {
      const previous = await transaction.getFirstAsync<DailyChallengeRow>(
        `SELECT challenge_id, challenge_date, challenge_type, progress, completed
         FROM ${SQLITE_TABLES.dailyRideChallenges}
         WHERE workspace_id = ? AND challenge_date = ? AND challenge_id = ? LIMIT 1;`,
        [workspaceId, date, challengeId],
      );
      if (!previous) throw new Error('Daily challenge was not initialized.');
      newlyCompleted = completed && previous.completed !== 1;
      const nextCompleted = previous.completed === 1 || completed;
      await transaction.runAsync(
        `UPDATE ${SQLITE_TABLES.dailyRideChallenges}
         SET progress = ?, completed = ?, completed_at = ?, updated_at = ?
         WHERE workspace_id = ? AND challenge_date = ? AND challenge_id = ?;`,
        [
          Math.max(previous.progress, normalizedProgress),
          nextCompleted ? 1 : 0,
          nextCompleted ? new Date().toISOString() : null,
          new Date().toISOString(),
          workspaceId,
          date,
          challengeId,
        ],
      );
    }));

    const challenge = await this.getByDate(date);
    if (!challenge) throw new Error('Daily challenge progress could not be read.');
    return { challenge, newlyCompleted };
  }

  async clear() {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await runStatement(
      `DELETE FROM ${SQLITE_TABLES.dailyRideChallenges} WHERE workspace_id = ?;`,
      [workspaceId],
    );
  }
}

function toStoredChallenge(row: DailyChallengeRow): StoredDailyChallenge {
  return {
    challengeId: row.challenge_id,
    date: row.challenge_date,
    type: row.challenge_type,
    progress: normalizeProgress(row.progress),
    completed: row.completed === 1,
  };
}

function normalizeProgress(progress: number) {
  return Math.round(Math.max(0, Math.min(100, progress)));
}

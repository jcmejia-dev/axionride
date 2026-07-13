import {
  RIDER_ACHIEVEMENT_DEFINITIONS,
  calculateNextRiderStreak,
  type RiderAchievement,
  type RiderAchievementId,
} from "@/src/domain/rider-progress";
import {
  getAll,
  getFirst,
  runStatement,
  SQLITE_TABLES,
  withDatabase,
} from "@/src/storage/sqlite";
import type { WorkspaceScope } from "@/src/repositories/workspace";

import type {
  RecordRiderProgressEventInput,
  RiderProgressRepository,
  StoredRiderProgress,
} from "./RiderProgressRepository";

type ProgressRow = {
  readonly total_xp: number;
  readonly streak_count: number;
  readonly last_active_date: string | null;
};

type AchievementRow = {
  readonly id: RiderAchievementId;
  readonly title: string;
  readonly description: string;
  readonly unlocked: number;
  readonly unlocked_at: string | null;
};

// Repository providers are intentionally lightweight and may be created by
// several services. Keep workspace seeding single-flight across every instance
// so read paths never compete by opening nested/exclusive transactions.
const workspaceInitialization = new Map<string, Promise<void>>();

export class SQLiteRiderProgressRepository implements RiderProgressRepository {
  constructor(private readonly workspaceScope: WorkspaceScope) {}

  async getProgress() {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await this.ensureWorkspaceRows(workspaceId);
    return this.readProgress(workspaceId);
  }

  async getAchievements() {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await this.ensureWorkspaceRows(workspaceId);
    const rows = await getAll<AchievementRow>(
      `SELECT id, title, description, unlocked, unlocked_at
       FROM ${SQLITE_TABLES.riderAchievements}
       WHERE workspace_id = ? ORDER BY rowid ASC;`,
      [workspaceId],
    );
    return rows.map(toAchievement);
  }

  async recordEvent(input: RecordRiderProgressEventInput) {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await this.ensureWorkspaceRows(workspaceId);
    let applied = false;

    await withDatabase((database) =>
      database.withExclusiveTransactionAsync(async (transaction) => {
        const insert = await transaction.runAsync(
          `INSERT OR IGNORE INTO ${SQLITE_TABLES.riderProgressEvents}
           (id, workspace_id, event_type, xp, occurred_at)
           VALUES (?, ?, ?, ?, ?);`,
          [input.id, workspaceId, input.type, input.xp, input.occurredAt],
        );
        applied = insert.changes > 0;
        if (!applied) return;

        const current = await transaction.getFirstAsync<ProgressRow>(
          `SELECT total_xp, streak_count, last_active_date
           FROM ${SQLITE_TABLES.riderProgress} WHERE workspace_id = ? LIMIT 1;`,
          [workspaceId],
        );
        const nextStreak = input.activityDate
          ? calculateNextRiderStreak(current?.streak_count ?? 0, current?.last_active_date ?? null, input.activityDate)
          : null;

        await transaction.runAsync(
          `UPDATE ${SQLITE_TABLES.riderProgress}
           SET total_xp = total_xp + ?,
               streak_count = ?,
               last_active_date = ?,
               updated_at = ?
           WHERE workspace_id = ?;`,
          [
            input.xp,
            nextStreak?.streakCount ?? current?.streak_count ?? 0,
            nextStreak?.lastActiveDate ?? current?.last_active_date ?? null,
            input.occurredAt,
            workspaceId,
          ],
        );
      }),
    );

    return { applied, progress: await this.readProgress(workspaceId) };
  }

  async unlockAchievements(ids: readonly RiderAchievementId[], unlockedAt: string) {
    if (!ids.length) return [];
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await this.ensureWorkspaceRows(workspaceId);
    const newlyUnlocked: RiderAchievement[] = [];

    await withDatabase((database) =>
      database.withExclusiveTransactionAsync(async (transaction) => {
        for (const id of ids) {
          const result = await transaction.runAsync(
            `UPDATE ${SQLITE_TABLES.riderAchievements}
             SET unlocked = 1, unlocked_at = ?
             WHERE workspace_id = ? AND id = ? AND unlocked = 0;`,
            [unlockedAt, workspaceId, id],
          );
          if (result.changes > 0) {
            const definition = RIDER_ACHIEVEMENT_DEFINITIONS.find((item) => item.id === id);
            if (definition) newlyUnlocked.push({ ...definition, unlocked: true, unlockedAt });
          }
        }
      }),
    );

    return newlyUnlocked;
  }

  async clear() {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await withDatabase((database) =>
      database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync(
          `DELETE FROM ${SQLITE_TABLES.riderProgressEvents} WHERE workspace_id = ?;`,
          [workspaceId],
        );
        await transaction.runAsync(
          `DELETE FROM ${SQLITE_TABLES.riderAchievements} WHERE workspace_id = ?;`,
          [workspaceId],
        );
        await transaction.runAsync(
          `DELETE FROM ${SQLITE_TABLES.riderProgress} WHERE workspace_id = ?;`,
          [workspaceId],
        );
      }),
    );
    workspaceInitialization.delete(workspaceId);
  }

  private ensureWorkspaceRows(workspaceId: string) {
    const pending = workspaceInitialization.get(workspaceId);
    if (pending) return pending;

    const initialization = this.seedWorkspaceRows(workspaceId).catch((error: unknown) => {
      if (workspaceInitialization.get(workspaceId) === initialization) {
        workspaceInitialization.delete(workspaceId);
      }
      throw error;
    });
    workspaceInitialization.set(workspaceId, initialization);
    return initialization;
  }

  private async seedWorkspaceRows(workspaceId: string) {
    const now = new Date().toISOString();
    await runStatement(
      `INSERT OR IGNORE INTO ${SQLITE_TABLES.riderProgress}
       (workspace_id, total_xp, streak_count, last_active_date, updated_at)
       VALUES (?, 0, 0, NULL, ?);`,
      [workspaceId, now],
    );
    for (const achievement of RIDER_ACHIEVEMENT_DEFINITIONS) {
      await runStatement(
        `INSERT OR IGNORE INTO ${SQLITE_TABLES.riderAchievements}
         (workspace_id, id, title, description, unlocked, unlocked_at)
         VALUES (?, ?, ?, ?, 0, NULL);`,
        [workspaceId, achievement.id, achievement.title, achievement.description],
      );
    }
  }

  private async readProgress(workspaceId: string): Promise<StoredRiderProgress> {
    const row = await getFirst<ProgressRow>(
      `SELECT total_xp, streak_count, last_active_date
       FROM ${SQLITE_TABLES.riderProgress} WHERE workspace_id = ? LIMIT 1;`,
      [workspaceId],
    );
    return {
      totalXp: row?.total_xp ?? 0,
      streakCount: row?.streak_count ?? 0,
      lastActiveDate: row?.last_active_date ?? null,
    };
  }
}

function toAchievement(row: AchievementRow): RiderAchievement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    unlocked: row.unlocked === 1,
    unlockedAt: row.unlocked_at,
  };
}

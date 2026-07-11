import { validateMotorcycle, type Motorcycle, type MotorcycleId } from '@/src/domain/motorcycle';
import { getAll, getFirst, runStatement, SQLITE_TABLES, withDatabase } from '@/src/storage/sqlite';
import type { WorkspaceScope } from '../workspace';

import type { MotorcycleRepository } from './MotorcycleRepository';
import type {
  MotorcycleDeleteResult,
  MotorcycleRepositoryError,
  MotorcycleRow,
  MotorcycleWriteResult,
} from './MotorcycleRepositoryTypes';

/**
 * SQLite-backed Motorcycle repository.
 *
 * This adapter uses the SQLite foundation only. It does not know about UI,
 * Supabase, sync orchestration, or application screens.
 */
export class SQLiteMotorcycleRepository implements MotorcycleRepository {
  constructor(private readonly workspaceScope: WorkspaceScope) {}

  async getMotorcycle(id: MotorcycleId): Promise<Motorcycle | null> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const row = await getFirst<MotorcycleRow>(
      `SELECT id, payload_json, created_at, updated_at, deleted_at
       FROM ${SQLITE_TABLES.motorcycles}
       WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
       LIMIT 1;`,
      [id, workspaceId],
    );

    return row ? deserializeMotorcycle(row) : null;
  }

  async getAllMotorcycles(): Promise<readonly Motorcycle[]> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const rows = await getAll<MotorcycleRow>(
      `SELECT id, payload_json, created_at, updated_at, deleted_at
       FROM ${SQLITE_TABLES.motorcycles}
       WHERE workspace_id = ? AND deleted_at IS NULL
       ORDER BY is_primary DESC, created_at ASC;`,
      [workspaceId],
    );

    return rows.map(deserializeMotorcycle).filter((motorcycle): motorcycle is Motorcycle => motorcycle !== null);
  }

  async getPrimaryMotorcycle(): Promise<Motorcycle | null> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const row = await getFirst<MotorcycleRow>(
      `SELECT id, payload_json, created_at, updated_at, deleted_at, workspace_id, is_primary
       FROM ${SQLITE_TABLES.motorcycles}
       WHERE workspace_id = ? AND is_primary = 1 AND deleted_at IS NULL LIMIT 1;`, [workspaceId]);
    return row ? deserializeMotorcycle(row) : null;
  }

  async setPrimaryMotorcycle(id: MotorcycleId): Promise<MotorcycleWriteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const motorcycle = await this.getMotorcycle(id);
    if (!motorcycle) return failure({ code: 'not_found', message: `Motorcycle ${id} does not exist.` });
    await withDatabase((database) => database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(`UPDATE ${SQLITE_TABLES.motorcycles} SET is_primary = 0 WHERE workspace_id = ?;`, [workspaceId]);
      await transaction.runAsync(`UPDATE ${SQLITE_TABLES.motorcycles} SET is_primary = 1 WHERE workspace_id = ? AND id = ?;`, [workspaceId, id]);
    }));
    return { ok: true, value: motorcycle };
  }

  async saveMotorcycle(motorcycle: Motorcycle): Promise<MotorcycleWriteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const validationError = validateMotorcycleForWrite(motorcycle);

    if (validationError) {
      return failure(validationError);
    }

    if (await this.motorcycleExists(motorcycle.id)) {
      return failure({ code: 'already_exists', message: `Motorcycle ${motorcycle.id} already exists.` });
    }

    const payloadJson = serializeMotorcycle(motorcycle);

    if (!payloadJson) {
      return failure({ code: 'serialization_failed', message: 'Motorcycle could not be serialized.' });
    }

    await runStatement(
      `INSERT INTO ${SQLITE_TABLES.motorcycles} (id, payload_json, created_at, updated_at, deleted_at, workspace_id, is_primary)
       VALUES (?, ?, ?, ?, NULL, ?, CASE WHEN NOT EXISTS (
         SELECT 1 FROM ${SQLITE_TABLES.motorcycles} WHERE workspace_id = ? AND deleted_at IS NULL
       ) THEN 1 ELSE 0 END);`,
      [motorcycle.id, payloadJson, motorcycle.createdAt, motorcycle.updatedAt, workspaceId, workspaceId],
    );

    if ((await this.getPrimaryMotorcycle()) === null) {
      const replacement = (await this.getAllMotorcycles())[0];
      if (replacement) await this.setPrimaryMotorcycle(replacement.id);
    }

    return { ok: true, value: cloneMotorcycle(motorcycle) };
  }

  async updateMotorcycle(motorcycle: Motorcycle): Promise<MotorcycleWriteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const validationError = validateMotorcycleForWrite(motorcycle);

    if (validationError) {
      return failure(validationError);
    }

    if (!(await this.motorcycleExists(motorcycle.id))) {
      return failure({ code: 'not_found', message: `Motorcycle ${motorcycle.id} does not exist.` });
    }

    const payloadJson = serializeMotorcycle(motorcycle);

    if (!payloadJson) {
      return failure({ code: 'serialization_failed', message: 'Motorcycle could not be serialized.' });
    }

    await runStatement(
      `UPDATE ${SQLITE_TABLES.motorcycles}
       SET payload_json = ?, updated_at = ?, deleted_at = NULL
       WHERE id = ? AND workspace_id = ?;`,
      [payloadJson, motorcycle.updatedAt, motorcycle.id, workspaceId],
    );

    return { ok: true, value: cloneMotorcycle(motorcycle) };
  }

  async deleteMotorcycle(id: MotorcycleId): Promise<MotorcycleDeleteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    if (!(await this.motorcycleExists(id))) {
      return failure({ code: 'not_found', message: `Motorcycle ${id} does not exist.` });
    }

    await runStatement(
      `UPDATE ${SQLITE_TABLES.motorcycles}
       SET deleted_at = ?
       WHERE id = ? AND workspace_id = ?;`,
      [new Date().toISOString(), id, workspaceId],
    );

    if ((await this.getPrimaryMotorcycle()) === null) {
      const replacement = (await this.getAllMotorcycles())[0];
      if (replacement) await this.setPrimaryMotorcycle(replacement.id);
    }

    return { ok: true, value: { id } };
  }

  async motorcycleExists(id: MotorcycleId): Promise<boolean> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const row = await getFirst<{ readonly id: string }>(
      `SELECT id
       FROM ${SQLITE_TABLES.motorcycles}
       WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
       LIMIT 1;`,
      [id, workspaceId],
    );

    return row !== null;
  }

  async clear(): Promise<void> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await runStatement(`DELETE FROM ${SQLITE_TABLES.motorcycles} WHERE workspace_id = ?;`, [workspaceId]);
  }
}

function validateMotorcycleForWrite(motorcycle: Motorcycle): MotorcycleRepositoryError | null {
  const validation = validateMotorcycle(motorcycle);

  if (validation.valid) {
    return null;
  }

  return {
    code: 'validation_failed',
    message: 'Motorcycle failed domain validation.',
    validationIssues: validation.issues,
  };
}

function serializeMotorcycle(motorcycle: Motorcycle): string | null {
  try {
    return JSON.stringify(motorcycle);
  } catch {
    return null;
  }
}

function deserializeMotorcycle(row: MotorcycleRow): Motorcycle | null {
  try {
    const motorcycle = JSON.parse(row.payload_json) as Motorcycle;
    const validation = validateMotorcycle(motorcycle);
    return validation.valid ? cloneMotorcycle(motorcycle) : null;
  } catch {
    return null;
  }
}

function cloneMotorcycle(motorcycle: Motorcycle): Motorcycle {
  return { ...motorcycle };
}

function failure(error: MotorcycleRepositoryError) {
  return { ok: false, error } as const;
}

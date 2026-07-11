import { validateMaintenance, type Maintenance, type MaintenanceId } from '@/src/domain/maintenance';
import { getAll, getFirst, runStatement, SQLITE_TABLES } from '@/src/storage/sqlite';
import type { WorkspaceScope } from '../workspace';

import type { MaintenanceRepository } from './MaintenanceRepository';
import type {
  MaintenanceDeleteResult,
  MaintenanceRepositoryError,
  MaintenanceRow,
  MaintenanceWriteResult,
} from './MaintenanceRepositoryTypes';

/**
 * SQLite-backed Maintenance repository.
 *
 * This adapter uses the SQLite foundation only. It does not know about UI,
 * Supabase, sync orchestration, or application screens.
 */
export class SQLiteMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly workspaceScope: WorkspaceScope) {}

  async getMaintenance(id: MaintenanceId): Promise<Maintenance | null> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const row = await getFirst<MaintenanceRow>(
      `SELECT id, motorcycle_id, payload_json, created_at, updated_at, deleted_at
       FROM ${SQLITE_TABLES.maintenanceRecords}
       WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
       LIMIT 1;`,
      [id, workspaceId],
    );

    return row ? deserializeMaintenance(row) : null;
  }

  async getAllMaintenance(): Promise<readonly Maintenance[]> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const rows = await getAll<MaintenanceRow>(
      `SELECT id, motorcycle_id, payload_json, created_at, updated_at, deleted_at
       FROM ${SQLITE_TABLES.maintenanceRecords}
       WHERE workspace_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC;`,
      [workspaceId],
    );

    return rows.map(deserializeMaintenance).filter((maintenance): maintenance is Maintenance => maintenance !== null);
  }

  async saveMaintenance(maintenance: Maintenance): Promise<MaintenanceWriteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const validationError = validateMaintenanceForWrite(maintenance);

    if (validationError) {
      return failure(validationError);
    }

    if (await this.maintenanceExists(maintenance.id)) {
      return failure({ code: 'already_exists', message: `Maintenance ${maintenance.id} already exists.` });
    }

    const payloadJson = serializeMaintenance(maintenance);

    if (!payloadJson) {
      return failure({ code: 'serialization_failed', message: 'Maintenance could not be serialized.' });
    }

    await runStatement(
      `INSERT INTO ${SQLITE_TABLES.maintenanceRecords}
       (id, motorcycle_id, payload_json, created_at, updated_at, deleted_at, workspace_id)
       VALUES (?, ?, ?, ?, ?, NULL, ?);`,
      [maintenance.id, maintenance.motorcycleId, payloadJson, maintenance.createdAt, maintenance.updatedAt, workspaceId],
    );

    return { ok: true, value: cloneMaintenance(maintenance) };
  }

  async updateMaintenance(maintenance: Maintenance): Promise<MaintenanceWriteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const validationError = validateMaintenanceForWrite(maintenance);

    if (validationError) {
      return failure(validationError);
    }

    if (!(await this.maintenanceExists(maintenance.id))) {
      return failure({ code: 'not_found', message: `Maintenance ${maintenance.id} does not exist.` });
    }

    const payloadJson = serializeMaintenance(maintenance);

    if (!payloadJson) {
      return failure({ code: 'serialization_failed', message: 'Maintenance could not be serialized.' });
    }

    await runStatement(
      `UPDATE ${SQLITE_TABLES.maintenanceRecords}
       SET motorcycle_id = ?, payload_json = ?, updated_at = ?, deleted_at = NULL
       WHERE id = ? AND workspace_id = ?;`,
      [maintenance.motorcycleId, payloadJson, maintenance.updatedAt, maintenance.id, workspaceId],
    );

    return { ok: true, value: cloneMaintenance(maintenance) };
  }

  async deleteMaintenance(id: MaintenanceId): Promise<MaintenanceDeleteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    if (!(await this.maintenanceExists(id))) {
      return failure({ code: 'not_found', message: `Maintenance ${id} does not exist.` });
    }

    await runStatement(
      `UPDATE ${SQLITE_TABLES.maintenanceRecords}
       SET deleted_at = ?
       WHERE id = ? AND workspace_id = ?;`,
      [new Date().toISOString(), id, workspaceId],
    );

    return { ok: true, value: { id } };
  }

  async maintenanceExists(id: MaintenanceId): Promise<boolean> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const row = await getFirst<{ readonly id: string }>(
      `SELECT id
       FROM ${SQLITE_TABLES.maintenanceRecords}
       WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
       LIMIT 1;`,
      [id, workspaceId],
    );

    return row !== null;
  }

  async clear(): Promise<void> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    await runStatement(`DELETE FROM ${SQLITE_TABLES.maintenanceRecords} WHERE workspace_id = ?;`, [workspaceId]);
  }
}

function validateMaintenanceForWrite(maintenance: Maintenance): MaintenanceRepositoryError | null {
  const validation = validateMaintenance(maintenance);

  if (validation.valid) {
    return null;
  }

  return {
    code: 'validation_failed',
    message: 'Maintenance failed domain validation.',
    validationIssues: validation.issues,
  };
}

function serializeMaintenance(maintenance: Maintenance): string | null {
  try {
    return JSON.stringify(maintenance);
  } catch {
    return null;
  }
}

function deserializeMaintenance(row: MaintenanceRow): Maintenance | null {
  try {
    const maintenance = JSON.parse(row.payload_json) as Maintenance;
    const validation = validateMaintenance(maintenance);
    return validation.valid ? cloneMaintenance(maintenance) : null;
  } catch {
    return null;
  }
}

function cloneMaintenance(maintenance: Maintenance): Maintenance {
  return { ...maintenance };
}

function failure(error: MaintenanceRepositoryError) {
  return { ok: false, error } as const;
}

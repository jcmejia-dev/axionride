import {
  validateMaintenance,
  type CreateMaintenanceInput,
  type Maintenance,
  type MaintenanceId,
  type MaintenanceListItem,
  type UpdateMaintenanceInput,
} from "@/src/domain/maintenance";
import {
  getAll,
  getFirst,
  runStatement,
  SQLITE_TABLES,
} from "@/src/storage/sqlite";
import type { WorkspaceScope } from "../workspace";

import type { MaintenanceRepository } from "./MaintenanceRepository";
import type {
  MaintenanceDeleteResult,
  MaintenanceRepositoryError,
  MaintenanceRow,
  MaintenanceWriteResult,
} from "./MaintenanceRepositoryTypes";

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

    return rows
      .map(deserializeMaintenance)
      .filter(
        (maintenance): maintenance is Maintenance => maintenance !== null,
      );
  }

  async getByMotorcycleId(
    motorcycleId: string,
  ): Promise<readonly MaintenanceListItem[]> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const rows = await getAll<MaintenanceRow>(
      `SELECT id, motorcycle_id, payload_json, created_at, updated_at, deleted_at
       FROM ${SQLITE_TABLES.maintenanceRecords}
       WHERE workspace_id = ? AND deleted_at IS NULL AND motorcycle_id = ?
       ORDER BY created_at ASC;`,
      [workspaceId, motorcycleId],
    );

    return rows
      .map(deserializeMaintenance)
      .filter((maintenance): maintenance is Maintenance => maintenance !== null)
      .map(this.toListItem);
  }

  async create(input: CreateMaintenanceInput): Promise<MaintenanceWriteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const maintenance: Maintenance = {
      id,
      motorcycleId: input.motorcycleId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.status,
      priority: input.priority,
      intervalKm: input.intervalKm,
      intervalDays: input.intervalDays,
      lastServiceOdometerKm: input.lastServiceOdometerKm,
      lastServiceDate: input.lastServiceDate,
      nextDueOdometerKm: input.nextDueOdometerKm,
      nextDueDate: input.nextDueDate,
      cost: input.cost,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    const validationError = validateMaintenanceForWrite(maintenance);

    if (validationError) {
      return failure(validationError);
    }

    const payloadJson = serializeMaintenance(maintenance);

    if (!payloadJson) {
      return failure({
        code: "serialization_failed",
        message: "Maintenance could not be serialized.",
      });
    }

    await runStatement(
      `INSERT INTO ${SQLITE_TABLES.maintenanceRecords}
       (id, motorcycle_id, payload_json, created_at, updated_at, deleted_at, workspace_id)
       VALUES (?, ?, ?, ?, ?, NULL, ?);`,
      [
        maintenance.id,
        maintenance.motorcycleId,
        payloadJson,
        maintenance.createdAt,
        maintenance.updatedAt,
        workspaceId,
      ],
    );

    return { ok: true, value: cloneMaintenance(maintenance) };
  }

  async update(input: UpdateMaintenanceInput): Promise<MaintenanceWriteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const existing = await this.getMaintenance(input.id);
    if (!existing) {
      return failure({
        code: "not_found",
        message: `Maintenance ${input.id} does not exist.`,
      });
    }

    const updated: Maintenance = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const validationError = validateMaintenanceForWrite(updated);
    if (validationError) {
      return failure(validationError);
    }

    const payloadJson = serializeMaintenance(updated);

    if (!payloadJson) {
      return failure({
        code: "serialization_failed",
        message: "Maintenance could not be serialized.",
      });
    }

    await runStatement(
      `UPDATE ${SQLITE_TABLES.maintenanceRecords}
       SET motorcycle_id = ?, payload_json = ?, updated_at = ?, deleted_at = NULL
       WHERE id = ? AND workspace_id = ?;`,
      [
        updated.motorcycleId,
        payloadJson,
        updated.updatedAt,
        updated.id,
        workspaceId,
      ],
    );

    return { ok: true, value: cloneMaintenance(updated) };
  }

  async saveMaintenance(
    maintenance: Maintenance,
  ): Promise<MaintenanceWriteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    const validationError = validateMaintenanceForWrite(maintenance);
    if (validationError) {
      return failure(validationError);
    }

    const payloadJson = serializeMaintenance(maintenance);
    if (!payloadJson) {
      return failure({
        code: "serialization_failed",
        message: "Maintenance could not be serialized.",
      });
    }

    const existing = await this.getMaintenance(maintenance.id);
    if (existing) {
      await runStatement(
        `UPDATE ${SQLITE_TABLES.maintenanceRecords}
         SET motorcycle_id = ?, payload_json = ?, updated_at = ?, deleted_at = NULL
         WHERE id = ? AND workspace_id = ?;`,
        [
          maintenance.motorcycleId,
          payloadJson,
          maintenance.updatedAt,
          maintenance.id,
          workspaceId,
        ],
      );
    } else {
      await runStatement(
        `INSERT INTO ${SQLITE_TABLES.maintenanceRecords}
         (id, motorcycle_id, payload_json, created_at, updated_at, deleted_at, workspace_id)
         VALUES (?, ?, ?, ?, ?, NULL, ?);`,
        [
          maintenance.id,
          maintenance.motorcycleId,
          payloadJson,
          maintenance.createdAt,
          maintenance.updatedAt,
          workspaceId,
        ],
      );
    }

    return { ok: true, value: cloneMaintenance(maintenance) };
  }

  async softDelete(id: MaintenanceId): Promise<MaintenanceDeleteResult> {
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();
    if (!(await this.maintenanceExists(id))) {
      return failure({
        code: "not_found",
        message: `Maintenance ${id} does not exist.`,
      });
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
    await runStatement(
      `DELETE FROM ${SQLITE_TABLES.maintenanceRecords} WHERE workspace_id = ?;`,
      [workspaceId],
    );
  }

  private toListItem(maintenance: Maintenance): MaintenanceListItem {
    return {
      id: maintenance.id,
      motorcycleId: maintenance.motorcycleId,
      title: maintenance.title,
      type: maintenance.type,
      status: maintenance.status,
      priority: maintenance.priority,
      nextDueOdometerKm: maintenance.nextDueOdometerKm,
      nextDueDate: maintenance.nextDueDate,
      lastServiceOdometerKm: maintenance.lastServiceOdometerKm,
      lastServiceDate: maintenance.lastServiceDate,
      cost: maintenance.cost,
      createdAt: maintenance.createdAt,
      updatedAt: maintenance.updatedAt,
    };
  }
}

function validateMaintenanceForWrite(
  maintenance: Maintenance,
): MaintenanceRepositoryError | null {
  const validation = validateMaintenance(maintenance);

  if (validation.valid) {
    return null;
  }

  return {
    code: "validation_failed",
    message: validation.issues[0]?.message ?? "Maintenance failed domain validation.",
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

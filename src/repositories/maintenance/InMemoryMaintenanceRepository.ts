import {
  validateMaintenance,
  type CreateMaintenanceInput,
  type Maintenance,
  type MaintenanceId,
  type MaintenanceListItem,
  type UpdateMaintenanceInput,
} from "@/src/domain/maintenance";

import type { MaintenanceRepository } from "./MaintenanceRepository";
import type {
  MaintenanceDeleteResult,
  MaintenanceRepositoryError,
  MaintenanceWriteResult,
} from "./MaintenanceRepositoryTypes";

/**
 * Deterministic in-memory Maintenance repository for demos and tests.
 */
export class InMemoryMaintenanceRepository implements MaintenanceRepository {
  private readonly maintenanceRecords = new Map<MaintenanceId, Maintenance>();

  constructor(initialMaintenance: readonly Maintenance[] = []) {
    for (const maintenance of initialMaintenance) {
      const validation = validateMaintenance(maintenance);

      if (validation.valid && !this.maintenanceRecords.has(maintenance.id)) {
        this.maintenanceRecords.set(
          maintenance.id,
          cloneMaintenance(maintenance),
        );
      }
    }
  }

  async getMaintenance(id: MaintenanceId): Promise<Maintenance | null> {
    const maintenance = this.maintenanceRecords.get(id);
    return maintenance ? cloneMaintenance(maintenance) : null;
  }

  async getAllMaintenance(): Promise<readonly Maintenance[]> {
    return Array.from(this.maintenanceRecords.values(), cloneMaintenance);
  }

  async getByMotorcycleId(
    motorcycleId: string,
  ): Promise<readonly MaintenanceListItem[]> {
    const items: MaintenanceListItem[] = [];
    for (const maintenance of this.maintenanceRecords.values()) {
      if (maintenance.motorcycleId === motorcycleId) {
        items.push(this.toListItem(maintenance));
      }
    }
    return items;
  }

  async create(input: CreateMaintenanceInput): Promise<MaintenanceWriteResult> {
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

    this.maintenanceRecords.set(id, maintenance);
    return { ok: true, value: cloneMaintenance(maintenance) };
  }

  async update(input: UpdateMaintenanceInput): Promise<MaintenanceWriteResult> {
    const existing = this.maintenanceRecords.get(input.id);
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

    this.maintenanceRecords.set(input.id, updated);
    return { ok: true, value: cloneMaintenance(updated) };
  }

  async saveMaintenance(
    maintenance: Maintenance,
  ): Promise<MaintenanceWriteResult> {
    const validationError = validateMaintenanceForWrite(maintenance);
    if (validationError) {
      return failure(validationError);
    }

    this.maintenanceRecords.set(maintenance.id, cloneMaintenance(maintenance));
    return { ok: true, value: cloneMaintenance(maintenance) };
  }

  async softDelete(id: MaintenanceId): Promise<MaintenanceDeleteResult> {
    if (!this.maintenanceRecords.has(id)) {
      return failure({
        code: "not_found",
        message: `Maintenance ${id} does not exist.`,
      });
    }

    this.maintenanceRecords.delete(id);
    return { ok: true, value: { id } };
  }

  async maintenanceExists(id: MaintenanceId): Promise<boolean> {
    return this.maintenanceRecords.has(id);
  }

  async clear(): Promise<void> {
    this.maintenanceRecords.clear();
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

function cloneMaintenance(maintenance: Maintenance): Maintenance {
  return { ...maintenance };
}

function failure(error: MaintenanceRepositoryError) {
  return { ok: false, error } as const;
}

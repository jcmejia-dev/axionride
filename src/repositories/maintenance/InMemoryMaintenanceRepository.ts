import { validateMaintenance, type Maintenance, type MaintenanceId } from '@/src/domain/maintenance';

import type { MaintenanceRepository } from './MaintenanceRepository';
import type {
  MaintenanceDeleteResult,
  MaintenanceRepositoryError,
  MaintenanceWriteResult,
} from './MaintenanceRepositoryTypes';

/**
 * Deterministic in-memory Maintenance repository for demos and tests.
 */
export class InMemoryMaintenanceRepository implements MaintenanceRepository {
  private readonly maintenanceRecords = new Map<MaintenanceId, Maintenance>();

  constructor(initialMaintenance: readonly Maintenance[] = []) {
    for (const maintenance of initialMaintenance) {
      const validation = validateMaintenance(maintenance);

      if (validation.valid && !this.maintenanceRecords.has(maintenance.id)) {
        this.maintenanceRecords.set(maintenance.id, cloneMaintenance(maintenance));
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

  async saveMaintenance(maintenance: Maintenance): Promise<MaintenanceWriteResult> {
    const validationError = validateMaintenanceForWrite(maintenance);

    if (validationError) {
      return failure(validationError);
    }

    if (this.maintenanceRecords.has(maintenance.id)) {
      return failure({ code: 'already_exists', message: `Maintenance ${maintenance.id} already exists.` });
    }

    const maintenanceCopy = cloneMaintenance(maintenance);
    this.maintenanceRecords.set(maintenance.id, maintenanceCopy);
    return { ok: true, value: cloneMaintenance(maintenanceCopy) };
  }

  async updateMaintenance(maintenance: Maintenance): Promise<MaintenanceWriteResult> {
    const validationError = validateMaintenanceForWrite(maintenance);

    if (validationError) {
      return failure(validationError);
    }

    if (!this.maintenanceRecords.has(maintenance.id)) {
      return failure({ code: 'not_found', message: `Maintenance ${maintenance.id} does not exist.` });
    }

    const maintenanceCopy = cloneMaintenance(maintenance);
    this.maintenanceRecords.set(maintenance.id, maintenanceCopy);
    return { ok: true, value: cloneMaintenance(maintenanceCopy) };
  }

  async deleteMaintenance(id: MaintenanceId): Promise<MaintenanceDeleteResult> {
    if (!this.maintenanceRecords.has(id)) {
      return failure({ code: 'not_found', message: `Maintenance ${id} does not exist.` });
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

function cloneMaintenance(maintenance: Maintenance): Maintenance {
  return { ...maintenance };
}

function failure(error: MaintenanceRepositoryError) {
  return { ok: false, error } as const;
}

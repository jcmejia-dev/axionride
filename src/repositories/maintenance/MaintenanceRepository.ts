import type {
  CreateMaintenanceInput,
  Maintenance,
  MaintenanceId,
  MaintenanceListItem,
  UpdateMaintenanceInput,
} from "@/src/domain/maintenance";

import type {
  MaintenanceDeleteResult,
  MaintenanceWriteResult,
} from "./MaintenanceRepositoryTypes";

/**
 * Repository contract for Maintenance persistence.
 *
 * Application code should depend on this abstraction instead of SQLite or any
 * future sync implementation directly.
 */
export interface MaintenanceRepository {
  getMaintenance(id: MaintenanceId): Promise<Maintenance | null>;
  getAllMaintenance(): Promise<readonly Maintenance[]>;
  getByMotorcycleId(
    motorcycleId: string,
  ): Promise<readonly MaintenanceListItem[]>;
  create(input: CreateMaintenanceInput): Promise<MaintenanceWriteResult>;
  update(input: UpdateMaintenanceInput): Promise<MaintenanceWriteResult>;
  saveMaintenance(maintenance: Maintenance): Promise<MaintenanceWriteResult>;
  softDelete(id: MaintenanceId): Promise<MaintenanceDeleteResult>;
  maintenanceExists(id: MaintenanceId): Promise<boolean>;
  clear(): Promise<void>;
}

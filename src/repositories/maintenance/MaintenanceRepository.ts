import type { Maintenance, MaintenanceId } from '@/src/domain/maintenance';

import type { MaintenanceDeleteResult, MaintenanceWriteResult } from './MaintenanceRepositoryTypes';

/**
 * Repository contract for Maintenance persistence.
 *
 * Application code should depend on this abstraction instead of SQLite or any
 * future sync implementation directly.
 */
export interface MaintenanceRepository {
  getMaintenance(id: MaintenanceId): Promise<Maintenance | null>;
  getAllMaintenance(): Promise<readonly Maintenance[]>;
  saveMaintenance(maintenance: Maintenance): Promise<MaintenanceWriteResult>;
  updateMaintenance(maintenance: Maintenance): Promise<MaintenanceWriteResult>;
  deleteMaintenance(id: MaintenanceId): Promise<MaintenanceDeleteResult>;
  maintenanceExists(id: MaintenanceId): Promise<boolean>;
  clear(): Promise<void>;
}

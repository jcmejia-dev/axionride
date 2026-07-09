import type { Motorcycle, MotorcycleId } from '@/src/domain/motorcycle';

import type { MotorcycleDeleteResult, MotorcycleWriteResult } from './MotorcycleRepositoryTypes';

/**
 * Repository contract for Motorcycle persistence.
 *
 * Application code should depend on this abstraction instead of SQLite or any
 * future sync implementation directly.
 */
export interface MotorcycleRepository {
  getMotorcycle(id: MotorcycleId): Promise<Motorcycle | null>;
  getAllMotorcycles(): Promise<readonly Motorcycle[]>;
  saveMotorcycle(motorcycle: Motorcycle): Promise<MotorcycleWriteResult>;
  updateMotorcycle(motorcycle: Motorcycle): Promise<MotorcycleWriteResult>;
  deleteMotorcycle(id: MotorcycleId): Promise<MotorcycleDeleteResult>;
  motorcycleExists(id: MotorcycleId): Promise<boolean>;
  clear(): Promise<void>;
}

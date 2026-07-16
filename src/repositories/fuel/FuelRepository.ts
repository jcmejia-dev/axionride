import type {
    CreateFuelLogInput,
    FuelLog,
    FuelLogId,
    UpdateFuelLogInput,
} from "@/src/domain/fuel";

/**
 * Repository interface for fuel log persistence.
 */
export interface FuelRepository {
  getAll(workspaceId: string): Promise<readonly FuelLog[]>;
  getById(id: FuelLogId): Promise<FuelLog | null>;
  getByMotorcycleId(motorcycleId: string): Promise<readonly FuelLog[]>;
  create(input: CreateFuelLogInput): Promise<FuelLog>;
  update(input: UpdateFuelLogInput): Promise<FuelLog>;
  softDelete(id: FuelLogId): Promise<void>;
}

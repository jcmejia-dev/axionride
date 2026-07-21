import type {
    CreateFuelLogInput,
    FuelLog,
    FuelLogId,
    UpdateFuelLogInput,
} from "@/src/domain/fuel";
import type { FuelRepository } from "./FuelRepository";

/**
 * Deterministic in-memory Fuel repository for demos and tests.
 */
export class InMemoryFuelRepository implements FuelRepository {
  private readonly fuelLogs = new Map<FuelLogId, FuelLog>();

  async getAll(_workspaceId: string): Promise<readonly FuelLog[]> {
    return Array.from(this.fuelLogs.values()).sort((a, b) =>
      b.recordedAt.localeCompare(a.recordedAt),
    );
  }

  async getById(id: FuelLogId): Promise<FuelLog | null> {
    return this.fuelLogs.get(id) ?? null;
  }

  async getByMotorcycleId(motorcycleId: string): Promise<readonly FuelLog[]> {
    return Array.from(this.fuelLogs.values())
      .filter((log) => log.motorcycleId === motorcycleId)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  }

  async create(input: CreateFuelLogInput): Promise<FuelLog> {
    const now = new Date().toISOString();
    const id = `fuel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let pricePerLiter = input.pricePerLiter ?? 0;
    let liters = input.liters ?? 0;
    let totalCost = input.totalCost ?? 0;

    if (input.pricePerLiter && input.liters && !input.totalCost) {
      totalCost = input.pricePerLiter * input.liters;
    } else if (input.pricePerLiter && input.totalCost && !input.liters) {
      liters = input.totalCost / input.pricePerLiter;
    } else if (input.liters && input.totalCost && !input.pricePerLiter) {
      pricePerLiter = input.totalCost / input.liters;
    }

    const fuelLog: FuelLog = {
      id,
      motorcycleId: input.motorcycleId,
      recordedAt: input.recordedAt,
      odometerKm: input.odometerKm,
      pricePerLiter,
      liters,
      totalCost,
      fillType: input.fillType,
      stationName: input.stationName,
      latitude: input.latitude,
      longitude: input.longitude,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.fuelLogs.set(id, fuelLog);
    return fuelLog;
  }

  async update(input: UpdateFuelLogInput): Promise<FuelLog> {
    const existing = this.fuelLogs.get(input.id);
    if (!existing) {
      throw new Error(`FuelLog not found: ${input.id}`);
    }

    const now = new Date().toISOString();
    const recalculatedCost =
      input.pricePerLiter !== undefined && input.liters !== undefined
        ? input.pricePerLiter * input.liters
        : undefined;

    const updated: FuelLog = {
      ...existing,
      recordedAt: input.recordedAt ?? existing.recordedAt,
      odometerKm: input.odometerKm ?? existing.odometerKm,
      pricePerLiter: input.pricePerLiter ?? existing.pricePerLiter,
      liters: input.liters ?? existing.liters,
      totalCost: recalculatedCost ?? input.totalCost ?? existing.totalCost,
      fillType: input.fillType ?? existing.fillType,
      stationName: input.stationName ?? existing.stationName,
      latitude: input.latitude ?? existing.latitude,
      longitude: input.longitude ?? existing.longitude,
      notes: input.notes ?? existing.notes,
      updatedAt: now,
    };

    this.fuelLogs.set(input.id, updated);
    return updated;
  }

  async softDelete(id: FuelLogId): Promise<void> {
    const existing = this.fuelLogs.get(id);
    if (existing) {
      const now = new Date().toISOString();
      this.fuelLogs.set(id, { ...existing, deletedAt: now, updatedAt: now });
    }
  }
}

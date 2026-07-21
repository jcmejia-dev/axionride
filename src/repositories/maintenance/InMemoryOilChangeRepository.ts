import type {
    CreateOilChangeInput,
    OilChange,
    OilChangeId,
    UpdateOilChangeInput,
} from "@/src/domain/maintenance";
import type { OilChangeRepository } from "./OilChangeRepository";

/**
 * Deterministic in-memory OilChange repository for demos and tests.
 */
export class InMemoryOilChangeRepository implements OilChangeRepository {
  private readonly oilChanges = new Map<OilChangeId, OilChange>();

  constructor(initialOilChanges: readonly OilChange[] = []) {
    for (const oilChange of initialOilChanges) {
      this.oilChanges.set(oilChange.id, cloneOilChange(oilChange));
    }
  }

  async getAll(workspaceId: string): Promise<readonly OilChange[]> {
    return Array.from(this.oilChanges.values(), cloneOilChange);
  }

  async getById(id: OilChangeId): Promise<OilChange | null> {
    const oilChange = this.oilChanges.get(id);
    return oilChange ? cloneOilChange(oilChange) : null;
  }

  async getByMotorcycleId(motorcycleId: string): Promise<readonly OilChange[]> {
    const items: OilChange[] = [];
    for (const oilChange of this.oilChanges.values()) {
      if (oilChange.motorcycleId === motorcycleId) {
        items.push(cloneOilChange(oilChange));
      }
    }
    return items;
  }

  async create(input: CreateOilChangeInput): Promise<OilChange> {
    const id = `oil-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const oilChange: OilChange = {
      id,
      motorcycleId: input.motorcycleId,
      performedAt: input.performedAt,
      odometerKm: input.odometerKm,
      oilBrand: input.oilBrand,
      oilViscosity: input.oilViscosity,
      oilLiters: input.oilLiters,
      price: input.price,
      serviceShop: input.serviceShop,
      notes: input.notes,
      nextDueOdometerKm: input.nextDueOdometerKm,
      nextDueDate: input.nextDueDate,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.oilChanges.set(id, oilChange);
    return cloneOilChange(oilChange);
  }

  async update(input: UpdateOilChangeInput): Promise<OilChange> {
    const existing = this.oilChanges.get(input.id);
    if (!existing) {
      throw new Error(`OilChange not found: ${input.id}`);
    }

    const now = new Date().toISOString();
    const updated: OilChange = {
      ...existing,
      performedAt: input.performedAt ?? existing.performedAt,
      odometerKm: input.odometerKm ?? existing.odometerKm,
      oilBrand: input.oilBrand ?? existing.oilBrand,
      oilViscosity: input.oilViscosity ?? existing.oilViscosity,
      oilLiters: input.oilLiters ?? existing.oilLiters,
      price: input.price ?? existing.price,
      serviceShop: input.serviceShop ?? existing.serviceShop,
      notes: input.notes ?? existing.notes,
      nextDueOdometerKm: input.nextDueOdometerKm ?? existing.nextDueOdometerKm,
      nextDueDate: input.nextDueDate ?? existing.nextDueDate,
      updatedAt: now,
    };

    this.oilChanges.set(input.id, updated);
    return cloneOilChange(updated);
  }

  async softDelete(id: OilChangeId): Promise<void> {
    const existing = this.oilChanges.get(id);
    if (!existing) {
      throw new Error(`OilChange not found: ${id}`);
    }

    const deleted: OilChange = {
      ...existing,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.oilChanges.set(id, deleted);
  }
}

function cloneOilChange(oilChange: OilChange): OilChange {
  return { ...oilChange };
}

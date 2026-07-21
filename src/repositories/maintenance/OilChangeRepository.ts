import type {
    CreateOilChangeInput,
    OilChange,
    OilChangeId,
    UpdateOilChangeInput,
} from "@/src/domain/maintenance";
import type { WorkspaceScope } from "@/src/repositories/workspace";
import {
    getAll,
    getFirst,
    runStatement,
    withDatabase,
} from "@/src/storage/sqlite";

const TABLE_NAME = "oil_changes";

export interface OilChangeRepository {
  getAll(workspaceId: string): Promise<readonly OilChange[]>;
  getById(id: OilChangeId): Promise<OilChange | null>;
  getByMotorcycleId(motorcycleId: string): Promise<readonly OilChange[]>;
  create(input: CreateOilChangeInput): Promise<OilChange>;
  update(input: UpdateOilChangeInput): Promise<OilChange>;
  softDelete(id: OilChangeId): Promise<void>;
}

export class SQLiteOilChangeRepository implements OilChangeRepository {
  constructor(private readonly workspaceScope: WorkspaceScope) {}

  async getAll(workspaceId: string): Promise<readonly OilChange[]> {
    const rows = await getAll<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY performed_at DESC`,
      [workspaceId],
    );
    return rows.map(rowToOilChange);
  }

  async getById(id: OilChangeId): Promise<OilChange | null> {
    const row = await getFirst<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? rowToOilChange(row) : null;
  }

  async getByMotorcycleId(motorcycleId: string): Promise<readonly OilChange[]> {
    const rows = await getAll<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE motorcycle_id = ? AND deleted_at IS NULL ORDER BY performed_at DESC`,
      [motorcycleId],
    );
    return rows.map(rowToOilChange);
  }

  async create(input: CreateOilChangeInput): Promise<OilChange> {
    const now = new Date().toISOString();
    const id = `oil-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
    };

    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();

    await withDatabase(async () => {
      await runStatement(
        `INSERT INTO ${TABLE_NAME} (id, workspace_id, motorcycle_id, performed_at, odometer_km, oil_brand, oil_viscosity, oil_liters, price, service_shop, notes, next_due_odometer_km, next_due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          oilChange.id,
          workspaceId,
          oilChange.motorcycleId,
          oilChange.performedAt,
          oilChange.odometerKm,
          oilChange.oilBrand ?? null,
          oilChange.oilViscosity ?? null,
          oilChange.oilLiters ?? null,
          oilChange.price ?? null,
          oilChange.serviceShop ?? null,
          oilChange.notes ?? null,
          oilChange.nextDueOdometerKm ?? null,
          oilChange.nextDueDate ?? null,
          oilChange.createdAt,
          oilChange.updatedAt,
        ],
      );
    });

    return oilChange;
  }

  async update(input: UpdateOilChangeInput): Promise<OilChange> {
    const existing = await this.getById(input.id);
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

    await withDatabase(async () => {
      await runStatement(
        `UPDATE ${TABLE_NAME} SET performed_at = ?, odometer_km = ?, oil_brand = ?, oil_viscosity = ?, oil_liters = ?, price = ?, service_shop = ?, notes = ?, next_due_odometer_km = ?, next_due_date = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
        [
          updated.performedAt,
          updated.odometerKm,
          updated.oilBrand ?? null,
          updated.oilViscosity ?? null,
          updated.oilLiters ?? null,
          updated.price ?? null,
          updated.serviceShop ?? null,
          updated.notes ?? null,
          updated.nextDueOdometerKm ?? null,
          updated.nextDueDate ?? null,
          updated.updatedAt,
          updated.id,
        ],
      );
    });

    return updated;
  }

  async softDelete(id: OilChangeId): Promise<void> {
    await withDatabase(async () => {
      await runStatement(
        `UPDATE ${TABLE_NAME} SET deleted_at = ? WHERE id = ?`,
        [new Date().toISOString(), id],
      );
    });
  }
}

function rowToOilChange(row: Record<string, unknown>): OilChange {
  return {
    id: row.id as string,
    motorcycleId: row.motorcycle_id as string,
    performedAt: row.performed_at as string,
    odometerKm: row.odometer_km as number,
    oilBrand: row.oil_brand as string | undefined,
    oilViscosity: row.oil_viscosity as string | undefined,
    oilLiters: row.oil_liters as number | undefined,
    price: row.price as number | undefined,
    serviceShop: row.service_shop as string | undefined,
    notes: row.notes as string | undefined,
    nextDueOdometerKm: row.next_due_odometer_km as number | undefined,
    nextDueDate: row.next_due_date as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: row.deleted_at as string | null | undefined,
  };
}

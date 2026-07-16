import type {
  CreateFuelLogInput,
  FuelLog,
  FuelLogId,
  UpdateFuelLogInput,
} from "@/src/domain/fuel";
import type { WorkspaceScope } from "@/src/repositories/workspace";
import {
  getAll,
  getFirst,
  runStatement,
  withDatabase
} from "@/src/storage/sqlite";

import type { FuelRepository } from "./FuelRepository";

const TABLE_NAME = "fuel_logs";

export class SQLiteFuelRepository implements FuelRepository {
  constructor(private readonly workspaceScope: WorkspaceScope) {}

  async getAll(workspaceId: string): Promise<readonly FuelLog[]> {
    const rows = await getAll<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY recorded_at DESC`,
      [workspaceId],
    );
    return rows.map(rowToFuelLog);
  }

  async getById(id: FuelLogId): Promise<FuelLog | null> {
    const row = await getFirst<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? rowToFuelLog(row) : null;
  }

  async getByMotorcycleId(motorcycleId: string): Promise<readonly FuelLog[]> {
    const rows = await getAll<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE motorcycle_id = ? AND deleted_at IS NULL ORDER BY recorded_at DESC`,
      [motorcycleId],
    );
    return rows.map(rowToFuelLog);
  }

  async create(input: CreateFuelLogInput): Promise<FuelLog> {
    const now = new Date().toISOString();
    const id = `fuel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Calculate totalCost, pricePerLiter, liters when one is missing
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

    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();

    await withDatabase(async () => {
      await runStatement(
        `INSERT INTO ${TABLE_NAME} (id, workspace_id, motorcycle_id, recorded_at, odometer_km, price_per_liter, liters, total_cost, fill_type, station_name, latitude, longitude, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fuelLog.id,
          workspaceId,
          fuelLog.motorcycleId,
          fuelLog.recordedAt,
          fuelLog.odometerKm,
          fuelLog.pricePerLiter,
          fuelLog.liters,
          fuelLog.totalCost,
          fuelLog.fillType,
          fuelLog.stationName ?? null,
          fuelLog.latitude ?? null,
          fuelLog.longitude ?? null,
          fuelLog.notes ?? null,
          fuelLog.createdAt,
          fuelLog.updatedAt,
        ],
      );
    });

    return fuelLog;
  }

  async update(input: UpdateFuelLogInput): Promise<FuelLog> {
    const existing = await this.getById(input.id);
    if (!existing) {
      throw new Error(`FuelLog not found: ${input.id}`);
    }

    const now = new Date().toISOString();
    const recalculatedCost =
      input.pricePerLiter !== undefined && input.liters !== undefined
        ? input.pricePerLiter * input.liters
        : undefined;

    const merged: FuelLog = {
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

    await withDatabase(async () => {
      await runStatement(
        `UPDATE ${TABLE_NAME} SET recorded_at = ?, odometer_km = ?, price_per_liter = ?, liters = ?, total_cost = ?, fill_type = ?, station_name = ?, latitude = ?, longitude = ?, notes = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
        [
          merged.recordedAt,
          merged.odometerKm,
          merged.pricePerLiter,
          merged.liters,
          merged.totalCost,
          merged.fillType,
          merged.stationName ?? null,
          merged.latitude ?? null,
          merged.longitude ?? null,
          merged.notes ?? null,
          merged.updatedAt,
          merged.id,
        ],
      );
    });

    return merged;
  }

  async softDelete(id: FuelLogId): Promise<void> {
    await withDatabase(async () => {
      await runStatement(
        `UPDATE ${TABLE_NAME} SET deleted_at = ? WHERE id = ?`,
        [new Date().toISOString(), id],
      );
    });
  }
}

function rowToFuelLog(row: Record<string, unknown>): FuelLog {
  return {
    id: row.id as string,
    motorcycleId: row.motorcycle_id as string,
    recordedAt: row.recorded_at as string,
    odometerKm: row.odometer_km as number,
    pricePerLiter: row.price_per_liter as number,
    liters: row.liters as number,
    totalCost: row.total_cost as number,
    fillType: row.fill_type as "full_tank" | "partial_refill",
    stationName: row.station_name as string | undefined,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: row.deleted_at as string | null | undefined,
  };
}

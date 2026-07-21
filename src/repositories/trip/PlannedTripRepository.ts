import type {
    CreatePlannedTripInput,
    PlannedTrip,
    PlannedTripId,
    UpdatePlannedTripInput,
} from "@/src/domain/trip";
import type { WorkspaceScope } from "@/src/repositories/workspace";
import {
    getAll,
    getFirst,
    runStatement,
    withDatabase,
} from "@/src/storage/sqlite";

const TABLE_NAME = "planned_trips";

export interface PlannedTripRepository {
  getAll(workspaceId: string): Promise<readonly PlannedTrip[]>;
  getById(id: PlannedTripId): Promise<PlannedTrip | null>;
  getByMotorcycleId(motorcycleId: string): Promise<readonly PlannedTrip[]>;
  create(input: CreatePlannedTripInput): Promise<PlannedTrip>;
  update(input: UpdatePlannedTripInput): Promise<PlannedTrip>;
  softDelete(id: PlannedTripId): Promise<void>;
}

export class SQLitePlannedTripRepository implements PlannedTripRepository {
  constructor(private readonly workspaceScope: WorkspaceScope) {}

  async getAll(workspaceId: string): Promise<readonly PlannedTrip[]> {
    const rows = await getAll<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [workspaceId],
    );
    return rows.map(rowToPlannedTrip);
  }

  async getById(id: PlannedTripId): Promise<PlannedTrip | null> {
    const row = await getFirst<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? rowToPlannedTrip(row) : null;
  }

  async getByMotorcycleId(
    motorcycleId: string,
  ): Promise<readonly PlannedTrip[]> {
    const rows = await getAll<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE motorcycle_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [motorcycleId],
    );
    return rows.map(rowToPlannedTrip);
  }

  async create(input: CreatePlannedTripInput): Promise<PlannedTrip> {
    const now = new Date().toISOString();
    const id = `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const workspaceId = await this.workspaceScope.getActiveWorkspaceId();

    const trip: PlannedTrip = {
      id,
      workspaceId,
      motorcycleId: input.motorcycleId,
      title: input.title,
      notes: input.notes,
      startLatitude: input.startLatitude,
      startLongitude: input.startLongitude,
      startLabel: input.startLabel,
      destinationLatitude: input.destinationLatitude,
      destinationLongitude: input.destinationLongitude,
      destinationLabel: input.destinationLabel,
      status: input.status || "draft",
      createdAt: now,
      updatedAt: now,
    };

    await withDatabase(async () => {
      await runStatement(
        `INSERT INTO ${TABLE_NAME} (id, workspace_id, motorcycle_id, title, notes, start_latitude, start_longitude, start_label, destination_latitude, destination_longitude, destination_label, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.id,
          trip.workspaceId,
          trip.motorcycleId,
          trip.title,
          trip.notes ?? null,
          trip.startLatitude,
          trip.startLongitude,
          trip.startLabel ?? null,
          trip.destinationLatitude,
          trip.destinationLongitude,
          trip.destinationLabel ?? null,
          trip.status,
          trip.createdAt,
          trip.updatedAt,
        ],
      );
    });

    return trip;
  }

  async update(input: UpdatePlannedTripInput): Promise<PlannedTrip> {
    const existing = await this.getById(input.id);
    if (!existing) {
      throw new Error(`PlannedTrip not found: ${input.id}`);
    }

    const now = new Date().toISOString();
    const updated: PlannedTrip = {
      ...existing,
      title: input.title ?? existing.title,
      notes: input.notes ?? existing.notes,
      startLatitude: input.startLatitude ?? existing.startLatitude,
      startLongitude: input.startLongitude ?? existing.startLongitude,
      startLabel: input.startLabel ?? existing.startLabel,
      destinationLatitude:
        input.destinationLatitude ?? existing.destinationLatitude,
      destinationLongitude:
        input.destinationLongitude ?? existing.destinationLongitude,
      destinationLabel: input.destinationLabel ?? existing.destinationLabel,
      status: input.status ?? existing.status,
      updatedAt: now,
    };

    await withDatabase(async () => {
      await runStatement(
        `UPDATE ${TABLE_NAME} SET title = ?, notes = ?, start_latitude = ?, start_longitude = ?, start_label = ?, destination_latitude = ?, destination_longitude = ?, destination_label = ?, status = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
        [
          updated.title,
          updated.notes ?? null,
          updated.startLatitude,
          updated.startLongitude,
          updated.startLabel ?? null,
          updated.destinationLatitude,
          updated.destinationLongitude,
          updated.destinationLabel ?? null,
          updated.status,
          updated.updatedAt,
          updated.id,
        ],
      );
    });

    return updated;
  }

  async softDelete(id: PlannedTripId): Promise<void> {
    await withDatabase(async () => {
      await runStatement(
        `UPDATE ${TABLE_NAME} SET deleted_at = ? WHERE id = ?`,
        [new Date().toISOString(), id],
      );
    });
  }
}

function rowToPlannedTrip(row: Record<string, unknown>): PlannedTrip {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    motorcycleId: row.motorcycle_id as string,
    title: row.title as string,
    notes: row.notes as string | undefined,
    startLatitude: row.start_latitude as number,
    startLongitude: row.start_longitude as number,
    startLabel: row.start_label as string | undefined,
    destinationLatitude: row.destination_latitude as number,
    destinationLongitude: row.destination_longitude as number,
    destinationLabel: row.destination_label as string | undefined,
    routeDistanceMeters: row.route_distance_meters as number | undefined,
    routeDurationSeconds: row.route_duration_seconds as number | undefined,
    routeGeometryJson: row.route_geometry_json as string | undefined,
    status: row.status as PlannedTrip["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: row.deleted_at as string | null | undefined,
  };
}

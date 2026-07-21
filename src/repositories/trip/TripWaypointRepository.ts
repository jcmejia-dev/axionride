import type {
    CreateTripWaypointInput,
    TripWaypoint,
    TripWaypointId,
    UpdateTripWaypointInput,
} from "@/src/domain/trip";
import {
    getAll,
    getFirst,
    runStatement,
    withDatabase,
} from "@/src/storage/sqlite";

const TABLE_NAME = "trip_waypoints";

export interface TripWaypointRepository {
  getByTripId(tripId: string): Promise<readonly TripWaypoint[]>;
  create(input: CreateTripWaypointInput): Promise<TripWaypoint>;
  update(input: UpdateTripWaypointInput): Promise<TripWaypoint>;
  delete(id: TripWaypointId): Promise<void>;
  deleteByTripId(tripId: string): Promise<void>;
}

export class SQLiteTripWaypointRepository implements TripWaypointRepository {
  async getByTripId(tripId: string): Promise<readonly TripWaypoint[]> {
    const rows = await getAll<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE trip_id = ? ORDER BY sequence ASC`,
      [tripId],
    );
    return rows.map(rowToTripWaypoint);
  }

  async create(input: CreateTripWaypointInput): Promise<TripWaypoint> {
    const now = new Date().toISOString();
    const id = `waypoint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const waypoint: TripWaypoint = {
      id,
      tripId: input.tripId,
      sequence: input.sequence,
      latitude: input.latitude,
      longitude: input.longitude,
      label: input.label,
      createdAt: now,
      updatedAt: now,
    };

    await withDatabase(async () => {
      await runStatement(
        `INSERT INTO ${TABLE_NAME} (id, trip_id, sequence, latitude, longitude, label, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          waypoint.id,
          waypoint.tripId,
          waypoint.sequence,
          waypoint.latitude,
          waypoint.longitude,
          waypoint.label ?? null,
          waypoint.createdAt,
          waypoint.updatedAt,
        ],
      );
    });

    return waypoint;
  }

  async update(input: UpdateTripWaypointInput): Promise<TripWaypoint> {
    const existing = await this.getById(input.id);
    if (!existing) {
      throw new Error(`TripWaypoint not found: ${input.id}`);
    }

    const now = new Date().toISOString();
    const updated: TripWaypoint = {
      ...existing,
      sequence: input.sequence ?? existing.sequence,
      latitude: input.latitude ?? existing.latitude,
      longitude: input.longitude ?? existing.longitude,
      label: input.label ?? existing.label,
      updatedAt: now,
    };

    await withDatabase(async () => {
      await runStatement(
        `UPDATE ${TABLE_NAME} SET sequence = ?, latitude = ?, longitude = ?, label = ?, updated_at = ? WHERE id = ?`,
        [
          updated.sequence,
          updated.latitude,
          updated.longitude,
          updated.label ?? null,
          updated.updatedAt,
          updated.id,
        ],
      );
    });

    return updated;
  }

  async delete(id: TripWaypointId): Promise<void> {
    await withDatabase(async () => {
      await runStatement(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    });
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await withDatabase(async () => {
      await runStatement(`DELETE FROM ${TABLE_NAME} WHERE trip_id = ?`, [
        tripId,
      ]);
    });
  }

  private async getById(id: TripWaypointId): Promise<TripWaypoint | null> {
    const row = await getFirst<Record<string, unknown>>(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id],
    );
    return row ? rowToTripWaypoint(row) : null;
  }
}

function rowToTripWaypoint(row: Record<string, unknown>): TripWaypoint {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    sequence: row.sequence as number,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    label: row.label as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

import { validateRide, type Ride, type RideId, type RidePoint } from '@/src/domain/ride';
import { getAll, getFirst, SQLITE_TABLES, type AxionRideDatabase, withDatabase } from '@/src/storage/sqlite';

import type { RideRepository } from './RideRepository';
import type { RideDeleteResult, RideRepositoryError, RideWriteResult } from './RideRepositoryTypes';

type RideRow = {
  readonly id: string;
  readonly motorcycle_id: string;
  readonly payload_json: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
};

type RidePointRow = {
  readonly id: string;
  readonly ride_id: string;
  readonly sequence: number;
  readonly payload_json: string;
  readonly created_at: string;
};

/**
 * SQLite-backed Ride repository.
 *
 * Persists the ride aggregate and its route breadcrumbs using the SQLite
 * foundation. It does not collect GPS points or interact with maps.
 */
export class SQLiteRideRepository implements RideRepository {
  async getRide(id: RideId): Promise<Ride | null> {
    const row = await getFirst<RideRow>(
      `SELECT id, motorcycle_id, payload_json, created_at, updated_at, deleted_at
       FROM ${SQLITE_TABLES.rides}
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1;`,
      [id],
    );

    if (!row) {
      return null;
    }

    const points = await getRidePoints(id);
    return deserializeRide(row, points);
  }

  async getAllRides(): Promise<readonly Ride[]> {
    const rows = await getAll<RideRow>(
      `SELECT id, motorcycle_id, payload_json, created_at, updated_at, deleted_at
       FROM ${SQLITE_TABLES.rides}
       WHERE deleted_at IS NULL
       ORDER BY created_at ASC;`,
    );
    const rides: Ride[] = [];

    for (const row of rows) {
      const points = await getRidePoints(row.id);
      const ride = deserializeRide(row, points);

      if (ride) {
        rides.push(ride);
      }
    }

    return rides;
  }

  async saveRide(ride: Ride): Promise<RideWriteResult> {
    const validationError = validateRideForWrite(ride);

    if (validationError) {
      return failure(validationError);
    }

    if (await this.rideExists(ride.id)) {
      return failure({ code: 'already_exists', message: `Ride ${ride.id} already exists.` });
    }

    const payloadJson = serializeRide(ride);

    if (!payloadJson) {
      return failure({ code: 'validation_failed', message: 'Ride could not be serialized.' });
    }

    await withDatabase((database) =>
      database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync(
          `INSERT INTO ${SQLITE_TABLES.rides}
           (id, motorcycle_id, payload_json, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, NULL);`,
          [ride.id, ride.motorcycleId, payloadJson, ride.createdAt, ride.updatedAt],
        );
        await replaceRidePoints(transaction, ride);
      }),
    );

    return { ok: true, value: cloneRide(ride) };
  }

  async updateRide(ride: Ride): Promise<RideWriteResult> {
    const validationError = validateRideForWrite(ride);

    if (validationError) {
      return failure(validationError);
    }

    if (!(await this.rideExists(ride.id))) {
      return failure({ code: 'not_found', message: `Ride ${ride.id} does not exist.` });
    }

    const payloadJson = serializeRide(ride);

    if (!payloadJson) {
      return failure({ code: 'validation_failed', message: 'Ride could not be serialized.' });
    }

    await withDatabase((database) =>
      database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync(
          `UPDATE ${SQLITE_TABLES.rides}
           SET motorcycle_id = ?, payload_json = ?, updated_at = ?, deleted_at = NULL
           WHERE id = ?;`,
          [ride.motorcycleId, payloadJson, ride.updatedAt, ride.id],
        );
        await replaceRidePoints(transaction, ride);
      }),
    );

    return { ok: true, value: cloneRide(ride) };
  }

  async deleteRide(id: RideId): Promise<RideDeleteResult> {
    if (!(await this.rideExists(id))) {
      return failure({ code: 'not_found', message: `Ride ${id} does not exist.` });
    }

    await withDatabase((database) =>
      database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync(
          `UPDATE ${SQLITE_TABLES.rides}
           SET deleted_at = ?
           WHERE id = ?;`,
          [new Date().toISOString(), id],
        );
        await transaction.runAsync(
          `DELETE FROM ${SQLITE_TABLES.ridePoints}
           WHERE ride_id = ?;`,
          [id],
        );
      }),
    );

    return { ok: true, value: { id } };
  }

  async rideExists(id: RideId): Promise<boolean> {
    const row = await getFirst<{ readonly id: string }>(
      `SELECT id
       FROM ${SQLITE_TABLES.rides}
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1;`,
      [id],
    );

    return row !== null;
  }

  async clear(): Promise<void> {
    await withDatabase((database) =>
      database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync(`DELETE FROM ${SQLITE_TABLES.ridePoints};`);
        await transaction.runAsync(`DELETE FROM ${SQLITE_TABLES.rides};`);
      }),
    );
  }
}

async function getRidePoints(rideId: RideId) {
  const rows = await getAll<RidePointRow>(
    `SELECT id, ride_id, sequence, payload_json, created_at
     FROM ${SQLITE_TABLES.ridePoints}
     WHERE ride_id = ?
     ORDER BY sequence ASC;`,
    [rideId],
  );

  return rows.map(deserializeRidePoint).filter((point): point is RidePoint => point !== null);
}

async function replaceRidePoints(database: AxionRideDatabase, ride: Ride) {
  await database.runAsync(
    `DELETE FROM ${SQLITE_TABLES.ridePoints}
     WHERE ride_id = ?;`,
    [ride.id],
  );

  for (const [sequence, point] of ride.route.entries()) {
    await database.runAsync(
      `INSERT INTO ${SQLITE_TABLES.ridePoints}
       (id, ride_id, sequence, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?);`,
      [createRidePointId(ride.id, sequence), ride.id, sequence, JSON.stringify(point), point.timestamp],
    );
  }
}

function validateRideForWrite(ride: Ride): RideRepositoryError | null {
  const validation = validateRide(ride);

  if (validation.valid) {
    return null;
  }

  return {
    code: 'validation_failed',
    message: 'Ride failed domain validation.',
    validationIssues: validation.issues,
  };
}

function serializeRide(ride: Ride): string | null {
  try {
    return JSON.stringify({ ...ride, route: [] });
  } catch {
    return null;
  }
}

function deserializeRide(row: RideRow, route: readonly RidePoint[]): Ride | null {
  try {
    const ride = {
      ...(JSON.parse(row.payload_json) as Ride),
      route,
    };
    const validation = validateRide(ride);
    return validation.valid ? cloneRide(ride) : null;
  } catch {
    return null;
  }
}

function deserializeRidePoint(row: RidePointRow): RidePoint | null {
  try {
    return JSON.parse(row.payload_json) as RidePoint;
  } catch {
    return null;
  }
}

function createRidePointId(rideId: RideId, sequence: number) {
  return `${rideId}:point:${sequence}`;
}

function cloneRide(ride: Ride): Ride {
  return {
    ...ride,
    weather: ride.weather ? { ...ride.weather } : undefined,
    route: ride.route.map((point) => ({ ...point })),
  };
}

function failure(error: RideRepositoryError) {
  return { ok: false, error } as const;
}

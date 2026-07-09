import { validateRide, type Ride, type RideId } from '@/src/domain/ride';

import type { RideRepository } from './RideRepository';
import type { RideDeleteResult, RideRepositoryError, RideWriteResult } from './RideRepositoryTypes';

/**
 * Deterministic in-memory Ride repository.
 *
 * This adapter is useful for demos, tests, and UI wiring before SQLite or
 * Supabase adapters exist. State is scoped to each repository instance; there
 * is no singleton or global store.
 */
export class InMemoryRideRepository implements RideRepository {
  private readonly rides = new Map<RideId, Ride>();

  constructor(initialRides: readonly Ride[] = []) {
    for (const ride of initialRides) {
      const validation = validateRide(ride);

      if (validation.valid && !this.rides.has(ride.id)) {
        this.rides.set(ride.id, cloneRide(ride));
      }
    }
  }

  async getRide(id: RideId): Promise<Ride | null> {
    const ride = this.rides.get(id);
    return ride ? cloneRide(ride) : null;
  }

  async getAllRides(): Promise<readonly Ride[]> {
    return Array.from(this.rides.values(), cloneRide);
  }

  async saveRide(ride: Ride): Promise<RideWriteResult> {
    const validationError = validateRideForWrite(ride);

    if (validationError) {
      return failure(validationError);
    }

    if (this.rides.has(ride.id)) {
      return failure({
        code: 'already_exists',
        message: `Ride ${ride.id} already exists.`,
      });
    }

    const rideCopy = cloneRide(ride);
    this.rides.set(ride.id, rideCopy);
    return { ok: true, value: cloneRide(rideCopy) };
  }

  async updateRide(ride: Ride): Promise<RideWriteResult> {
    const validationError = validateRideForWrite(ride);

    if (validationError) {
      return failure(validationError);
    }

    if (!this.rides.has(ride.id)) {
      return failure({
        code: 'not_found',
        message: `Ride ${ride.id} does not exist.`,
      });
    }

    const rideCopy = cloneRide(ride);
    this.rides.set(ride.id, rideCopy);
    return { ok: true, value: cloneRide(rideCopy) };
  }

  async deleteRide(id: RideId): Promise<RideDeleteResult> {
    if (!this.rides.has(id)) {
      return failure({
        code: 'not_found',
        message: `Ride ${id} does not exist.`,
      });
    }

    this.rides.delete(id);
    return { ok: true, value: { id } };
  }

  async rideExists(id: RideId): Promise<boolean> {
    return this.rides.has(id);
  }

  async clear(): Promise<void> {
    this.rides.clear();
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

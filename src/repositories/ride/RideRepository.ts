import type { Ride, RideId } from '@/src/domain/ride';

import type { RideDeleteResult, RideWriteResult } from './RideRepositoryTypes';

/**
 * Repository contract for Ride persistence.
 *
 * UI, engines, and application services should depend on this abstraction
 * rather than SQLite, Supabase, or any concrete storage technology. Future
 * persistence adapters can implement this interface without changing callers.
 */
export interface RideRepository {
  /** Get a ride by id, or null when it does not exist. */
  getRide(id: RideId): Promise<Ride | null>;

  /** Get all rides in repository-defined order. */
  getAllRides(): Promise<readonly Ride[]>;

  /** Save a new ride. Implementations should not overwrite an existing id. */
  saveRide(ride: Ride): Promise<RideWriteResult>;

  /** Update an existing ride. Implementations should fail when the id is missing. */
  updateRide(ride: Ride): Promise<RideWriteResult>;

  /** Delete a ride by id. */
  deleteRide(id: RideId): Promise<RideDeleteResult>;

  /** Check whether a ride exists. */
  rideExists(id: RideId): Promise<boolean>;

  /** Remove all rides from this repository instance. */
  clear(): Promise<void>;
}

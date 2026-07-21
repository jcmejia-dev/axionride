import type { DailyChallengeRepository } from "./daily-challenge";
import type { FuelRepository } from "./fuel";
import type { MaintenanceRepository } from "./maintenance";
import type { OilChangeRepository } from "./maintenance/OilChangeRepository";
import type { MotorcycleRepository } from "./motorcycle";
import type { RideRepository } from "./ride";
import type { RideScoreProgressRepository } from "./ride-score";
import type { RiderProgressRepository } from "./rider-progress";
import type { PlannedTripRepository } from "./trip/PlannedTripRepository";
import type { WorkspaceRepository } from "./workspace";

/**
 * Repository provider used by application services and future UI adapters.
 *
 * It keeps app code from directly constructing concrete repository classes and
 * allows tests to inject deterministic repository implementations.
 */
export type RepositoryProvider = {
  readonly motorcycles: MotorcycleRepository;
  readonly maintenance: MaintenanceRepository;
  readonly rides: RideRepository;
  readonly fuel: FuelRepository;
  readonly oilChanges: OilChangeRepository;
  readonly trips: PlannedTripRepository;
  readonly riderProgress?: RiderProgressRepository;
  readonly rideScoreProgress?: RideScoreProgressRepository;
  readonly dailyChallenges?: DailyChallengeRepository;
  readonly workspaces: WorkspaceRepository;
};

/**
 * Partial repository overrides for dependency injection in tests or previews.
 */
export type RepositoryProviderOverrides = Partial<RepositoryProvider>;

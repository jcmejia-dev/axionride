import { SQLiteDailyChallengeRepository } from "./daily-challenge";
import { SQLiteFuelRepository } from "./fuel";
import { SQLiteOilChangeRepository } from "./maintenance/OilChangeRepository";
import { SQLiteMaintenanceRepository } from "./maintenance/SQLiteMaintenanceRepository";
import { SQLiteMotorcycleRepository } from "./motorcycle";
import type {
  RepositoryProvider,
  RepositoryProviderOverrides,
} from "./RepositoryProvider";
import { SQLiteRideRepository } from "./ride";
import { SQLiteRideScoreProgressRepository } from "./ride-score";
import { SQLiteRiderProgressRepository } from "./rider-progress";
import { SQLitePlannedTripRepository } from "./trip/PlannedTripRepository";
import { SQLiteWorkspaceRepository } from "./workspace";

/**
 * Create the default repository provider for the app runtime.
 */
export function createRepositoryProvider(
  overrides: RepositoryProviderOverrides = {},
): RepositoryProvider {
  const workspaces = new SQLiteWorkspaceRepository();
  const defaultProvider: RepositoryProvider = {
    workspaces,
    motorcycles: new SQLiteMotorcycleRepository(workspaces),
    maintenance: new SQLiteMaintenanceRepository(workspaces),
    rides: new SQLiteRideRepository(workspaces),
    fuel: new SQLiteFuelRepository(workspaces),
    oilChanges: new SQLiteOilChangeRepository(workspaces),
    trips: new SQLitePlannedTripRepository(workspaces),
    riderProgress: new SQLiteRiderProgressRepository(workspaces),
    rideScoreProgress: new SQLiteRideScoreProgressRepository(workspaces),
    dailyChallenges: new SQLiteDailyChallengeRepository(workspaces),
  };

  return {
    ...defaultProvider,
    ...overrides,
  };
}

/**
 * Convenience factory for tests that want to provide every repository explicitly.
 */
export function createInjectedRepositoryProvider(
  provider: RepositoryProvider,
): RepositoryProvider {
  return provider;
}

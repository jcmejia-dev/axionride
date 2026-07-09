import { SQLiteMaintenanceRepository } from './maintenance';
import { SQLiteMotorcycleRepository } from './motorcycle';
import type { RepositoryProvider, RepositoryProviderOverrides } from './RepositoryProvider';
import { InMemoryRideRepository } from './ride';

/**
 * Create the default repository provider for the app runtime.
 */
export function createRepositoryProvider(overrides: RepositoryProviderOverrides = {}): RepositoryProvider {
  const defaultProvider: RepositoryProvider = {
    motorcycles: new SQLiteMotorcycleRepository(),
    maintenance: new SQLiteMaintenanceRepository(),
    // Temporary fallback: a SQLite Ride repository has not been implemented yet.
    // Replace this with SQLiteRideRepository when the ride persistence adapter exists.
    rides: new InMemoryRideRepository(),
  };

  return {
    ...defaultProvider,
    ...overrides,
  };
}

/**
 * Convenience factory for tests that want to provide every repository explicitly.
 */
export function createInjectedRepositoryProvider(provider: RepositoryProvider): RepositoryProvider {
  return provider;
}

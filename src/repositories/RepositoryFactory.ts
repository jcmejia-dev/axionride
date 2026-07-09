import { SQLiteMaintenanceRepository } from './maintenance';
import { SQLiteMotorcycleRepository } from './motorcycle';
import type { RepositoryProvider, RepositoryProviderOverrides } from './RepositoryProvider';
import { SQLiteRideRepository } from './ride';

/**
 * Create the default repository provider for the app runtime.
 */
export function createRepositoryProvider(overrides: RepositoryProviderOverrides = {}): RepositoryProvider {
  const defaultProvider: RepositoryProvider = {
    motorcycles: new SQLiteMotorcycleRepository(),
    maintenance: new SQLiteMaintenanceRepository(),
    rides: new SQLiteRideRepository(),
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

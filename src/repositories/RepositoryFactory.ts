import { SQLiteMaintenanceRepository } from './maintenance';
import { SQLiteMotorcycleRepository } from './motorcycle';
import type { RepositoryProvider, RepositoryProviderOverrides } from './RepositoryProvider';
import { SQLiteRideRepository } from './ride';
import { SQLiteWorkspaceRepository } from './workspace';

/**
 * Create the default repository provider for the app runtime.
 */
export function createRepositoryProvider(overrides: RepositoryProviderOverrides = {}): RepositoryProvider {
  const workspaces = new SQLiteWorkspaceRepository();
  const defaultProvider: RepositoryProvider = {
    workspaces,
    motorcycles: new SQLiteMotorcycleRepository(workspaces),
    maintenance: new SQLiteMaintenanceRepository(workspaces),
    rides: new SQLiteRideRepository(workspaces),
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

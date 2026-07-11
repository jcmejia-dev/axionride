import type { MaintenanceRepository } from './maintenance';
import type { MotorcycleRepository } from './motorcycle';
import type { RideRepository } from './ride';
import type { WorkspaceRepository } from './workspace';

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
  readonly workspaces: WorkspaceRepository;
};

/**
 * Partial repository overrides for dependency injection in tests or previews.
 */
export type RepositoryProviderOverrides = Partial<RepositoryProvider>;

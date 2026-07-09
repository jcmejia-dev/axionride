import { createRepositoryProvider, type RepositoryProviderOverrides } from '@/src/repositories';

import { ServiceContext } from './ServiceContext';
import type { ServiceDependencies } from './ServiceTypes';

/**
 * Create a service context with default app dependencies.
 */
export function createServiceContext(overrides: Partial<ServiceDependencies> = {}) {
  return new ServiceContext({
    repositories: overrides.repositories ?? createRepositoryProvider(),
    logger: overrides.logger,
  });
}

/**
 * Create a service context with repository overrides for tests or previews.
 */
export function createServiceContextWithRepositories(
  repositoryOverrides: RepositoryProviderOverrides,
  dependencies: Omit<Partial<ServiceDependencies>, 'repositories'> = {},
) {
  return new ServiceContext({
    repositories: createRepositoryProvider(repositoryOverrides),
    logger: dependencies.logger,
  });
}

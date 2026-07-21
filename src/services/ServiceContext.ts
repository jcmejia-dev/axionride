import type { RepositoryProvider } from "@/src/repositories";

import type {
  ServiceDependencies,
  ServiceLogger
} from "./ServiceTypes";

/**
 * Shared dependency container for application services.
 *
 * Services receive this context through constructors so tests and previews can
 * inject repositories, logging, analytics, or sync implementations.
 */
export class ServiceContext {
  readonly repositories: RepositoryProvider;

  readonly logger?: ServiceLogger;

  // Future dependency slots:
  // readonly analytics?: ServiceAnalytics;
  // readonly sync?: ServiceSyncCoordinator;

  constructor(dependencies: ServiceDependencies) {
    this.repositories = dependencies.repositories;
    this.logger = dependencies.logger;
  }
}

export function createServiceContext(
  repositories?: RepositoryProvider,
  logger?: ServiceLogger,
): ServiceContext {
  return new ServiceContext({
    repositories: repositories || ({} as RepositoryProvider),
    logger,
  });
}

export function createServiceContextWithRepositories(
  repositories?: RepositoryProvider,
): ServiceContext {
  return new ServiceContext({
    repositories: repositories || ({} as RepositoryProvider),
  });
}

export { ServiceResult } from "./ServiceTypes";


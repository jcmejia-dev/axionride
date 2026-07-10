import { createRepositoryProvider, type RepositoryProviderOverrides } from '@/src/repositories';

import { LocationService } from './location';
import { MaintenanceService } from './maintenance';
import { NotificationService } from './notifications';
import { ProfileService } from './profile';
import { RideService } from './ride';
import { SearchService } from './search';
import { ServiceContext } from './ServiceContext';
import type { ServiceDependencies } from './ServiceTypes';
import { SettingsService } from './settings';
import { StatisticsService } from './statistics';

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

/**
 * Create the ride application service with default dependencies.
 */
export function createRideService(overrides: Partial<ServiceDependencies> = {}) {
  return new RideService(createServiceContext(overrides));
}

/**
 * Create the maintenance application service with default dependencies.
 */
export function createMaintenanceService(overrides: Partial<ServiceDependencies> = {}) {
  const context = createServiceContext(overrides);
  return new MaintenanceService(context, new NotificationService(context));
}

/**
 * Create the statistics application service with default dependencies.
 */
export function createStatisticsService(overrides: Partial<ServiceDependencies> = {}) {
  return new StatisticsService(createServiceContext(overrides));
}

/**
 * Create the local profile application service with default dependencies.
 */
export function createProfileService(overrides: Partial<ServiceDependencies> = {}) {
  return new ProfileService(createServiceContext(overrides));
}

/**
 * Create the local settings application service with default dependencies.
 */
export function createSettingsService(overrides: Partial<ServiceDependencies> = {}) {
  return new SettingsService(createServiceContext(overrides));
}

/**
 * Create the local notification service with default dependencies.
 */
export function createNotificationService(overrides: Partial<ServiceDependencies> = {}) {
  return new NotificationService(createServiceContext(overrides));
}

/**
 * Create the local universal search service with default dependencies.
 */
export function createSearchService(overrides: Partial<ServiceDependencies> = {}) {
  return new SearchService(createServiceContext(overrides));
}

/**
 * Create the foreground location service with default dependencies.
 */
export function createLocationService(overrides: Partial<ServiceDependencies> = {}) {
  return new LocationService(createServiceContext(overrides));
}

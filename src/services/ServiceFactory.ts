import { createRepositoryProvider, type RepositoryProviderOverrides } from '@/src/repositories';

import { BackupService } from './backup';
import { DailyChallengeService } from './daily-challenge';
import { LocationService } from './location';
import { MaintenanceService } from './maintenance';
import { NearbyServicesService } from './nearby-services';
import { MotorcycleService } from './motorcycle';
import { NotificationService } from './notifications';
import { ProfileService } from './profile';
import { RideService } from './ride';
import { RideScoreProgressService } from './ride-score';
import { RiderProgressService } from './rider-progress';
import { OsrmRoutingService } from './routing';
import { SearchService } from './search';
import { ServiceContext } from './ServiceContext';
import type { ServiceDependencies } from './ServiceTypes';
import { SettingsService } from './settings';
import { StatisticsService } from './statistics';
import { WorkspaceService } from './workspace';
import { WeatherService } from './weather';

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

export function createMotorcycleService(overrides: Partial<ServiceDependencies> = {}) { return new MotorcycleService(createServiceContext(overrides)); }
export function createWorkspaceService(overrides: Partial<ServiceDependencies> = {}) { return new WorkspaceService(createServiceContext(overrides)); }

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

export function createRideScoreProgressService(overrides: Partial<ServiceDependencies> = {}) {
  return new RideScoreProgressService(createServiceContext(overrides));
}

export function createDailyChallengeService(overrides: Partial<ServiceDependencies> = {}) {
  return new DailyChallengeService(createServiceContext(overrides));
}

export function createRiderProgressService(overrides: Partial<ServiceDependencies> = {}) {
  return new RiderProgressService(createServiceContext(overrides));
}
export function createNearbyServicesService() { return new NearbyServicesService(); }
export function createOsrmRoutingService() { return new OsrmRoutingService(); }
export function createWeatherService(overrides: Partial<ServiceDependencies> = {}) { return new WeatherService(createServiceContext(overrides)); }

/**
 * Create the local backup export/import service with default dependencies.
 */
export function createBackupService(overrides: Partial<ServiceDependencies> = {}) {
  return new BackupService(createServiceContext(overrides));
}

import { createRepositoryProvider } from "@/src/repositories";
import type { BackupService } from "./backup";
import type { DailyChallengeService } from "./daily-challenge";
import { FuelService } from "./fuel/FuelService";
import type { LocationService } from "./location";
import { MaintenanceService } from "./maintenance/MaintenanceService";
import { OilChangeService } from "./maintenance/OilChangeService";
import type { MotorcycleService } from "./motorcycle";
import type { NearbyServicesService } from "./nearby-services";
import type { NotificationService } from "./notifications";
import type { ProfileService } from "./profile";
import type { RideService } from "./ride";
import type { RideScoreProgressService } from "./ride-score";
import type { RiderProgressService } from "./rider-progress";
import type { OsrmRoutingService } from "./routing";
import type { SearchService } from "./search";
import { createServiceContext, type ServiceContext } from "./ServiceContext";
import type { SettingsService } from "./settings";
import type { StatisticsService } from "./statistics";
import { TripService } from "./trip/TripService";
import type { WeatherService } from "./weather";
import type { WorkspaceService } from "./workspace";

function resolveContext(context?: ServiceContext): ServiceContext {
  if (context) {
    return context;
  }
  return createServiceContext(createRepositoryProvider());
}

export function createFuelService(context?: ServiceContext) {
  const resolved = resolveContext(context);
  return new FuelService(resolved, {
    fuel: resolved.repositories.fuel,
    motorcycles: resolved.repositories.motorcycles,
    rides: resolved.repositories.rides,
  });
}

export function createMaintenanceService(context?: ServiceContext) {
  const resolved = resolveContext(context);
  return new MaintenanceService(resolved, {
    maintenance: resolved.repositories.maintenance,
    motorcycles: resolved.repositories.motorcycles,
    rides: resolved.repositories.rides,
  });
}

export function createOilChangeService(context?: ServiceContext) {
  const resolved = resolveContext(context);
  return new OilChangeService(resolved, {
    oilChanges: resolved.repositories.oilChanges,
    motorcycles: resolved.repositories.motorcycles,
    rides: resolved.repositories.rides,
  });
}

export function createTripService(context?: ServiceContext) {
  const resolved = resolveContext(context);
  return new TripService(resolved, {
    trips: resolved.repositories.trips,
  });
}

export function createBackupService(context?: ServiceContext): BackupService {
  const resolved = resolveContext(context);
  return new (require("./backup").BackupService)(resolved);
}

export function createDailyChallengeService(
  context?: ServiceContext,
): DailyChallengeService {
  const resolved = resolveContext(context);
  return new (require("./daily-challenge").DailyChallengeService)(resolved);
}

export function createLocationService(
  context?: ServiceContext,
): LocationService {
  const resolved = resolveContext(context);
  return new (require("./location").LocationService)(resolved);
}

export function createMotorcycleService(
  context?: ServiceContext,
): MotorcycleService {
  const resolved = resolveContext(context);
  return new (require("./motorcycle").MotorcycleService)(resolved);
}

export function createNearbyServicesService(
  context?: ServiceContext,
): NearbyServicesService {
  const resolved = resolveContext(context);
  return new (require("./nearby-services").NearbyServicesService)(resolved);
}

export function createNotificationService(
  context?: ServiceContext,
): NotificationService {
  const resolved = resolveContext(context);
  return new (require("./notifications").NotificationService)(resolved);
}

export function createProfileService(context?: ServiceContext): ProfileService {
  const resolved = resolveContext(context);
  return new (require("./profile").ProfileService)(resolved);
}

export function createRideService(context?: ServiceContext): RideService {
  const resolved = resolveContext(context);
  return new (require("./ride").RideService)(resolved);
}

export function createRideScoreProgressService(
  context?: ServiceContext,
): RideScoreProgressService {
  const resolved = resolveContext(context);
  return new (require("./ride-score").RideScoreProgressService)(resolved);
}

export function createRiderProgressService(
  context?: ServiceContext,
): RiderProgressService {
  const resolved = resolveContext(context);
  return new (require("./rider-progress").RiderProgressService)(resolved);
}

export function createOsrmRoutingService(
  context?: ServiceContext,
): OsrmRoutingService {
  const resolved = resolveContext(context);
  return new (require("./routing").OsrmRoutingService)(resolved);
}

export function createSearchService(context?: ServiceContext): SearchService {
  const resolved = resolveContext(context);
  return new (require("./search").SearchService)(resolved);
}

export function createSettingsService(
  context?: ServiceContext,
): SettingsService {
  const resolved = resolveContext(context);
  return new (require("./settings").SettingsService)(resolved);
}

export function createStatisticsService(
  context?: ServiceContext,
): StatisticsService {
  const resolved = resolveContext(context);
  return new (require("./statistics").StatisticsService)(resolved);
}

export function createWeatherService(context?: ServiceContext): WeatherService {
  const resolved = resolveContext(context);
  return new (require("./weather").WeatherService)(resolved);
}

export function createWorkspaceService(
  context?: ServiceContext,
): WorkspaceService {
  const resolved = resolveContext(context);
  return new (require("./workspace").WorkspaceService)(resolved);
}

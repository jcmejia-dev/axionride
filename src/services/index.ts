export type {
  RiderAchievement,
  RiderAchievementId,
  RiderProgress,
  RiderProgressSnapshot,
  RiderStreak
} from "@/src/domain/rider-progress";
export {
  AXIONRIDE_BACKUP_APPLICATION_ID,
  AXIONRIDE_BACKUP_SCHEMA_VERSION,
  BackupService
} from "./backup";
export type {
  AxionRideBackup,
  AxionRideBackupRidePoint,
  BackupExportResult,
  BackupImportConfirmation,
  BackupImportOptions,
  BackupImportSummary,
  BackupOperationStatus,
  BackupRestoreAtomicity
} from "./backup";
export { BaseService } from "./BaseService";
export { DailyChallengeService } from "./daily-challenge";
export { FuelService } from "./fuel/FuelService";
export type {
  CreateFuelLogInput,
  UpdateFuelLogInput
} from "./fuel/FuelService";
export { LocationService } from "./location";
export type {
  ForegroundLocationPermissionResult,
  ForegroundLocationPermissionState,
  LocationRidePoint,
  LocationUpdateHandler
} from "./location";
export { MaintenanceService } from "./maintenance";
export type {
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  MaintenanceListItem,
  UpdateMaintenanceInput
} from "./maintenance";
export { MotorcycleService } from "./motorcycle";
export type { MotorcycleOverview } from "./motorcycle";
export {
  createGoogleMapsDirectionsUrl,
  createGoogleMapsFallbackSearchUrl,
  createGoogleMapsPlaceUrl,
  getNearbyCategory,
  NEARBY_SERVICE_CATEGORIES,
  NearbyServicesService,
  recommendCategoryForMaintenance
} from "./nearby-services";
export type {
  NearbyCoordinate,
  NearbyPlace,
  NearbySearchErrorCode,
  NearbySearchRequest,
  NearbySearchResult,
  NearbyServiceCategory,
  NearbyServiceProvider
} from "./nearby-services";
export { NotificationService } from "./notifications";
export type {
  ImmediateLocalNotificationInput,
  MaintenanceReminderInput,
  NotificationPermissionState,
  NotificationPermissionStatus,
  ScheduledNotificationItem
} from "./notifications";
export { ProfileService } from "./profile";
export type {
  LocalProfile,
  ProfileIdentity,
  ProfileOverview,
  UpdateLocalProfileInput
} from "./profile";
export { RideService } from "./ride";
export type {
  CompletedRideResult,
  RideHistoryItem,
  RideRecordingStatus,
  RideSessionSnapshot
} from "./ride";
export { RideScoreProgressService } from "./ride-score";
export type { RideScoreComparison } from "./ride-score";
export {
  RIDER_XP,
  RiderProgressService,
  subscribeToRiderProgressRewards
} from "./rider-progress";
export type {
  RiderProgressReward,
  RiderProgressUpdate
} from "./rider-progress";
export { OsrmRoutingService } from "./routing";
export type {
  DrivingRoute,
  DrivingRouteResult,
  RouteCoordinate,
  RoutingService
} from "./routing";
export { SearchService } from "./search";
export type {
  SearchInput,
  SearchResponse,
  SearchResult,
  SearchResultType
} from "./search";
export {
  createServiceContext,
  createServiceContextWithRepositories,
  ServiceContext
} from "./ServiceContext";
export {
  createBackupService,
  createDailyChallengeService,
  createFuelService,
  createLocationService,
  createMaintenanceService,
  createMotorcycleService,
  createNearbyServicesService,
  createNotificationService,
  createOilChangeService,
  createOsrmRoutingService,
  createProfileService,
  createRiderProgressService,
  createRideScoreProgressService,
  createRideService,
  createSearchService,
  createSettingsService,
  createStatisticsService,
  createTripService,
  createWeatherService,
  createWorkspaceService
} from "./ServiceFactory";
export type {
  ServiceDependencies,
  ServiceError,
  ServiceErrorCode,
  ServiceFailure,
  ServiceLogger,
  ServiceResult,
  ServiceSuccess
} from "./ServiceTypes";
export { SettingsService } from "./settings";
export type {
  SettingsItem,
  SettingsOverview,
  SettingsSection,
  SettingsUnits
} from "./settings";
export { playSound } from "./sound";
export type { SoundCue } from "./sound";
export { StatisticsService } from "./statistics";
export type {
  MaintenanceStatisticsSummary,
  MotorcycleStatisticsSummary,
  RideStatisticsSummary,
  StatisticsDashboardSummary
} from "./statistics";
export { WeatherService } from "./weather";
export type { CurrentWeather } from "./weather";
export { WorkspaceService } from "./workspace";
export type {
  CreateAuthenticatedWorkspaceInput,
  LocalWorkspace,
  WorkspaceKind
} from "./workspace";


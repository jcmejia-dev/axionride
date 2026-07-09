export {
  calculateAverageSpeed,
  calculateCoordinateDistanceKm,
  calculateCurrentSpeed,
  calculateMaximumSpeed,
  calculateMovingTime,
  calculateRideDistance,
  calculateRideDuration,
  calculateRideStatistics,
  calculateRideSummary,
  calculateStoppedTime,
  estimateFuelConsumption,
  summarizeRide,
} from './RideEngine';
export {
  DEFAULT_FUEL_ECONOMY_KM_PER_LITER,
  DEFAULT_MOVING_SPEED_THRESHOLD_KMH,
  EARTH_RADIUS_KM,
  SECONDS_PER_HOUR,
} from './RideEngineRules';
export type {
  FuelEstimateInput,
  RideDistanceInput,
  RideDurationInput,
  RideEngineStatistics,
  RideStatisticsInput,
  RideSummary,
  RideSummaryInput,
  RideTimeBreakdownInput,
} from './RideEngineTypes';

/**
 * Aggregated ride statistics used by history, analytics, exports, and UI.
 */
export type RideStatistics = {
  /** Average speed across the relevant ride set in kilometers per hour. */
  readonly averageSpeed: number;

  /** Highest recorded speed in kilometers per hour. */
  readonly topSpeed: number;

  /** Total distance in kilometers. */
  readonly distance: number;

  /** Time spent moving in seconds. */
  readonly movingTime: number;

  /** Time spent stopped in seconds. */
  readonly stoppedTime: number;

  /** Number of rides represented by these statistics. */
  readonly rideCount: number;
};

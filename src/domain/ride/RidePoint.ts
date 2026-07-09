/**
 * ISO-8601 timestamp string, normally stored in UTC.
 */
export type RidePointTimestamp = string;

/**
 * A single route breadcrumb captured during a ride.
 *
 * This is a pure data model only. It does not request GPS, manage maps, or
 * imply any platform permission behavior.
 */
export type RidePoint = {
  /** Latitude in decimal degrees. Valid range is -90 to 90. */
  readonly latitude: number;

  /** Longitude in decimal degrees. Valid range is -180 to 180. */
  readonly longitude: number;

  /** Altitude in meters above sea level, when available. */
  readonly altitude?: number;

  /** Horizontal accuracy in meters, when available. */
  readonly accuracy?: number;

  /** Instantaneous speed in kilometers per hour, when available. */
  readonly speed?: number;

  /** Heading in degrees from north, when available. Valid range is 0 to 360. */
  readonly heading?: number;

  /** Timestamp for when this point was captured. */
  readonly timestamp: RidePointTimestamp;
};

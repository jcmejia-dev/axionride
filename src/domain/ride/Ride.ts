import type { MotorcycleId } from '../motorcycle';
import type { RideStatus, RideType } from './RideEnums';
import type { RidePoint } from './RidePoint';

/**
 * Stable unique identifier for a ride record.
 */
export type RideId = string;

/**
 * ISO-8601 timestamp string, normally stored in UTC.
 */
export type ISODateTimeString = string;

/**
 * Optional weather summary captured for a ride.
 */
export type RideWeather = {
  /** Short condition label, such as `Sunny`, `Rainy`, or `Cloudy`. */
  readonly condition: string;

  /** Temperature in Celsius, when available. */
  readonly temperatureCelsius?: number;

  /** Wind description or speed label, when available. */
  readonly wind?: string;
};

/**
 * Canonical Ride domain model shared by AxionRide features.
 *
 * This type is independent from GPS implementation, maps, UI, navigation,
 * SQLite, Supabase, APIs, and exports. Future tracking, replay, storage, and
 * statistics layers should map to or from this shape.
 */
export type Ride = {
  /** Stable unique identifier for this ride. */
  readonly id: RideId;

  /** Motorcycle used for the ride. */
  readonly motorcycleId: MotorcycleId;

  /** User-facing title, such as `Morning commute` or `Mountain loop`. */
  readonly title: string;

  /** Optional longer ride description. */
  readonly description?: string;

  /** Ride lifecycle status. */
  readonly status: RideStatus;

  /** Ride category for filtering and analytics. */
  readonly type: RideType;

  /** Timestamp when the ride started. */
  readonly startTime: ISODateTimeString;

  /** Timestamp when the ride ended, if the ride is complete or cancelled. */
  readonly endTime?: ISODateTimeString;

  /** Total ride distance in kilometers. */
  readonly distanceKm: number;

  /** Total ride duration in seconds. */
  readonly durationSeconds: number;

  /** Average speed in kilometers per hour. */
  readonly averageSpeedKmh: number;

  /** Maximum recorded speed in kilometers per hour. */
  readonly maximumSpeedKmh: number;

  /** Time spent moving in seconds. */
  readonly movingTimeSeconds: number;

  /** Time spent stopped in seconds. */
  readonly stoppedTimeSeconds: number;

  /** Estimated or recorded fuel consumed in liters, when available. */
  readonly fuelConsumedLiters?: number;

  /** Optional weather context captured for the ride. */
  readonly weather?: RideWeather;

  /** Free-form rider notes. */
  readonly notes?: string;

  /** Ordered route breadcrumbs captured during the ride. */
  readonly route: readonly RidePoint[];

  /** Timestamp for when this ride record was created. */
  readonly createdAt: ISODateTimeString;

  /** Timestamp for when this ride record was last updated. */
  readonly updatedAt: ISODateTimeString;
};

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
export type RideSegmentKind = 'normal' | 'slow' | 'stopped';

/** A contiguous speed-classified section of a recorded route. */
export type RideSegment = {
  readonly kind: RideSegmentKind;
  readonly startPointIndex: number;
  readonly endPointIndex: number;
  readonly startTime: ISODateTimeString;
  readonly endTime: ISODateTimeString;
  readonly durationSeconds: number;
  readonly distanceKm: number;
  readonly averageSpeedKmh: number;
};

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

  /** Editable rider-facing name. Older stored rides fall back to `title`. */
  readonly rideName?: string;

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

  /** Efficiency used for the ride's fuel estimate. */
  readonly fuelEfficiencyKmPerLiter?: number;

  /** Speed-classified route sections captured at ride completion. */
  readonly segments?: readonly RideSegment[];

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

export function getRideName(ride: Pick<Ride, 'rideName' | 'title'>) {
  return ride.rideName?.trim() || ride.title.trim();
}

export function createDefaultRideName(date: Date) {
  const timestamp = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return `Ride - ${timestamp}`;
}

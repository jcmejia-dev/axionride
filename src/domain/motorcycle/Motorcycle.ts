import type {
  FuelType,
  MotorcycleCategory,
  TransmissionType,
} from "./MotorcycleEnums";

/**
 * Stable unique identifier for a motorcycle record.
 *
 * The domain does not prescribe UUID, ULID, database row id, or remote id
 * format so local-first and cloud-sync layers can choose the right strategy.
 */
export type MotorcycleId = string;

/**
 * ISO-8601 date string in calendar-date form, for example `2026-07-09`.
 */
export type ISODateString = string;

/**
 * ISO-8601 timestamp string, normally stored in UTC, for example
 * `2026-07-09T10:30:00.000Z`.
 */
export type ISODateTimeString = string;

/**
 * URI string pointing to a local or remote motorcycle image.
 */
export type MotorcycleImageUri = string;

/**
 * Money value captured as a decimal number in the user's chosen currency.
 *
 * Currency is intentionally not embedded in this base model so future pricing
 * and localization layers can define that boundary explicitly.
 */
export type MoneyAmount = number;

/**
 * Canonical Motorcycle domain model shared by AxionRide features.
 *
 * This type is deliberately independent from UI, navigation, persistence,
 * networking, and sync implementations. Future SQLite rows, Supabase payloads,
 * REST DTOs, offline repositories, and feature view models should map to or
 * from this shape instead of defining competing motorcycle types.
 */
export type Motorcycle = {
  /** Stable unique identifier for this motorcycle. */
  readonly id: MotorcycleId;

  /** User-facing nickname, such as `Daily Boss` or `Weekend Bike`. */
  readonly nickname: string;

  /** Manufacturer or brand name, such as `Skygo`, `Honda`, or `Yamaha`. */
  readonly brand: string;

  /** Model name or trim, such as `Boss 150` or `NMAX`. */
  readonly model: string;

  /** Model year as a four-digit calendar year. */
  readonly year: number;

  /** Engine displacement in cubic centimeters. Use `0` for electric motorcycles. */
  readonly engineCc: number;

  /** Motorcycle category used for grouping and future feature defaults. */
  readonly category: MotorcycleCategory;

  /** Fuel or energy type used by the motorcycle. */
  readonly fuelType: FuelType;

  /** Transmission type used by the motorcycle. */
  readonly transmission: TransmissionType;

  /** Primary visible color or paint description. */
  readonly color: string;

  /** License plate number when available. Avoid storing placeholder values. */
  readonly plateNumber?: string;

  /** Vehicle identification number when available. Treat as sensitive data. */
  readonly vin?: string;

  /** Current odometer reading in kilometers. */
  readonly odometerKm: number;

  /** Typical fuel efficiency used for ride estimates. Defaults to 40 km/L. */
  readonly fuelEfficiencyKmPerLiter?: number;

  /** Fuel tank capacity in liters, if known. */
  readonly fuelTankCapacityLiters?: number;

  /** Estimated remaining fuel in liters, maintained by the fuel service. */
  readonly estimatedFuelRemaining?: number;

  /** Timestamp when estimated fuel was last recalculated. */
  readonly estimatedFuelUpdatedAt?: string;

  /** Date the motorcycle was purchased, if known. */
  readonly purchaseDate?: ISODateString;

  /** Purchase price amount, if the user chooses to record it. */
  readonly purchasePrice?: MoneyAmount;

  /** Local or remote image URI for the motorcycle profile image. */
  readonly imageUri?: MotorcycleImageUri;

  /** Free-form user notes about ownership, setup, or service context. */
  readonly notes?: string;

  /** Timestamp for when this motorcycle record was created. */
  readonly createdAt: ISODateTimeString;

  /** Timestamp for when this motorcycle record was last updated. */
  readonly updatedAt: ISODateTimeString;
};

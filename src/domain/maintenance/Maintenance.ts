import type { MotorcycleId } from '../motorcycle';
import type { MaintenancePriority, MaintenanceStatus, MaintenanceType } from './MaintenanceEnums';

/**
 * Stable unique identifier for a maintenance record.
 *
 * The domain does not prescribe UUID, ULID, database row id, or remote id
 * format so local-first and cloud-sync layers can choose the right strategy.
 */
export type MaintenanceId = string;

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
 * Money value captured as a decimal number in the user's chosen currency.
 */
export type MaintenanceCost = number;

/**
 * Canonical Maintenance domain model shared by AxionRide features.
 *
 * This type is independent from UI, navigation, SQLite, Supabase, APIs, and
 * notification scheduling. Future persistence, sync, reminder, and analytics
 * layers should map to or from this shape instead of defining competing
 * maintenance task models.
 */
export type Maintenance = {
  /** Stable unique identifier for this maintenance record. */
  readonly id: MaintenanceId;

  /** Motorcycle this service record belongs to. */
  readonly motorcycleId: MotorcycleId;

  /** User-facing service title, such as `Oil Change`. */
  readonly title: string;

  /** Optional longer explanation of what should be done or what was completed. */
  readonly description?: string;

  /** Maintenance category used for grouping, defaults, and future automation. */
  readonly type: MaintenanceType;

  /** Current task lifecycle state. */
  readonly status: MaintenanceStatus;

  /** Priority level for surfacing important service work. */
  readonly priority: MaintenancePriority;

  /** Distance interval in kilometers, if this task is distance-based. */
  readonly intervalKm?: number;

  /** Time interval in days, if this task is calendar-based. */
  readonly intervalDays?: number;

  /** Odometer reading when this service was last completed. */
  readonly lastServiceOdometerKm?: number;

  /** Calendar date when this service was last completed. */
  readonly lastServiceDate?: ISODateString;

  /** Next odometer reading where this task is expected to be due. */
  readonly nextDueOdometerKm?: number;

  /** Next calendar date where this task is expected to be due. */
  readonly nextDueDate?: ISODateString;

  /** Cost recorded for this maintenance item, if known. */
  readonly cost?: MaintenanceCost;

  /** Free-form user notes for parts, fluids, shop details, or observations. */
  readonly notes?: string;

  /** Timestamp for when this maintenance record was created. */
  readonly createdAt: ISODateTimeString;

  /** Timestamp for when this maintenance record was last updated. */
  readonly updatedAt: ISODateTimeString;
};

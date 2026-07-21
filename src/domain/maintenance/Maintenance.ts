import type { MotorcycleId } from "../motorcycle";
import type {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "./MaintenanceEnums";

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
 * Validation issue for a maintenance record.
 */
export type MaintenanceValidationIssue = {
  readonly field: string;
  readonly message: string;
};

/**
 * Validation result for a maintenance record.
 */
export type MaintenanceValidationResult = {
  readonly valid: boolean;
  readonly issues: readonly MaintenanceValidationIssue[];
};

/**
 * Validates a maintenance record.
 */
export function validateMaintenance(
  maintenance: unknown,
): MaintenanceValidationResult {
  const issues: MaintenanceValidationIssue[] = [];

  if (!maintenance || typeof maintenance !== "object") {
    return {
      valid: false,
      issues: [{ field: "root", message: "Maintenance must be an object" }],
    };
  }

  const m = maintenance as Record<string, unknown>;

  if (!m.id || typeof m.id !== "string") {
    issues.push({
      field: "id",
      message: "Maintenance id is required and must be a string",
    });
  }

  if (!m.motorcycleId || typeof m.motorcycleId !== "string") {
    issues.push({
      field: "motorcycleId",
      message: "Motorcycle id is required and must be a string",
    });
  }

  if (!m.title || typeof m.title !== "string") {
    issues.push({
      field: "title",
      message: "Title is required and must be a string",
    });
  }

  if (!m.type || typeof m.type !== "string") {
    issues.push({
      field: "type",
      message: "Type is required and must be a string",
    });
  }

  if (!m.status || typeof m.status !== "string") {
    issues.push({
      field: "status",
      message: "Status is required and must be a string",
    });
  }

  if (!m.priority || typeof m.priority !== "string") {
    issues.push({
      field: "priority",
      message: "Priority is required and must be a string",
    });
  }

  if (
    m.intervalKm !== undefined &&
    (typeof m.intervalKm !== "number" || m.intervalKm < 0)
  ) {
    issues.push({
      field: "intervalKm",
      message: "Interval km must be a non-negative number",
    });
  }

  if (
    m.intervalDays !== undefined &&
    (typeof m.intervalDays !== "number" || m.intervalDays < 0)
  ) {
    issues.push({
      field: "intervalDays",
      message: "Interval days must be a non-negative number",
    });
  }

  if (
    m.lastServiceOdometerKm !== undefined &&
    (typeof m.lastServiceOdometerKm !== "number" || m.lastServiceOdometerKm < 0)
  ) {
    issues.push({
      field: "lastServiceOdometerKm",
      message: "Last service odometer must be a non-negative number",
    });
  }

  if (
    m.nextDueOdometerKm !== undefined &&
    (typeof m.nextDueOdometerKm !== "number" || m.nextDueOdometerKm < 0)
  ) {
    issues.push({
      field: "nextDueOdometerKm",
      message: "Next due odometer must be a non-negative number",
    });
  }

  if (m.cost !== undefined && (typeof m.cost !== "number" || m.cost < 0)) {
    issues.push({
      field: "cost",
      message: "Cost must be a non-negative number",
    });
  }

  return { valid: issues.length === 0, issues };
}

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

/**
 * Input for creating a maintenance record.
 */
export type CreateMaintenanceInput = {
  readonly motorcycleId: MotorcycleId;
  readonly title: string;
  readonly description?: string;
  readonly type: MaintenanceType;
  readonly status: MaintenanceStatus;
  readonly priority: MaintenancePriority;
  readonly intervalKm?: number;
  readonly intervalDays?: number;
  readonly lastServiceOdometerKm?: number;
  readonly lastServiceDate?: ISODateString;
  readonly nextDueOdometerKm?: number;
  readonly nextDueDate?: ISODateString;
  readonly cost?: MaintenanceCost;
  readonly notes?: string;
};

/**
 * Input for updating a maintenance record.
 */
export type UpdateMaintenanceInput = Partial<
  Omit<CreateMaintenanceInput, "motorcycleId">
> & {
  readonly id: MaintenanceId;
};

/**
 * Maintenance list item for UI display.
 */
export type MaintenanceListItem = {
  readonly id: MaintenanceId;
  readonly motorcycleId: MotorcycleId;
  readonly title: string;
  readonly type: MaintenanceType;
  readonly status: MaintenanceStatus;
  readonly priority: MaintenancePriority;
  readonly nextDueOdometerKm?: number;
  readonly nextDueDate?: ISODateString;
  readonly lastServiceOdometerKm?: number;
  readonly lastServiceDate?: ISODateString;
  readonly cost?: MaintenanceCost;
  readonly createdAt: ISODateTimeString;
  readonly updatedAt: ISODateTimeString;
};

/**
 * Complete maintenance input for service layer.
 */
export type CompleteMaintenanceInput = {
  readonly id: MaintenanceId;
  readonly completedAt: ISODateTimeString;
  readonly odometerKm?: number;
  readonly cost?: MaintenanceCost;
  readonly notes?: string;
};

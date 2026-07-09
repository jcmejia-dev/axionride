import { MaintenancePriority, MaintenanceStatus, MaintenanceType } from './MaintenanceEnums';
import type { Maintenance } from './Maintenance';

/**
 * Domain field that can be validated on a Maintenance model.
 */
export type MaintenanceValidationField = keyof Maintenance | 'general';

/**
 * Stable validation code that can be mapped to UI copy, API errors, or logs.
 */
export type MaintenanceValidationCode =
  | 'required'
  | 'invalid_format'
  | 'invalid_enum'
  | 'out_of_range'
  | 'negative_value'
  | 'too_long'
  | 'date_order';

/**
 * A single domain validation issue for a field or model-level rule.
 */
export type MaintenanceValidationIssue = {
  /** Field associated with the issue, or `general` for cross-field rules. */
  readonly field: MaintenanceValidationField;

  /** Stable machine-readable error code. */
  readonly code: MaintenanceValidationCode;

  /** Human-readable diagnostic message for developers and fallback UI. */
  readonly message: string;
};

/**
 * Successful validation result with the validated value.
 */
export type ValidationSuccess<T> = {
  /** Discriminator indicating validation passed. */
  readonly valid: true;

  /** Validated value. */
  readonly value: T;

  /** Empty issue list for ergonomic consumers that always render issues. */
  readonly issues: readonly [];
};

/**
 * Failed validation result with one or more validation issues.
 */
export type ValidationFailure = {
  /** Discriminator indicating validation failed. */
  readonly valid: false;

  /** Validation issues explaining why the value is invalid. */
  readonly issues: readonly MaintenanceValidationIssue[];
};

/**
 * Typed validation result returned by maintenance validation helpers.
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NOTES_LENGTH = 2000;
const MAX_INTERVAL_KM = 200_000;
const MAX_INTERVAL_DAYS = 3_650;
const MAX_ODOMETER_KM = 2_000_000;
const MAX_COST = 10_000_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a complete Maintenance domain object.
 */
export function validateMaintenance(maintenance: Maintenance): ValidationResult<Maintenance> {
  const issues: MaintenanceValidationIssue[] = [];

  addRequiredTextIssue(issues, 'id', maintenance.id);
  addRequiredTextIssue(issues, 'motorcycleId', maintenance.motorcycleId);
  collectIssue(issues, validateMaintenanceTitle(maintenance.title), 'title');
  collectIssue(issues, validateEnum(maintenance.type, MaintenanceType, 'type'), 'type');
  collectIssue(issues, validateEnum(maintenance.status, MaintenanceStatus, 'status'), 'status');
  collectIssue(issues, validateEnum(maintenance.priority, MaintenancePriority, 'priority'), 'priority');

  if (maintenance.description !== undefined && maintenance.description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push(
      createIssue('description', 'too_long', `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`),
    );
  }

  if (maintenance.intervalKm !== undefined) {
    collectIssue(issues, validateMaintenanceIntervalKm(maintenance.intervalKm), 'intervalKm');
  }

  if (maintenance.intervalDays !== undefined) {
    collectIssue(issues, validateMaintenanceIntervalDays(maintenance.intervalDays), 'intervalDays');
  }

  if (maintenance.lastServiceOdometerKm !== undefined) {
    collectIssue(issues, validateMaintenanceOdometer(maintenance.lastServiceOdometerKm), 'lastServiceOdometerKm');
  }

  if (maintenance.nextDueOdometerKm !== undefined) {
    collectIssue(issues, validateMaintenanceOdometer(maintenance.nextDueOdometerKm), 'nextDueOdometerKm');
  }

  if (
    maintenance.lastServiceOdometerKm !== undefined &&
    maintenance.nextDueOdometerKm !== undefined &&
    maintenance.nextDueOdometerKm < maintenance.lastServiceOdometerKm
  ) {
    issues.push(
      createIssue(
        'nextDueOdometerKm',
        'out_of_range',
        'Next due odometer cannot be lower than last service odometer.',
      ),
    );
  }

  if (maintenance.lastServiceDate !== undefined && !isValidISODate(maintenance.lastServiceDate)) {
    issues.push(createIssue('lastServiceDate', 'invalid_format', 'Last service date must use YYYY-MM-DD format.'));
  }

  if (maintenance.nextDueDate !== undefined && !isValidISODate(maintenance.nextDueDate)) {
    issues.push(createIssue('nextDueDate', 'invalid_format', 'Next due date must use YYYY-MM-DD format.'));
  }

  if (
    maintenance.lastServiceDate !== undefined &&
    maintenance.nextDueDate !== undefined &&
    isValidISODate(maintenance.lastServiceDate) &&
    isValidISODate(maintenance.nextDueDate) &&
    Date.parse(maintenance.nextDueDate) < Date.parse(maintenance.lastServiceDate)
  ) {
    issues.push(createIssue('nextDueDate', 'date_order', 'Next due date cannot be earlier than last service date.'));
  }

  if (maintenance.cost !== undefined) {
    collectIssue(issues, validateMaintenanceCost(maintenance.cost), 'cost');
  }

  if (maintenance.notes !== undefined && maintenance.notes.length > MAX_NOTES_LENGTH) {
    issues.push(createIssue('notes', 'too_long', `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`));
  }

  if (!isValidISODateTime(maintenance.createdAt)) {
    issues.push(createIssue('createdAt', 'invalid_format', 'Created timestamp must be a valid ISO date-time string.'));
  }

  if (!isValidISODateTime(maintenance.updatedAt)) {
    issues.push(createIssue('updatedAt', 'invalid_format', 'Updated timestamp must be a valid ISO date-time string.'));
  }

  if (isValidISODateTime(maintenance.createdAt) && isValidISODateTime(maintenance.updatedAt)) {
    const createdAt = Date.parse(maintenance.createdAt);
    const updatedAt = Date.parse(maintenance.updatedAt);

    if (updatedAt < createdAt) {
      issues.push(createIssue('updatedAt', 'date_order', 'Updated timestamp cannot be earlier than created timestamp.'));
    }
  }

  return issues.length === 0 ? success(maintenance) : failure(issues);
}

/**
 * Validate a maintenance task title.
 */
export function validateMaintenanceTitle(title: string): ValidationResult<string> {
  const normalizedTitle = title.trim();

  if (normalizedTitle.length === 0) {
    return failure([createIssue('title', 'required', 'Maintenance title is required.')]);
  }

  if (normalizedTitle.length > MAX_TITLE_LENGTH) {
    return failure([
      createIssue('title', 'too_long', `Maintenance title must be ${MAX_TITLE_LENGTH} characters or fewer.`),
    ]);
  }

  return success(normalizedTitle);
}

/**
 * Validate a distance-based maintenance interval in kilometers.
 */
export function validateMaintenanceIntervalKm(intervalKm: number): ValidationResult<number> {
  if (!Number.isFinite(intervalKm)) {
    return failure([createIssue('intervalKm', 'invalid_format', 'Interval kilometers must be a finite number.')]);
  }

  if (intervalKm < 0) {
    return failure([createIssue('intervalKm', 'negative_value', 'Interval kilometers cannot be negative.')]);
  }

  if (intervalKm > MAX_INTERVAL_KM) {
    return failure([
      createIssue('intervalKm', 'out_of_range', `Interval kilometers cannot exceed ${MAX_INTERVAL_KM}.`),
    ]);
  }

  return success(intervalKm);
}

/**
 * Validate a maintenance cost.
 */
export function validateMaintenanceCost(cost: number): ValidationResult<number> {
  if (!Number.isFinite(cost)) {
    return failure([createIssue('cost', 'invalid_format', 'Maintenance cost must be a finite number.')]);
  }

  if (cost < 0) {
    return failure([createIssue('cost', 'negative_value', 'Maintenance cost cannot be negative.')]);
  }

  if (cost > MAX_COST) {
    return failure([createIssue('cost', 'out_of_range', `Maintenance cost cannot exceed ${MAX_COST}.`)]);
  }

  return success(cost);
}

/**
 * Validate a maintenance-related odometer reading in kilometers.
 */
export function validateMaintenanceOdometer(odometerKm: number): ValidationResult<number> {
  if (!Number.isFinite(odometerKm)) {
    return failure([createIssue('lastServiceOdometerKm', 'invalid_format', 'Odometer must be a finite number.')]);
  }

  if (odometerKm < 0) {
    return failure([createIssue('lastServiceOdometerKm', 'negative_value', 'Odometer cannot be negative.')]);
  }

  if (odometerKm > MAX_ODOMETER_KM) {
    return failure([
      createIssue('lastServiceOdometerKm', 'out_of_range', `Odometer cannot exceed ${MAX_ODOMETER_KM} kilometers.`),
    ]);
  }

  return success(odometerKm);
}

function validateMaintenanceIntervalDays(intervalDays: number): ValidationResult<number> {
  if (!Number.isInteger(intervalDays)) {
    return failure([createIssue('intervalDays', 'invalid_format', 'Interval days must be a whole number.')]);
  }

  if (intervalDays < 0) {
    return failure([createIssue('intervalDays', 'negative_value', 'Interval days cannot be negative.')]);
  }

  if (intervalDays > MAX_INTERVAL_DAYS) {
    return failure([createIssue('intervalDays', 'out_of_range', `Interval days cannot exceed ${MAX_INTERVAL_DAYS}.`)]);
  }

  return success(intervalDays);
}

function addRequiredTextIssue(
  issues: MaintenanceValidationIssue[],
  field: MaintenanceValidationField,
  value: string,
) {
  if (value.trim().length === 0) {
    issues.push(createIssue(field, 'required', `${String(field)} is required.`));
  }
}

function validateEnum<T extends Record<string, string>>(
  value: string,
  enumObject: T,
  field: MaintenanceValidationField,
): ValidationResult<string> {
  const validValues = Object.values(enumObject);

  if (!validValues.includes(value)) {
    return failure([createIssue(field, 'invalid_enum', `${String(field)} is not a supported value.`)]);
  }

  return success(value);
}

function collectIssue<T>(
  issues: MaintenanceValidationIssue[],
  result: ValidationResult<T>,
  field: MaintenanceValidationField,
) {
  if (!result.valid) {
    issues.push(...result.issues.map((issue) => ({ ...issue, field })));
  }
}

function isValidISODate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed);
}

function isValidISODateTime(value: string) {
  return Number.isFinite(Date.parse(value));
}

function createIssue(
  field: MaintenanceValidationField,
  code: MaintenanceValidationCode,
  message: string,
): MaintenanceValidationIssue {
  return { field, code, message };
}

function success<T>(value: T): ValidationSuccess<T> {
  return { valid: true, value, issues: [] };
}

function failure(issues: readonly MaintenanceValidationIssue[]): ValidationFailure {
  return { valid: false, issues };
}

import { FuelType, MotorcycleCategory, TransmissionType } from './MotorcycleEnums';
import type { Motorcycle } from './Motorcycle';

/**
 * Domain field that can be validated on a Motorcycle model.
 */
export type MotorcycleValidationField = keyof Motorcycle | 'general';

/**
 * Stable validation code that can be mapped to UI copy, API errors, or logs.
 */
export type MotorcycleValidationCode =
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
export type MotorcycleValidationIssue = {
  /** Field associated with the issue, or `general` for cross-field rules. */
  readonly field: MotorcycleValidationField;

  /** Stable machine-readable error code. */
  readonly code: MotorcycleValidationCode;

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
  readonly issues: readonly MotorcycleValidationIssue[];
};

/**
 * Typed validation result returned by motorcycle validation helpers.
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const MIN_MODEL_YEAR = 1885;
const MAX_YEAR_OFFSET = 1;
const MAX_TEXT_LENGTH = 160;
const MAX_NOTES_LENGTH = 2000;
const MAX_ODOMETER_KM = 2_000_000;
const MAX_ENGINE_CC = 10_000;
const PLATE_PATTERN = /^[A-Z0-9][A-Z0-9 -]{1,14}[A-Z0-9]$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a complete Motorcycle domain object.
 */
export function validateMotorcycle(motorcycle: Motorcycle): ValidationResult<Motorcycle> {
  const issues: MotorcycleValidationIssue[] = [];

  addRequiredTextIssue(issues, 'id', motorcycle.id);
  addRequiredTextIssue(issues, 'nickname', motorcycle.nickname);
  addRequiredTextIssue(issues, 'brand', motorcycle.brand);
  addRequiredTextIssue(issues, 'model', motorcycle.model);
  addRequiredTextIssue(issues, 'color', motorcycle.color);

  collectIssue(issues, validateYear(motorcycle.year), 'year');
  collectIssue(issues, validateOdometer(motorcycle.odometerKm), 'odometerKm');
  collectIssue(issues, validateEngineCc(motorcycle.engineCc), 'engineCc');
  collectIssue(issues, validateEnum(motorcycle.category, MotorcycleCategory, 'category'), 'category');
  collectIssue(issues, validateEnum(motorcycle.fuelType, FuelType, 'fuelType'), 'fuelType');
  collectIssue(issues, validateEnum(motorcycle.transmission, TransmissionType, 'transmission'), 'transmission');

  if (motorcycle.plateNumber !== undefined) {
    collectIssue(issues, validatePlate(motorcycle.plateNumber), 'plateNumber');
  }

  if (motorcycle.vin !== undefined && motorcycle.vin.trim().length > 32) {
    issues.push(createIssue('vin', 'too_long', 'VIN must be 32 characters or fewer.'));
  }

  if (motorcycle.purchaseDate !== undefined && !isValidISODate(motorcycle.purchaseDate)) {
    issues.push(createIssue('purchaseDate', 'invalid_format', 'Purchase date must use YYYY-MM-DD format.'));
  }

  if (motorcycle.purchasePrice !== undefined && motorcycle.purchasePrice < 0) {
    issues.push(createIssue('purchasePrice', 'negative_value', 'Purchase price cannot be negative.'));
  }

  if (motorcycle.notes !== undefined && motorcycle.notes.length > MAX_NOTES_LENGTH) {
    issues.push(createIssue('notes', 'too_long', `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`));
  }

  if (!isValidISODateTime(motorcycle.createdAt)) {
    issues.push(createIssue('createdAt', 'invalid_format', 'Created timestamp must be a valid ISO date-time string.'));
  }

  if (!isValidISODateTime(motorcycle.updatedAt)) {
    issues.push(createIssue('updatedAt', 'invalid_format', 'Updated timestamp must be a valid ISO date-time string.'));
  }

  if (isValidISODateTime(motorcycle.createdAt) && isValidISODateTime(motorcycle.updatedAt)) {
    const createdAt = Date.parse(motorcycle.createdAt);
    const updatedAt = Date.parse(motorcycle.updatedAt);

    if (updatedAt < createdAt) {
      issues.push(createIssue('updatedAt', 'date_order', 'Updated timestamp cannot be earlier than created timestamp.'));
    }
  }

  return issues.length === 0 ? success(motorcycle) : failure(issues);
}

/**
 * Validate a motorcycle license plate string.
 */
export function validatePlate(plateNumber: string): ValidationResult<string> {
  const normalizedPlate = plateNumber.trim();

  if (normalizedPlate.length === 0) {
    return failure([createIssue('plateNumber', 'required', 'Plate number cannot be empty when provided.')]);
  }

  if (!PLATE_PATTERN.test(normalizedPlate)) {
    return failure([
      createIssue(
        'plateNumber',
        'invalid_format',
        'Plate number may contain letters, numbers, spaces, and hyphens only.',
      ),
    ]);
  }

  return success(normalizedPlate.toUpperCase());
}

/**
 * Validate a motorcycle model year.
 */
export function validateYear(year: number, referenceDate: Date = new Date()): ValidationResult<number> {
  const maxYear = referenceDate.getFullYear() + MAX_YEAR_OFFSET;

  if (!Number.isInteger(year)) {
    return failure([createIssue('year', 'invalid_format', 'Year must be a whole number.')]);
  }

  if (year < MIN_MODEL_YEAR || year > maxYear) {
    return failure([createIssue('year', 'out_of_range', `Year must be between ${MIN_MODEL_YEAR} and ${maxYear}.`)]);
  }

  return success(year);
}

/**
 * Validate an odometer reading in kilometers.
 */
export function validateOdometer(odometerKm: number): ValidationResult<number> {
  if (!Number.isFinite(odometerKm)) {
    return failure([createIssue('odometerKm', 'invalid_format', 'Odometer must be a finite number.')]);
  }

  if (odometerKm < 0) {
    return failure([createIssue('odometerKm', 'negative_value', 'Odometer cannot be negative.')]);
  }

  if (odometerKm > MAX_ODOMETER_KM) {
    return failure([
      createIssue('odometerKm', 'out_of_range', `Odometer cannot exceed ${MAX_ODOMETER_KM} kilometers.`),
    ]);
  }

  return success(odometerKm);
}

/**
 * Validate engine displacement in cubic centimeters.
 */
export function validateEngineCc(engineCc: number): ValidationResult<number> {
  if (!Number.isFinite(engineCc)) {
    return failure([createIssue('engineCc', 'invalid_format', 'Engine displacement must be a finite number.')]);
  }

  if (engineCc < 0) {
    return failure([createIssue('engineCc', 'negative_value', 'Engine displacement cannot be negative.')]);
  }

  if (engineCc > MAX_ENGINE_CC) {
    return failure([createIssue('engineCc', 'out_of_range', `Engine displacement cannot exceed ${MAX_ENGINE_CC}cc.`)]);
  }

  return success(engineCc);
}

function addRequiredTextIssue(
  issues: MotorcycleValidationIssue[],
  field: MotorcycleValidationField,
  value: string,
) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    issues.push(createIssue(field, 'required', `${String(field)} is required.`));
    return;
  }

  if (trimmedValue.length > MAX_TEXT_LENGTH) {
    issues.push(createIssue(field, 'too_long', `${String(field)} must be ${MAX_TEXT_LENGTH} characters or fewer.`));
  }
}

function validateEnum<T extends Record<string, string>>(
  value: string,
  enumObject: T,
  field: MotorcycleValidationField,
): ValidationResult<string> {
  const validValues = Object.values(enumObject);

  if (!validValues.includes(value)) {
    return failure([createIssue(field, 'invalid_enum', `${String(field)} is not a supported value.`)]);
  }

  return success(value);
}

function collectIssue<T>(
  issues: MotorcycleValidationIssue[],
  result: ValidationResult<T>,
  field: MotorcycleValidationField,
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
  field: MotorcycleValidationField,
  code: MotorcycleValidationCode,
  message: string,
): MotorcycleValidationIssue {
  return { field, code, message };
}

function success<T>(value: T): ValidationSuccess<T> {
  return { valid: true, value, issues: [] };
}

function failure(issues: readonly MotorcycleValidationIssue[]): ValidationFailure {
  return { valid: false, issues };
}

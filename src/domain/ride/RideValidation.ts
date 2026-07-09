import { RideStatus, RideType } from './RideEnums';
import type { Ride } from './Ride';
import type { RidePoint } from './RidePoint';
import type { RideStatistics } from './RideStatistics';

/**
 * Domain field that can be validated on a Ride model.
 */
export type RideValidationField = keyof Ride | keyof RidePoint | keyof RideStatistics | 'general';

/**
 * Stable validation code that can be mapped to UI copy, API errors, or logs.
 */
export type RideValidationCode =
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
export type RideValidationIssue = {
  /** Field associated with the issue, or `general` for cross-field rules. */
  readonly field: RideValidationField;

  /** Stable machine-readable error code. */
  readonly code: RideValidationCode;

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
  readonly issues: readonly RideValidationIssue[];
};

/**
 * Typed validation result returned by ride validation helpers.
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NOTES_LENGTH = 2000;
const MAX_DISTANCE_KM = 1_000_000;
const MAX_DURATION_SECONDS = 31_536_000;
const MAX_SPEED_KMH = 500;
const MAX_FUEL_LITERS = 10_000;

/**
 * Validate a complete Ride domain object.
 */
export function validateRide(ride: Ride): ValidationResult<Ride> {
  const issues: RideValidationIssue[] = [];

  addRequiredTextIssue(issues, 'id', ride.id);
  addRequiredTextIssue(issues, 'motorcycleId', ride.motorcycleId);
  addRequiredTextIssue(issues, 'title', ride.title, MAX_TITLE_LENGTH);
  collectIssue(issues, validateEnum(ride.status, RideStatus, 'status'), 'status');
  collectIssue(issues, validateEnum(ride.type, RideType, 'type'), 'type');
  collectIssue(issues, validateRideDistance(ride.distanceKm), 'distanceKm');
  collectIssue(issues, validateRideDuration(ride.durationSeconds), 'durationSeconds');
  collectIssue(issues, validateRideDuration(ride.movingTimeSeconds), 'movingTimeSeconds');
  collectIssue(issues, validateRideDuration(ride.stoppedTimeSeconds), 'stoppedTimeSeconds');
  collectIssue(issues, validateSpeed(ride.averageSpeedKmh, 'averageSpeedKmh'), 'averageSpeedKmh');
  collectIssue(issues, validateSpeed(ride.maximumSpeedKmh, 'maximumSpeedKmh'), 'maximumSpeedKmh');

  if (ride.description !== undefined && ride.description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push(createIssue('description', 'too_long', `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`));
  }

  if (ride.fuelConsumedLiters !== undefined) {
    collectIssue(issues, validateFuelConsumed(ride.fuelConsumedLiters), 'fuelConsumedLiters');
  }

  if (ride.notes !== undefined && ride.notes.length > MAX_NOTES_LENGTH) {
    issues.push(createIssue('notes', 'too_long', `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`));
  }

  if (!isValidISODateTime(ride.startTime)) {
    issues.push(createIssue('startTime', 'invalid_format', 'Start time must be a valid ISO date-time string.'));
  }

  if (ride.endTime !== undefined && !isValidISODateTime(ride.endTime)) {
    issues.push(createIssue('endTime', 'invalid_format', 'End time must be a valid ISO date-time string.'));
  }

  if (
    ride.endTime !== undefined &&
    isValidISODateTime(ride.startTime) &&
    isValidISODateTime(ride.endTime) &&
    Date.parse(ride.endTime) < Date.parse(ride.startTime)
  ) {
    issues.push(createIssue('endTime', 'date_order', 'End time cannot be earlier than start time.'));
  }

  if (ride.movingTimeSeconds + ride.stoppedTimeSeconds > ride.durationSeconds) {
    issues.push(
      createIssue('general', 'out_of_range', 'Moving time plus stopped time cannot exceed total duration.'),
    );
  }

  if (!isValidISODateTime(ride.createdAt)) {
    issues.push(createIssue('createdAt', 'invalid_format', 'Created timestamp must be a valid ISO date-time string.'));
  }

  if (!isValidISODateTime(ride.updatedAt)) {
    issues.push(createIssue('updatedAt', 'invalid_format', 'Updated timestamp must be a valid ISO date-time string.'));
  }

  if (isValidISODateTime(ride.createdAt) && isValidISODateTime(ride.updatedAt)) {
    const createdAt = Date.parse(ride.createdAt);
    const updatedAt = Date.parse(ride.updatedAt);

    if (updatedAt < createdAt) {
      issues.push(createIssue('updatedAt', 'date_order', 'Updated timestamp cannot be earlier than created timestamp.'));
    }
  }

  for (const point of ride.route) {
    const pointValidation = validateRidePoint(point);

    if (!pointValidation.valid) {
      issues.push(...pointValidation.issues);
    }
  }

  return issues.length === 0 ? success(ride) : failure(issues);
}

/**
 * Validate a ride distance in kilometers.
 */
export function validateRideDistance(distanceKm: number): ValidationResult<number> {
  if (!Number.isFinite(distanceKm)) {
    return failure([createIssue('distanceKm', 'invalid_format', 'Ride distance must be a finite number.')]);
  }

  if (distanceKm < 0) {
    return failure([createIssue('distanceKm', 'negative_value', 'Ride distance cannot be negative.')]);
  }

  if (distanceKm > MAX_DISTANCE_KM) {
    return failure([createIssue('distanceKm', 'out_of_range', `Ride distance cannot exceed ${MAX_DISTANCE_KM} km.`)]);
  }

  return success(distanceKm);
}

/**
 * Validate a ride duration in seconds.
 */
export function validateRideDuration(durationSeconds: number): ValidationResult<number> {
  if (!Number.isFinite(durationSeconds)) {
    return failure([createIssue('durationSeconds', 'invalid_format', 'Ride duration must be a finite number.')]);
  }

  if (durationSeconds < 0) {
    return failure([createIssue('durationSeconds', 'negative_value', 'Ride duration cannot be negative.')]);
  }

  if (durationSeconds > MAX_DURATION_SECONDS) {
    return failure([
      createIssue('durationSeconds', 'out_of_range', `Ride duration cannot exceed ${MAX_DURATION_SECONDS} seconds.`),
    ]);
  }

  return success(durationSeconds);
}

/**
 * Validate a single ride route point.
 */
export function validateRidePoint(point: RidePoint): ValidationResult<RidePoint> {
  const issues: RideValidationIssue[] = [];

  if (!Number.isFinite(point.latitude) || point.latitude < -90 || point.latitude > 90) {
    issues.push(createIssue('latitude', 'out_of_range', 'Latitude must be between -90 and 90.'));
  }

  if (!Number.isFinite(point.longitude) || point.longitude < -180 || point.longitude > 180) {
    issues.push(createIssue('longitude', 'out_of_range', 'Longitude must be between -180 and 180.'));
  }

  if (point.altitude !== undefined && !Number.isFinite(point.altitude)) {
    issues.push(createIssue('altitude', 'invalid_format', 'Altitude must be a finite number when provided.'));
  }

  if (point.accuracy !== undefined && (!Number.isFinite(point.accuracy) || point.accuracy < 0)) {
    issues.push(createIssue('accuracy', 'out_of_range', 'Accuracy must be zero or greater when provided.'));
  }

  if (point.speed !== undefined) {
    collectIssue(issues, validateSpeed(point.speed, 'speed'), 'speed');
  }

  if (point.heading !== undefined && (!Number.isFinite(point.heading) || point.heading < 0 || point.heading > 360)) {
    issues.push(createIssue('heading', 'out_of_range', 'Heading must be between 0 and 360 when provided.'));
  }

  if (!isValidISODateTime(point.timestamp)) {
    issues.push(createIssue('timestamp', 'invalid_format', 'Ride point timestamp must be a valid ISO date-time string.'));
  }

  return issues.length === 0 ? success(point) : failure(issues);
}

/**
 * Validate aggregated ride statistics.
 */
export function validateRideStatistics(statistics: RideStatistics): ValidationResult<RideStatistics> {
  const issues: RideValidationIssue[] = [];

  collectIssue(issues, validateSpeed(statistics.averageSpeed, 'averageSpeed'), 'averageSpeed');
  collectIssue(issues, validateSpeed(statistics.topSpeed, 'topSpeed'), 'topSpeed');
  collectIssue(issues, validateRideDistance(statistics.distance), 'distance');
  collectIssue(issues, validateRideDuration(statistics.movingTime), 'movingTime');
  collectIssue(issues, validateRideDuration(statistics.stoppedTime), 'stoppedTime');

  if (!Number.isInteger(statistics.rideCount) || statistics.rideCount < 0) {
    issues.push(createIssue('rideCount', 'out_of_range', 'Ride count must be a non-negative whole number.'));
  }

  return issues.length === 0 ? success(statistics) : failure(issues);
}

function validateSpeed(speedKmh: number, field: RideValidationField): ValidationResult<number> {
  if (!Number.isFinite(speedKmh)) {
    return failure([createIssue(field, 'invalid_format', `${String(field)} must be a finite number.`)]);
  }

  if (speedKmh < 0) {
    return failure([createIssue(field, 'negative_value', `${String(field)} cannot be negative.`)]);
  }

  if (speedKmh > MAX_SPEED_KMH) {
    return failure([createIssue(field, 'out_of_range', `${String(field)} cannot exceed ${MAX_SPEED_KMH} km/h.`)]);
  }

  return success(speedKmh);
}

function validateFuelConsumed(fuelConsumedLiters: number): ValidationResult<number> {
  if (!Number.isFinite(fuelConsumedLiters)) {
    return failure([createIssue('fuelConsumedLiters', 'invalid_format', 'Fuel consumed must be a finite number.')]);
  }

  if (fuelConsumedLiters < 0) {
    return failure([createIssue('fuelConsumedLiters', 'negative_value', 'Fuel consumed cannot be negative.')]);
  }

  if (fuelConsumedLiters > MAX_FUEL_LITERS) {
    return failure([
      createIssue('fuelConsumedLiters', 'out_of_range', `Fuel consumed cannot exceed ${MAX_FUEL_LITERS} liters.`),
    ]);
  }

  return success(fuelConsumedLiters);
}

function addRequiredTextIssue(
  issues: RideValidationIssue[],
  field: RideValidationField,
  value: string,
  maxLength?: number,
) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    issues.push(createIssue(field, 'required', `${String(field)} is required.`));
    return;
  }

  if (maxLength !== undefined && trimmedValue.length > maxLength) {
    issues.push(createIssue(field, 'too_long', `${String(field)} must be ${maxLength} characters or fewer.`));
  }
}

function validateEnum<T extends Record<string, string>>(
  value: string,
  enumObject: T,
  field: RideValidationField,
): ValidationResult<string> {
  const validValues = Object.values(enumObject);

  if (!validValues.includes(value)) {
    return failure([createIssue(field, 'invalid_enum', `${String(field)} is not a supported value.`)]);
  }

  return success(value);
}

function collectIssue<T>(
  issues: RideValidationIssue[],
  result: ValidationResult<T>,
  field: RideValidationField,
) {
  if (!result.valid) {
    issues.push(...result.issues.map((issue) => ({ ...issue, field })));
  }
}

function isValidISODateTime(value: string) {
  return Number.isFinite(Date.parse(value));
}

function createIssue(field: RideValidationField, code: RideValidationCode, message: string): RideValidationIssue {
  return { field, code, message };
}

function success<T>(value: T): ValidationSuccess<T> {
  return { valid: true, value, issues: [] };
}

function failure(issues: readonly RideValidationIssue[]): ValidationFailure {
  return { valid: false, issues };
}

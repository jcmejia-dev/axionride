import type { Ride, RideId, RideValidationIssue } from '@/src/domain/ride';

/**
 * Repository-level error codes for ride persistence operations.
 */
export type RideRepositoryErrorCode = 'already_exists' | 'not_found' | 'validation_failed';

/**
 * Repository-level error payload.
 */
export type RideRepositoryError = {
  /** Stable machine-readable error code. */
  readonly code: RideRepositoryErrorCode;

  /** Human-readable diagnostic message for developers and fallback UI. */
  readonly message: string;

  /** Domain validation issues when a write fails validation. */
  readonly validationIssues?: readonly RideValidationIssue[];
};

/**
 * Successful repository operation result.
 */
export type RideRepositorySuccess<T> = {
  /** Discriminator indicating the operation succeeded. */
  readonly ok: true;

  /** Operation payload. */
  readonly value: T;
};

/**
 * Failed repository operation result.
 */
export type RideRepositoryFailure = {
  /** Discriminator indicating the operation failed. */
  readonly ok: false;

  /** Repository error details. */
  readonly error: RideRepositoryError;
};

/**
 * Typed result returned by repository write and lookup operations that can fail.
 */
export type RideRepositoryResult<T> = RideRepositorySuccess<T> | RideRepositoryFailure;

/**
 * Result returned by a ride delete operation.
 */
export type RideDeleteResult = RideRepositoryResult<{ readonly id: RideId }>;

/**
 * Result returned by ride save and update operations.
 */
export type RideWriteResult = RideRepositoryResult<Ride>;

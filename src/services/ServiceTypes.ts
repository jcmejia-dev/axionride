import type { RepositoryProvider } from '@/src/repositories';

/**
 * Stable service error code for application-service operations.
 */
export type ServiceErrorCode =
  | 'validation_failed'
  | 'not_found'
  | 'conflict'
  | 'repository_error'
  | 'unknown_error';

/**
 * Generic application-service error payload.
 */
export type ServiceError = {
  /** Stable machine-readable error code. */
  readonly code: ServiceErrorCode;

  /** Human-readable diagnostic message for fallback UI and logs. */
  readonly message: string;

  /** Optional lower-level cause kept opaque to avoid coupling callers. */
  readonly cause?: unknown;
};

/**
 * Successful application-service result.
 */
export type ServiceSuccess<T> = {
  /** Discriminator indicating the operation succeeded. */
  readonly ok: true;

  /** Operation payload. */
  readonly value: T;
};

/**
 * Failed application-service result.
 */
export type ServiceFailure = {
  /** Discriminator indicating the operation failed. */
  readonly ok: false;

  /** Error details. */
  readonly error: ServiceError;
};

/**
 * Typed result returned by future application services.
 */
export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

/**
 * Minimal logger contract reserved for future app diagnostics.
 */
export type ServiceLogger = {
  readonly debug?: (message: string, metadata?: Record<string, unknown>) => void;
  readonly info?: (message: string, metadata?: Record<string, unknown>) => void;
  readonly warn?: (message: string, metadata?: Record<string, unknown>) => void;
  readonly error?: (message: string, metadata?: Record<string, unknown>) => void;
};

/**
 * Dependencies shared by application services.
 */
export type ServiceDependencies = {
  readonly repositories: RepositoryProvider;
  readonly logger?: ServiceLogger;
  // Future dependency slots:
  // readonly analytics?: ServiceAnalytics;
  // readonly sync?: ServiceSyncCoordinator;
};

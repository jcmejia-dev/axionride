import type { Motorcycle, MotorcycleId, MotorcycleValidationIssue } from '@/src/domain/motorcycle';

export type MotorcycleRepositoryErrorCode = 'already_exists' | 'not_found' | 'validation_failed' | 'serialization_failed';

export type MotorcycleRepositoryError = {
  readonly code: MotorcycleRepositoryErrorCode;
  readonly message: string;
  readonly validationIssues?: readonly MotorcycleValidationIssue[];
};

export type MotorcycleRepositorySuccess<T> = {
  readonly ok: true;
  readonly value: T;
};

export type MotorcycleRepositoryFailure = {
  readonly ok: false;
  readonly error: MotorcycleRepositoryError;
};

export type MotorcycleRepositoryResult<T> = MotorcycleRepositorySuccess<T> | MotorcycleRepositoryFailure;

export type MotorcycleWriteResult = MotorcycleRepositoryResult<Motorcycle>;

export type MotorcycleDeleteResult = MotorcycleRepositoryResult<{ readonly id: MotorcycleId }>;

export type MotorcycleRow = {
  readonly id: string;
  readonly payload_json: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
};

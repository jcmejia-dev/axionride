import type { Maintenance, MaintenanceId, MaintenanceValidationIssue } from '@/src/domain/maintenance';

export type MaintenanceRepositoryErrorCode = 'already_exists' | 'not_found' | 'validation_failed' | 'serialization_failed';

export type MaintenanceRepositoryError = {
  readonly code: MaintenanceRepositoryErrorCode;
  readonly message: string;
  readonly validationIssues?: readonly MaintenanceValidationIssue[];
};

export type MaintenanceRepositorySuccess<T> = {
  readonly ok: true;
  readonly value: T;
};

export type MaintenanceRepositoryFailure = {
  readonly ok: false;
  readonly error: MaintenanceRepositoryError;
};

export type MaintenanceRepositoryResult<T> = MaintenanceRepositorySuccess<T> | MaintenanceRepositoryFailure;

export type MaintenanceWriteResult = MaintenanceRepositoryResult<Maintenance>;

export type MaintenanceDeleteResult = MaintenanceRepositoryResult<{ readonly id: MaintenanceId }>;

export type MaintenanceRow = {
  readonly id: string;
  readonly motorcycle_id: string;
  readonly payload_json: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
};

import type { AxionRideBackup } from './BackupFormat';

export type BackupOperationStatus = 'success' | 'cancelled' | 'failed';

export type BackupExportResult = {
  readonly status: BackupOperationStatus;
  readonly fileName?: string;
  readonly fileUri?: string;
  readonly motorcyclesExported: number;
  readonly maintenanceRecordsExported: number;
  readonly ridesExported: number;
  readonly ridePointsExported: number;
  readonly message: string;
};

export type BackupImportSummary = {
  readonly status: BackupOperationStatus;
  readonly motorcyclesRestored: number;
  readonly maintenanceRecordsRestored: number;
  readonly ridesRestored: number;
  readonly ridePointsRestored: number;
  readonly skippedRecords: number;
  readonly errors: readonly string[];
  readonly message: string;
  readonly atomicity: BackupRestoreAtomicity;
};

export type BackupRestoreAtomicity = {
  readonly guaranteed: boolean;
  readonly rollbackAttempted: boolean;
  readonly rollbackSucceeded?: boolean;
  readonly limitation: string;
};

export type BackupImportConfirmation = {
  readonly backup: AxionRideBackup;
  readonly summary: Omit<BackupImportSummary, 'status' | 'message' | 'atomicity'>;
};

export type BackupImportOptions = {
  readonly confirmReplacement: (confirmation: BackupImportConfirmation) => Promise<boolean>;
};

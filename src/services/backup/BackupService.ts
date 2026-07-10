import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { validateMaintenance, type Maintenance } from '@/src/domain/maintenance';
import { validateMotorcycle, type Motorcycle } from '@/src/domain/motorcycle';
import { validateRide, validateRidePoint, type Ride, type RidePoint } from '@/src/domain/ride';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

import {
  AXIONRIDE_BACKUP_APPLICATION_ID,
  AXIONRIDE_BACKUP_SCHEMA_VERSION,
  type AxionRideBackup,
  type AxionRideBackupRidePoint,
} from './BackupFormat';
import type {
  BackupExportResult,
  BackupImportOptions,
  BackupImportSummary,
  BackupRestoreAtomicity,
} from './BackupServiceTypes';

const JSON_MIME_TYPE = 'application/json';
const ATOMICITY_LIMITATION =
  'The current repository abstraction does not expose one transaction across motorcycles, maintenance, rides, and ride points. BackupService validates the whole backup before clearing data and attempts rollback on restore failure, but SQLite-level atomic replacement is not guaranteed yet.';

export class BackupService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }

  async exportBackup(): Promise<ServiceResult<BackupExportResult>> {
    try {
      const backupResult = await this.createBackup();

      if (!backupResult.ok) {
        return this.failure(backupResult.error);
      }

      const validationErrors = validateBackup(backupResult.value);

      if (validationErrors.length > 0) {
        return this.failure({
          code: 'validation_failed',
          message: validationErrors.join('\n'),
        });
      }

      const fileName = createBackupFileName(new Date());
      const file = new File(Paths.document, fileName);
      file.create({ overwrite: true });
      file.write(JSON.stringify(backupResult.value, null, 2));

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        return this.success({
          status: 'success',
          fileName,
          fileUri: file.uri,
          motorcyclesExported: backupResult.value.data.motorcycles.length,
          maintenanceRecordsExported: backupResult.value.data.maintenanceRecords.length,
          ridesExported: backupResult.value.data.rides.length,
          ridePointsExported: backupResult.value.data.ridePoints.length,
          message: 'Backup file was created locally, but system sharing is not available on this platform.',
        });
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: JSON_MIME_TYPE,
        dialogTitle: 'Export AxionRide backup',
        UTI: 'public.json',
      });

      return this.success({
        status: 'success',
        fileName,
        fileUri: file.uri,
        motorcyclesExported: backupResult.value.data.motorcycles.length,
        maintenanceRecordsExported: backupResult.value.data.maintenanceRecords.length,
        ridesExported: backupResult.value.data.rides.length,
        ridePointsExported: backupResult.value.data.ridePoints.length,
        message: 'Backup exported and share sheet opened.',
      });
    } catch (error) {
      return this.failure({
        code: 'unknown_error',
        message: 'Backup export failed.',
        cause: error,
      });
    }
  }

  async importBackup(options: BackupImportOptions): Promise<ServiceResult<BackupImportSummary>> {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: JSON_MIME_TYPE,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (pickerResult.canceled) {
        return this.success(createImportSummary({
          status: 'cancelled',
          message: 'Backup import was cancelled.',
        }));
      }

      const asset = pickerResult.assets[0];

      if (!asset) {
        return this.failure({
          code: 'validation_failed',
          message: 'No backup file was selected.',
        });
      }

      const file = new File(asset.uri);
      const content = await file.text();
      const parseResult = parseBackup(content);

      if (!parseResult.ok) {
        return this.failure({
          code: 'validation_failed',
          message: parseResult.error,
        });
      }

      const validationErrors = validateBackup(parseResult.value);

      if (validationErrors.length > 0) {
        return this.failure({
          code: 'validation_failed',
          message: validationErrors.join('\n'),
        });
      }

      const confirmationSummary = createImportSummary({
        status: 'success',
        backup: parseResult.value,
        message: 'Backup validated and ready to restore.',
      });
      const confirmed = await options.confirmReplacement({
        backup: parseResult.value,
        summary: {
          motorcyclesRestored: confirmationSummary.motorcyclesRestored,
          maintenanceRecordsRestored: confirmationSummary.maintenanceRecordsRestored,
          ridesRestored: confirmationSummary.ridesRestored,
          ridePointsRestored: confirmationSummary.ridePointsRestored,
          skippedRecords: confirmationSummary.skippedRecords,
          errors: confirmationSummary.errors,
        },
      });

      if (!confirmed) {
        return this.success(createImportSummary({
          status: 'cancelled',
          backup: parseResult.value,
          message: 'Backup import was cancelled before replacing local data.',
        }));
      }

      const existingBackup = await this.createBackup();

      if (!existingBackup.ok) {
        return this.failure(existingBackup.error);
      }

      const restoreResult = await this.replaceLocalData(parseResult.value);

      if (restoreResult.ok) {
        return this.success(createImportSummary({
          status: 'success',
          backup: parseResult.value,
          message: 'Backup restored. Current local data was replaced.',
        }));
      }

      const rollbackResult = await this.replaceLocalData(existingBackup.value);

      return this.failure({
        code: 'repository_error',
        message: rollbackResult.ok
          ? `${restoreResult.error.message} Existing local data was restored from a pre-import snapshot.`
          : `${restoreResult.error.message} Rollback also failed; local data may be incomplete.`,
        cause: {
          restoreError: restoreResult.error,
          rollbackError: rollbackResult.ok ? null : rollbackResult.error,
        },
      });
    } catch (error) {
      return this.failure({
        code: 'unknown_error',
        message: 'Backup import failed.',
        cause: error,
      });
    }
  }

  private async createBackup(): Promise<ServiceResult<AxionRideBackup>> {
    const [motorcycles, maintenanceRecords, rides] = await Promise.all([
      this.context.repositories.motorcycles.getAllMotorcycles(),
      this.context.repositories.maintenance.getAllMaintenance(),
      this.context.repositories.rides.getAllRides(),
    ]);
    const ridePoints = flattenRidePoints(rides);

    return this.success({
      schemaVersion: AXIONRIDE_BACKUP_SCHEMA_VERSION,
      source: {
        application: AXIONRIDE_BACKUP_APPLICATION_ID,
        name: 'AxionRide',
      },
      exportedAt: new Date().toISOString(),
      metadata: {
        format: 'full-local-replacement',
        notes: 'Version 1 backup for local device restore. Import replaces existing local data.',
        future: {},
      },
      data: {
        motorcycles,
        maintenanceRecords,
        rides,
        ridePoints,
      },
    });
  }

  private async replaceLocalData(backup: AxionRideBackup): Promise<ServiceResult<void>> {
    try {
      await this.context.repositories.rides.clear();
      await this.context.repositories.maintenance.clear();
      await this.context.repositories.motorcycles.clear();

      for (const motorcycle of backup.data.motorcycles) {
        const result = await this.context.repositories.motorcycles.saveMotorcycle(motorcycle);

        if (!result.ok) {
          return this.failure({
            code: 'repository_error',
            message: `Motorcycle ${motorcycle.id} could not be restored: ${result.error.message}`,
            cause: result.error,
          });
        }
      }

      for (const maintenance of backup.data.maintenanceRecords) {
        const result = await this.context.repositories.maintenance.saveMaintenance(maintenance);

        if (!result.ok) {
          return this.failure({
            code: 'repository_error',
            message: `Maintenance record ${maintenance.id} could not be restored: ${result.error.message}`,
            cause: result.error,
          });
        }
      }

      for (const ride of restoreRideRoutesFromBackupPoints(backup)) {
        const result = await this.context.repositories.rides.saveRide(ride);

        if (!result.ok) {
          return this.failure({
            code: 'repository_error',
            message: `Ride ${ride.id} could not be restored: ${result.error.message}`,
            cause: result.error,
          });
        }
      }

      return this.success(undefined);
    } catch (error) {
      return this.failure({
        code: 'repository_error',
        message: 'Local data replacement failed.',
        cause: error,
      });
    }
  }
}

function parseBackup(content: string): { readonly ok: true; readonly value: AxionRideBackup } | { readonly ok: false; readonly error: string } {
  try {
    const parsed = JSON.parse(content) as unknown;
    return isBackupEnvelope(parsed)
      ? { ok: true, value: parsed }
      : { ok: false, error: 'Selected file is not an AxionRide backup.' };
  } catch {
    return { ok: false, error: 'Selected backup file is not valid JSON.' };
  }
}

function isBackupEnvelope(value: unknown): value is AxionRideBackup {
  if (!isRecord(value)) {
    return false;
  }

  if (value.schemaVersion !== AXIONRIDE_BACKUP_SCHEMA_VERSION) {
    return false;
  }

  if (!isRecord(value.source) || value.source.application !== AXIONRIDE_BACKUP_APPLICATION_ID) {
    return false;
  }

  if (typeof value.exportedAt !== 'string' || !Number.isFinite(Date.parse(value.exportedAt))) {
    return false;
  }

  if (!isRecord(value.data)) {
    return false;
  }

  return Array.isArray(value.data.motorcycles)
    && Array.isArray(value.data.maintenanceRecords)
    && Array.isArray(value.data.rides)
    && Array.isArray(value.data.ridePoints);
}

function validateBackup(backup: AxionRideBackup) {
  const errors: string[] = [];
  const motorcycleIds = new Set<string>();
  const rideIds = new Set<string>();
  const maintenanceIds = new Set<string>();

  if (backup.schemaVersion !== AXIONRIDE_BACKUP_SCHEMA_VERSION) {
    errors.push(`Unsupported backup schema version: ${String(backup.schemaVersion)}.`);
    return errors;
  }

  if (backup.source.application !== AXIONRIDE_BACKUP_APPLICATION_ID) {
    errors.push('Backup source is not AxionRide.');
  }

  for (const motorcycle of backup.data.motorcycles) {
    const validation = validateMotorcycle(motorcycle as Motorcycle);

    if (!validation.valid) {
      errors.push(`Motorcycle ${getRecordId(motorcycle)} failed validation: ${validation.issues.map((issue) => issue.message).join(', ')}`);
      continue;
    }

    if (motorcycleIds.has(motorcycle.id)) {
      errors.push(`Duplicate motorcycle id found: ${motorcycle.id}.`);
    }

    motorcycleIds.add(motorcycle.id);
  }

  for (const maintenance of backup.data.maintenanceRecords) {
    const validation = validateMaintenance(maintenance as Maintenance);

    if (!validation.valid) {
      errors.push(`Maintenance ${getRecordId(maintenance)} failed validation: ${validation.issues.map((issue) => issue.message).join(', ')}`);
      continue;
    }

    if (maintenanceIds.has(maintenance.id)) {
      errors.push(`Duplicate maintenance id found: ${maintenance.id}.`);
    }

    if (!motorcycleIds.has(maintenance.motorcycleId)) {
      errors.push(`Maintenance ${maintenance.id} references missing motorcycle ${maintenance.motorcycleId}.`);
    }

    maintenanceIds.add(maintenance.id);
  }

  for (const ride of backup.data.rides) {
    const restoredRide = restoreRideRouteFromBackupPoints(ride, backup.data.ridePoints);
    const validation = validateRide(restoredRide as Ride);

    if (!validation.valid) {
      errors.push(`Ride ${getRecordId(ride)} failed validation: ${validation.issues.map((issue) => issue.message).join(', ')}`);
      continue;
    }

    if (rideIds.has(ride.id)) {
      errors.push(`Duplicate ride id found: ${ride.id}.`);
    }

    if (!motorcycleIds.has(ride.motorcycleId)) {
      errors.push(`Ride ${ride.id} references missing motorcycle ${ride.motorcycleId}.`);
    }

    rideIds.add(ride.id);
  }

  for (const ridePoint of backup.data.ridePoints) {
    if (!isBackupRidePoint(ridePoint)) {
      errors.push('A ride point entry is malformed.');
      continue;
    }

    if (!rideIds.has(ridePoint.rideId)) {
      errors.push(`Ride point references missing ride ${ridePoint.rideId}.`);
    }

    const validation = validateRidePoint(ridePoint.point);

    if (!validation.valid) {
      errors.push(`Ride point for ${ridePoint.rideId} failed validation: ${validation.issues.map((issue) => issue.message).join(', ')}`);
    }
  }

  return errors;
}

function restoreRideRoutesFromBackupPoints(backup: AxionRideBackup) {
  return backup.data.rides.map((ride) => restoreRideRouteFromBackupPoints(ride, backup.data.ridePoints));
}

function restoreRideRouteFromBackupPoints(ride: Ride, ridePoints: readonly AxionRideBackupRidePoint[]): Ride {
  const route = ridePoints
    .filter((ridePoint) => ridePoint.rideId === ride.id)
    .sort((first, second) => first.sequence - second.sequence)
    .map((ridePoint) => ridePoint.point);

  return {
    ...ride,
    route: route.length > 0 ? route : ride.route,
  };
}

function flattenRidePoints(rides: readonly Ride[]): readonly AxionRideBackupRidePoint[] {
  return rides.flatMap((ride) =>
    ride.route.map((point, sequence) => ({
      rideId: ride.id,
      sequence,
      point,
    })),
  );
}

function isBackupRidePoint(value: unknown): value is AxionRideBackupRidePoint {
  return isRecord(value)
    && typeof value.rideId === 'string'
    && Number.isInteger(value.sequence)
    && isRecord(value.point);
}

function createImportSummary({
  status,
  backup,
  message,
}: {
  readonly status: BackupImportSummary['status'];
  readonly backup?: AxionRideBackup;
  readonly message: string;
}): BackupImportSummary {
  return {
    status,
    motorcyclesRestored: backup?.data.motorcycles.length ?? 0,
    maintenanceRecordsRestored: backup?.data.maintenanceRecords.length ?? 0,
    ridesRestored: backup?.data.rides.length ?? 0,
    ridePointsRestored: backup?.data.ridePoints.length ?? 0,
    skippedRecords: 0,
    errors: [],
    message,
    atomicity: createAtomicity(false),
  };
}

function createAtomicity(rollbackAttempted: boolean, rollbackSucceeded?: boolean): BackupRestoreAtomicity {
  return {
    guaranteed: false,
    rollbackAttempted,
    rollbackSucceeded,
    limitation: ATOMICITY_LIMITATION,
  };
}

function createBackupFileName(date: Date) {
  const datePart = date.toISOString().slice(0, 10);
  const timePart = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
  return `axionride-backup-${datePart}-${timePart}.json`;
}

function getRecordId(value: unknown) {
  return isRecord(value) && typeof value.id === 'string' ? value.id : 'unknown';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

import type { Maintenance } from '@/src/domain/maintenance';
import type { Motorcycle } from '@/src/domain/motorcycle';
import type { Ride, RideId, RidePoint } from '@/src/domain/ride';

export const AXIONRIDE_BACKUP_APPLICATION_ID = 'com.axionride.local-backup';
export const AXIONRIDE_BACKUP_SCHEMA_VERSION = 2;

export type AxionRideBackupRidePoint = {
  readonly rideId: RideId;
  readonly sequence: number;
  readonly point: RidePoint;
};

export type AxionRideBackupV2 = {
  readonly schemaVersion: typeof AXIONRIDE_BACKUP_SCHEMA_VERSION;
  readonly source: {
    readonly application: typeof AXIONRIDE_BACKUP_APPLICATION_ID;
    readonly name: 'AxionRide';
  };
  readonly exportedAt: string;
  readonly metadata: {
    readonly format: 'full-local-replacement';
    readonly workspace: {
      readonly sourceWorkspaceId: string;
      readonly sourceWorkspaceKind: 'anonymous' | 'authenticated';
      readonly displayName: string;
    };
    readonly notes?: string;
    readonly future?: Record<string, unknown>;
  };
  readonly data: {
    readonly motorcycles: readonly Motorcycle[];
    readonly maintenanceRecords: readonly Maintenance[];
    readonly rides: readonly Ride[];
    readonly ridePoints: readonly AxionRideBackupRidePoint[];
  };
};

export type AxionRideBackup = AxionRideBackupV2;

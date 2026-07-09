import type { Maintenance } from '@/src/domain/maintenance';

/**
 * Engine status values returned by maintenance calculations.
 */
export type MaintenanceEngineStatus = 'good' | 'dueSoon' | 'overdue' | 'unknown';

/**
 * Color key for consumers to map into their own theme tokens.
 */
export type MaintenanceStatusColorKey = 'success' | 'warning' | 'danger' | 'muted';

/**
 * Distance-based maintenance calculation input.
 */
export type KmMaintenanceInput = {
  readonly lastServiceOdometerKm?: number | null;
  readonly intervalKm?: number | null;
  readonly currentOdometerKm?: number | null;
  readonly dueSoonThresholdPercent?: number | null;
  readonly dueSoonThresholdKm?: number | null;
};

/**
 * Date-based maintenance calculation input.
 */
export type DateMaintenanceInput = {
  readonly lastServiceDate?: string | null;
  readonly intervalDays?: number | null;
  readonly currentDate?: Date | string | null;
  readonly dueSoonThresholdPercent?: number | null;
  readonly dueSoonThresholdDays?: number | null;
};

/**
 * Combined maintenance calculation input.
 */
export type MaintenanceStatusInput = {
  readonly maintenance: Pick<
    Maintenance,
    'lastServiceOdometerKm' | 'intervalKm' | 'lastServiceDate' | 'intervalDays' | 'nextDueOdometerKm' | 'nextDueDate'
  >;
  readonly currentOdometerKm?: number | null;
  readonly currentDate?: Date | string | null;
  readonly dueSoonThresholdPercent?: number | null;
  readonly dueSoonThresholdKm?: number | null;
  readonly dueSoonThresholdDays?: number | null;
};

/**
 * Result for distance-based maintenance status.
 */
export type KmMaintenanceStatusResult = {
  readonly status: MaintenanceEngineStatus;
  readonly nextDueOdometerKm: number | null;
  readonly remainingKm: number | null;
  readonly percentUsed: number | null;
  readonly overdueByKm: number | null;
};

/**
 * Result for date-based maintenance status.
 */
export type DateMaintenanceStatusResult = {
  readonly status: MaintenanceEngineStatus;
  readonly nextDueDate: string | null;
  readonly remainingDays: number | null;
  readonly percentUsed: number | null;
  readonly overdueByDays: number | null;
};

/**
 * Combined result using the worst status from distance and date calculations.
 */
export type MaintenanceStatusResult = {
  readonly status: MaintenanceEngineStatus;
  readonly km: KmMaintenanceStatusResult;
  readonly date: DateMaintenanceStatusResult;
};

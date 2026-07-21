import type {
    Maintenance, MaintenanceId, MaintenancePriority,
    MaintenanceStatus,
    MaintenanceType
} from "@/src/domain/maintenance";

/**
 * Input for creating a maintenance record from application UI.
 */
export type CreateMaintenanceInput = {
  readonly motorcycleId?: string;
  readonly title: string;
  readonly description?: string;
  readonly type?: MaintenanceType;
  readonly status?: MaintenanceStatus;
  readonly priority?: MaintenancePriority;
  readonly intervalKm?: number;
  readonly intervalDays?: number;
  readonly lastServiceOdometerKm?: number;
  readonly lastServiceDate?: string;
  readonly nextDueOdometerKm?: number;
  readonly nextDueDate?: string;
  readonly cost?: number;
  readonly notes?: string;
};

/**
 * Input for updating an existing maintenance record.
 */
export type UpdateMaintenanceInput = Partial<
  Omit<CreateMaintenanceInput, "motorcycleId">
> & {
  readonly id: MaintenanceId;
  readonly motorcycleId?: string;
};

/**
 * Input for marking maintenance as completed.
 */
export type CompleteMaintenanceInput = {
  readonly id: MaintenanceId;
  readonly completedAt?: string;
  readonly odometerKm?: number;
  readonly cost?: number;
  readonly notes?: string;
};

/**
 * Read model returned by maintenance service list operations.
 */
export type MaintenanceListItem = {
  readonly maintenance: Maintenance;
  readonly statusLabel: string;
  readonly colorKey: "success" | "warning" | "danger" | "muted";
  readonly remainingKm: number | null;
  readonly remainingDays: number | null;
  readonly progress: number;
};

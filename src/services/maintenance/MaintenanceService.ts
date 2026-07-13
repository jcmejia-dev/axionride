import type { Motorcycle } from '@/src/domain/motorcycle';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  type Maintenance,
  type MaintenanceId,
} from '@/src/domain/maintenance';
import {
  calculateMaintenanceStatus,
  calculateNextDueDate,
  calculateNextDueOdometer,
  getMaintenanceStatusColorKey,
  getMaintenanceStatusLabel,
} from '@/src/features/maintenance-engine';
import { BaseService } from '@/src/services/BaseService';
import type { NotificationService } from '@/src/services/notifications';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { RiderProgressService } from '@/src/services/rider-progress';

import type {
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  MaintenanceListItem,
  UpdateMaintenanceInput,
} from './MaintenanceServiceTypes';

/**
 * Application service for maintenance use cases.
 *
 * UI code should call this service instead of repositories or engine helpers
 * directly. The service owns record construction, engine orchestration, and
 * repository persistence.
 */
export class MaintenanceService extends BaseService {
  private readonly notificationService?: NotificationService;
  private readonly riderProgressService: RiderProgressService;

  constructor(
    context: ServiceContext,
    notificationService?: NotificationService,
    riderProgressService = new RiderProgressService(context),
  ) {
    super(context);
    this.notificationService = notificationService;
    this.riderProgressService = riderProgressService;
  }

  async createMaintenance(input: CreateMaintenanceInput): Promise<ServiceResult<Maintenance>> {
    const motorcycleResult = await this.resolveMotorcycle(input.motorcycleId);

    if (!motorcycleResult.ok) {
      return this.failure(motorcycleResult.error);
    }

    const now = new Date();
    const maintenance = this.buildMaintenance({
      input,
      motorcycleId: motorcycleResult.value.id,
      now,
      currentOdometerKm: motorcycleResult.value.odometerKm,
    });
    const saveResult = await this.context.repositories.maintenance.saveMaintenance(maintenance);

    if (!saveResult.ok) {
      return this.failure({
        code: saveResult.error.code === 'validation_failed' ? 'validation_failed' : 'repository_error',
        message: saveResult.error.message,
        cause: saveResult.error,
      });
    }

    await this.scheduleMaintenanceReminder(saveResult.value);

    return this.success(saveResult.value);
  }

  async updateMaintenance(input: UpdateMaintenanceInput): Promise<ServiceResult<Maintenance>> {
    const existingMaintenance = await this.context.repositories.maintenance.getMaintenance(input.id);

    if (!existingMaintenance) {
      return this.failure({
        code: 'not_found',
        message: 'Maintenance record was not found.',
      });
    }

    const motorcycle = await this.context.repositories.motorcycles.getMotorcycle(input.motorcycleId ?? existingMaintenance.motorcycleId);
    if (!motorcycle) return this.failure({ code: 'not_found', message: 'Select a motorcycle before updating maintenance.' });
    const nextMaintenance = this.recalculateMaintenance({
      ...existingMaintenance,
      ...stripUndefined({
        motorcycleId: input.motorcycleId,
        title: input.title?.trim(),
        description: normalizeOptionalText(input.description),
        type: input.type,
        priority: input.priority,
        intervalKm: input.intervalKm,
        intervalDays: input.intervalDays,
        lastServiceOdometerKm: input.lastServiceOdometerKm,
        lastServiceDate: input.lastServiceDate,
        cost: input.cost,
        notes: normalizeOptionalText(input.notes),
      }),
      updatedAt: new Date().toISOString(),
    }, motorcycle.odometerKm);
    const updateResult = await this.context.repositories.maintenance.updateMaintenance(nextMaintenance);

    if (!updateResult.ok) {
      return this.failure({
        code: updateResult.error.code === 'validation_failed' ? 'validation_failed' : 'repository_error',
        message: updateResult.error.message,
        cause: updateResult.error,
      });
    }

    await this.scheduleMaintenanceReminder(updateResult.value);

    return this.success(updateResult.value);
  }

  async deleteMaintenance(id: MaintenanceId): Promise<ServiceResult<{ readonly id: MaintenanceId }>> {
    const deleteResult = await this.context.repositories.maintenance.deleteMaintenance(id);

    if (!deleteResult.ok) {
      return this.failure({
        code: deleteResult.error.code === 'not_found' ? 'not_found' : 'repository_error',
        message: deleteResult.error.message,
        cause: deleteResult.error,
      });
    }

    await this.cancelMaintenanceReminder(id);

    return this.success(deleteResult.value);
  }

  async completeMaintenance(input: CompleteMaintenanceInput): Promise<ServiceResult<Maintenance>> {
    const existingMaintenance = await this.context.repositories.maintenance.getMaintenance(input.id);

    if (!existingMaintenance) {
      return this.failure({
        code: 'not_found',
        message: 'Maintenance record was not found.',
      });
    }

    const completedDate = input.completedAt ?? toDateOnlyString(new Date());
    const completedOdometerKm =
      input.odometerKm ?? existingMaintenance.nextDueOdometerKm ?? existingMaintenance.lastServiceOdometerKm;
    const motorcycle = await this.context.repositories.motorcycles.getMotorcycle(existingMaintenance.motorcycleId);
    if (!motorcycle) return this.failure({ code: 'not_found', message: 'The motorcycle for this maintenance record was not found.' });
    const nextMaintenance = this.recalculateMaintenance({
      ...existingMaintenance,
      status: MaintenanceStatus.Completed,
      lastServiceDate: completedDate,
      lastServiceOdometerKm: completedOdometerKm,
      cost: input.cost ?? existingMaintenance.cost,
      notes: input.notes ?? existingMaintenance.notes,
      updatedAt: new Date().toISOString(),
    }, motorcycle.odometerKm);
    const updateResult = await this.context.repositories.maintenance.updateMaintenance(nextMaintenance);

    if (!updateResult.ok) {
      return this.failure({
        code: updateResult.error.code === 'validation_failed' ? 'validation_failed' : 'repository_error',
        message: updateResult.error.message,
        cause: updateResult.error,
      });
    }

    await this.cancelMaintenanceReminder(updateResult.value.id);

    const progressResult = await this.riderProgressService.recordMaintenanceCompleted(updateResult.value.id);
    if (!progressResult.ok) {
      this.context.logger?.warn?.('Maintenance was completed, but rider progress could not be updated.', {
        maintenanceId: updateResult.value.id,
        error: progressResult.error,
      });
    }

    return this.success(updateResult.value);
  }

  async getMaintenanceHistory(): Promise<ServiceResult<readonly MaintenanceListItem[]>> {
    const maintenanceRecords = await this.context.repositories.maintenance.getAllMaintenance();
    const primary = await this.context.repositories.motorcycles.getPrimaryMotorcycle();
    return this.success(
      maintenanceRecords
        .filter((maintenance) => maintenance.status === MaintenanceStatus.Completed)
        .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt))
        .map((maintenance) => this.toListItem(maintenance, primary?.odometerKm ?? maintenance.lastServiceOdometerKm ?? 0)),
    );
  }

  async getUpcomingMaintenance(): Promise<ServiceResult<readonly MaintenanceListItem[]>> {
    const maintenanceRecords = await this.context.repositories.maintenance.getAllMaintenance();
    const primary = await this.context.repositories.motorcycles.getPrimaryMotorcycle();
    return this.success(
      maintenanceRecords
        .filter((maintenance) => maintenance.status !== MaintenanceStatus.Completed && maintenance.status !== MaintenanceStatus.Skipped)
        .sort(compareUpcomingMaintenance)
        .map((maintenance) => this.toListItem(maintenance, primary?.odometerKm ?? maintenance.lastServiceOdometerKm ?? 0)),
    );
  }

  private buildMaintenance({
    input,
    motorcycleId,
    now,
    currentOdometerKm,
  }: {
    readonly input: CreateMaintenanceInput;
    readonly motorcycleId: string;
    readonly now: Date;
    readonly currentOdometerKm: number;
  }): Maintenance {
    const createdAt = now.toISOString();
    const lastServiceOdometerKm = input.lastServiceOdometerKm ?? currentOdometerKm;
    const lastServiceDate = input.lastServiceDate ?? toDateOnlyString(addDays(now, -82));
    const intervalKm = input.intervalKm ?? 1500;
    const intervalDays = input.intervalDays ?? 90;

    return this.recalculateMaintenance({
      id: `maintenance-${now.getTime()}`,
      motorcycleId,
      title: input.title.trim(),
      description: normalizeOptionalText(input.description),
      type: input.type ?? MaintenanceType.OilChange,
      status: MaintenanceStatus.Upcoming,
      priority: input.priority ?? MaintenancePriority.Normal,
      intervalKm,
      intervalDays,
      lastServiceOdometerKm,
      lastServiceDate,
      nextDueOdometerKm: calculateNextDueOdometer(lastServiceOdometerKm, intervalKm) ?? undefined,
      nextDueDate: calculateNextDueDate(lastServiceDate, intervalDays) ?? undefined,
      cost: input.cost,
      notes: normalizeOptionalText(input.notes),
      createdAt,
      updatedAt: createdAt,
    }, currentOdometerKm);
  }

  private recalculateMaintenance(maintenance: Maintenance, currentOdometerKm: number): Maintenance {
    const nextDueOdometerKm =
      calculateNextDueOdometer(maintenance.lastServiceOdometerKm, maintenance.intervalKm) ?? maintenance.nextDueOdometerKm;
    const nextDueDate =
      calculateNextDueDate(maintenance.lastServiceDate, maintenance.intervalDays) ?? maintenance.nextDueDate;
    const statusResult = calculateMaintenanceStatus({
      maintenance: {
        lastServiceOdometerKm: maintenance.lastServiceOdometerKm,
        intervalKm: maintenance.intervalKm,
        lastServiceDate: maintenance.lastServiceDate,
        intervalDays: maintenance.intervalDays,
      },
      currentOdometerKm,
      currentDate: new Date(),
    });

    return {
      ...maintenance,
      status: maintenance.status === MaintenanceStatus.Completed
        ? MaintenanceStatus.Completed
        : toDomainStatus(statusResult.status),
      nextDueOdometerKm: nextDueOdometerKm ?? undefined,
      nextDueDate: nextDueDate ?? undefined,
    };
  }

  private toListItem(maintenance: Maintenance, currentOdometerKm: number): MaintenanceListItem {
    const statusResult = calculateMaintenanceStatus({
      maintenance: {
        lastServiceOdometerKm: maintenance.lastServiceOdometerKm,
        intervalKm: maintenance.intervalKm,
        lastServiceDate: maintenance.lastServiceDate,
        intervalDays: maintenance.intervalDays,
      },
      currentOdometerKm,
      currentDate: new Date(),
    });
    const progress = Math.max(
      statusResult.km.percentUsed ?? 0,
      statusResult.date.percentUsed ?? 0,
    ) / 100;

    return {
      maintenance,
      statusLabel: maintenance.status === MaintenanceStatus.Completed
        ? 'Completed'
        : getMaintenanceStatusLabel(statusResult.status),
      colorKey: maintenance.status === MaintenanceStatus.Completed
        ? 'success'
        : getMaintenanceStatusColorKey(statusResult.status),
      remainingKm: statusResult.km.remainingKm,
      remainingDays: statusResult.date.remainingDays,
      progress: Math.max(0, Math.min(progress, 1)),
    };
  }

  private async resolveMotorcycle(motorcycleId?: string): Promise<ServiceResult<Motorcycle>> {
    const motorcycle = motorcycleId
      ? await this.context.repositories.motorcycles.getMotorcycle(motorcycleId)
      : await this.context.repositories.motorcycles.getPrimaryMotorcycle();
    return motorcycle
      ? this.success(motorcycle)
      : this.failure({ code: 'not_found', message: 'Add a motorcycle and select it as primary before creating maintenance.' });
  }

  private async scheduleMaintenanceReminder(maintenance: Maintenance) {
    const result = await this.notificationService?.scheduleMaintenanceReminder({ maintenance });

    if (result && !result.ok) {
      this.context.logger?.warn?.('Maintenance was saved, but its notification reminder could not be scheduled.', {
        maintenanceId: maintenance.id,
        error: result.error,
      });
    }
  }

  private async cancelMaintenanceReminder(id: MaintenanceId) {
    const result = await this.notificationService?.cancelMaintenanceReminder(id);

    if (result && !result.ok) {
      this.context.logger?.warn?.('Maintenance was changed, but its notification reminder could not be cancelled.', {
        maintenanceId: id,
        error: result.error,
      });
    }
  }
}

function toDomainStatus(status: 'good' | 'dueSoon' | 'overdue' | 'unknown') {
  switch (status) {
    case 'good':
      return MaintenanceStatus.Upcoming;
    case 'dueSoon':
      return MaintenanceStatus.DueSoon;
    case 'overdue':
      return MaintenanceStatus.Overdue;
    case 'unknown':
      return MaintenanceStatus.Upcoming;
  }
}

function compareUpcomingMaintenance(first: Maintenance, second: Maintenance) {
  const firstOdometer = first.nextDueOdometerKm ?? Number.POSITIVE_INFINITY;
  const secondOdometer = second.nextDueOdometerKm ?? Number.POSITIVE_INFINITY;

  if (firstOdometer !== secondOdometer) {
    return firstOdometer - secondOdometer;
  }

  return Date.parse(first.createdAt) - Date.parse(second.createdAt);
}

function normalizeOptionalText(value: string | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<T>;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

import {
  DEFAULT_DUE_SOON_THRESHOLD_DAYS,
  DEFAULT_DUE_SOON_THRESHOLD_KM,
  DEFAULT_DUE_SOON_THRESHOLD_PERCENT,
  MS_PER_DAY,
} from './MaintenanceEngineRules';
import type {
  DateMaintenanceInput,
  DateMaintenanceStatusResult,
  KmMaintenanceInput,
  KmMaintenanceStatusResult,
  MaintenanceEngineStatus,
  MaintenanceStatusColorKey,
  MaintenanceStatusInput,
  MaintenanceStatusResult,
} from './MaintenanceEngineTypes';

/**
 * Calculate the next due odometer from a last service odometer and interval.
 */
export function calculateNextDueOdometer(
  lastServiceOdometerKm?: number | null,
  intervalKm?: number | null,
): number | null {
  if (!isUsableNumber(lastServiceOdometerKm) || !isPositiveNumber(intervalKm)) {
    return null;
  }

  return lastServiceOdometerKm + intervalKm;
}

/**
 * Calculate the next due date from a last service date and day interval.
 */
export function calculateNextDueDate(lastServiceDate?: string | null, intervalDays?: number | null): string | null {
  if (!isPositiveNumber(intervalDays)) {
    return null;
  }

  const parsedLastServiceDate = parseDateOnly(lastServiceDate);

  if (!parsedLastServiceDate) {
    return null;
  }

  const nextDueTime = parsedLastServiceDate.getTime() + intervalDays * MS_PER_DAY;
  return toDateOnlyString(new Date(nextDueTime));
}

/**
 * Calculate distance-based maintenance status.
 *
 * A task is overdue when current odometer is at or past the next due odometer.
 * It is due soon when either the percent used crosses the threshold or the
 * remaining kilometers are inside the due-soon distance window.
 */
export function calculateKmMaintenanceStatus(input: KmMaintenanceInput): KmMaintenanceStatusResult {
  const dueSoonThresholdPercent = normalizePercentThreshold(input.dueSoonThresholdPercent);
  const dueSoonThresholdKm = normalizeNonNegativeThreshold(input.dueSoonThresholdKm, DEFAULT_DUE_SOON_THRESHOLD_KM);
  const nextDueOdometerKm = calculateNextDueOdometer(input.lastServiceOdometerKm, input.intervalKm);
  const lastServiceOdometerKm = input.lastServiceOdometerKm;
  const intervalKm = input.intervalKm;
  const currentOdometerKm = input.currentOdometerKm;

  if (!isUsableNumber(lastServiceOdometerKm) || !isUsableNumber(currentOdometerKm) || !isPositiveNumber(intervalKm) || nextDueOdometerKm === null) {
    return unknownKmResult(nextDueOdometerKm);
  }

  const distanceUsed = currentOdometerKm - lastServiceOdometerKm;
  const percentUsed = clampPercent((distanceUsed / intervalKm) * 100) ?? 0;
  const remainingKm = nextDueOdometerKm - currentOdometerKm;

  if (remainingKm <= 0) {
    return {
      status: 'overdue',
      nextDueOdometerKm,
      remainingKm: 0,
      percentUsed: 100,
      overdueByKm: Math.abs(remainingKm),
    };
  }

  if (percentUsed >= dueSoonThresholdPercent || remainingKm <= dueSoonThresholdKm) {
    return {
      status: 'dueSoon',
      nextDueOdometerKm,
      remainingKm,
      percentUsed,
      overdueByKm: null,
    };
  }

  return {
    status: 'good',
    nextDueOdometerKm,
    remainingKm,
    percentUsed,
    overdueByKm: null,
  };
}

/**
 * Calculate date-based maintenance status.
 *
 * A task is overdue when the current date is on or after the next due date.
 * It is due soon when either the percent used crosses the threshold or the
 * remaining days are inside the due-soon day window.
 */
export function calculateDateMaintenanceStatus(input: DateMaintenanceInput): DateMaintenanceStatusResult {
  const dueSoonThresholdPercent = normalizePercentThreshold(input.dueSoonThresholdPercent);
  const dueSoonThresholdDays = normalizeNonNegativeThreshold(
    input.dueSoonThresholdDays,
    DEFAULT_DUE_SOON_THRESHOLD_DAYS,
  );
  const currentDate = normalizeCurrentDate(input.currentDate);
  const lastServiceDate = parseDateOnly(input.lastServiceDate);
  const nextDueDate = calculateNextDueDate(input.lastServiceDate, input.intervalDays);
  const parsedNextDueDate = parseDateOnly(nextDueDate);

  if (!lastServiceDate || !parsedNextDueDate || !isPositiveNumber(input.intervalDays)) {
    return unknownDateResult(nextDueDate);
  }

  const elapsedDays = Math.floor((currentDate.getTime() - lastServiceDate.getTime()) / MS_PER_DAY);
  const remainingDays = Math.ceil((parsedNextDueDate.getTime() - currentDate.getTime()) / MS_PER_DAY);
  const intervalDays = input.intervalDays;
  const percentUsed = clampPercent((elapsedDays / intervalDays) * 100) ?? 0;

  if (remainingDays <= 0) {
    return {
      status: 'overdue',
      nextDueDate,
      remainingDays: 0,
      percentUsed: 100,
      overdueByDays: Math.abs(remainingDays),
    };
  }

  if (percentUsed >= dueSoonThresholdPercent || remainingDays <= dueSoonThresholdDays) {
    return {
      status: 'dueSoon',
      nextDueDate,
      remainingDays,
      percentUsed,
      overdueByDays: null,
    };
  }

  return {
    status: 'good',
    nextDueDate,
    remainingDays,
    percentUsed,
    overdueByDays: null,
  };
}

/**
 * Calculate combined maintenance status using the worst distance/date result.
 */
export function calculateMaintenanceStatus(input: MaintenanceStatusInput): MaintenanceStatusResult {
  const km = calculateKmMaintenanceStatus({
    lastServiceOdometerKm: input.maintenance.lastServiceOdometerKm,
    intervalKm: input.maintenance.intervalKm,
    currentOdometerKm: input.currentOdometerKm,
    dueSoonThresholdPercent: input.dueSoonThresholdPercent,
    dueSoonThresholdKm: input.dueSoonThresholdKm,
  });
  const date = calculateDateMaintenanceStatus({
    lastServiceDate: input.maintenance.lastServiceDate,
    intervalDays: input.maintenance.intervalDays,
    currentDate: input.currentDate,
    dueSoonThresholdPercent: input.dueSoonThresholdPercent,
    dueSoonThresholdDays: input.dueSoonThresholdDays,
  });

  return {
    status: getWorstStatus(km.status, date.status),
    km,
    date,
  };
}

/**
 * Get a readable label for a maintenance engine status.
 */
export function getMaintenanceStatusLabel(status: MaintenanceEngineStatus): string {
  switch (status) {
    case 'good':
      return 'Good';
    case 'dueSoon':
      return 'Due Soon';
    case 'overdue':
      return 'Overdue';
    case 'unknown':
      return 'Unknown';
  }
}

/**
 * Get a semantic color key for a maintenance engine status.
 */
export function getMaintenanceStatusColorKey(status: MaintenanceEngineStatus): MaintenanceStatusColorKey {
  switch (status) {
    case 'good':
      return 'success';
    case 'dueSoon':
      return 'warning';
    case 'overdue':
      return 'danger';
    case 'unknown':
      return 'muted';
  }
}

function getWorstStatus(first: MaintenanceEngineStatus, second: MaintenanceEngineStatus): MaintenanceEngineStatus {
  return statusRank[first] >= statusRank[second] ? first : second;
}

const statusRank: Record<MaintenanceEngineStatus, number> = {
  unknown: 0,
  good: 1,
  dueSoon: 2,
  overdue: 3,
};

function unknownKmResult(nextDueOdometerKm: number | null): KmMaintenanceStatusResult {
  return {
    status: 'unknown',
    nextDueOdometerKm,
    remainingKm: null,
    percentUsed: null,
    overdueByKm: null,
  };
}

function unknownDateResult(nextDueDate: string | null): DateMaintenanceStatusResult {
  return {
    status: 'unknown',
    nextDueDate,
    remainingDays: null,
    percentUsed: null,
    overdueByDays: null,
  };
}

function isUsableNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function normalizePercentThreshold(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_DUE_SOON_THRESHOLD_PERCENT;
  }

  return Math.max(0, Math.min(value, 100));
}

function normalizeNonNegativeThreshold(value: number | null | undefined, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return value;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(Math.round(value), 100));
}

function normalizeCurrentDate(value: Date | string | null | undefined) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return startOfUtcDate(value);
  }

  const parsedDate = typeof value === 'string' ? parseDateOnly(value) : null;
  return parsedDate ?? startOfUtcDate(new Date());
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsedTime = Date.parse(`${value.slice(0, 10)}T00:00:00.000Z`);

  if (!Number.isFinite(parsedTime)) {
    return null;
  }

  return new Date(parsedTime);
}

function startOfUtcDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

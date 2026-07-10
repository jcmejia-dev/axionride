import type { Maintenance, MaintenanceId } from '@/src/domain/maintenance';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type NotificationPermissionStatus = {
  readonly state: NotificationPermissionState;
  readonly canAskAgain: boolean;
  readonly granted: boolean;
  readonly message?: string;
};

export type MaintenanceReminderInput = {
  readonly maintenance: Maintenance;
};

export type ScheduledNotificationItem = {
  readonly identifier: string;
  readonly title: string | null;
  readonly body: string | null;
  readonly maintenanceId?: MaintenanceId;
};

export type ImmediateLocalNotificationInput = {
  readonly title?: string;
  readonly body?: string;
};

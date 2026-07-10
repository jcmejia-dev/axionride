import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { MaintenanceStatus, type Maintenance, type MaintenanceId } from '@/src/domain/maintenance';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { SettingsService } from '@/src/services/settings';

import type {
  ImmediateLocalNotificationInput,
  MaintenanceReminderInput,
  NotificationPermissionStatus,
  ScheduledNotificationItem,
} from './NotificationServiceTypes';

const MAINTENANCE_CHANNEL_ID = 'maintenance-reminders';
const TEST_CHANNEL_ID = 'local-notification-tests';
const MAINTENANCE_IDENTIFIER_PREFIX = 'maintenance-reminder:';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService extends BaseService {
  private readonly settingsService: SettingsService;

  constructor(context: ServiceContext, settingsService = new SettingsService(context)) {
    super(context);
    this.settingsService = settingsService;
  }

  async requestPermission(): Promise<ServiceResult<NotificationPermissionStatus>> {
    const channelResult = await this.ensureAndroidChannels();

    if (!channelResult.ok) {
      return this.failure(channelResult.error);
    }

    try {
      const status = await Notifications.requestPermissionsAsync();
      return this.success(toPermissionStatus(status));
    } catch (error) {
      return this.notificationFailure('Notification permission could not be requested.', error);
    }
  }

  async getPermissionStatus(): Promise<ServiceResult<NotificationPermissionStatus>> {
    try {
      const status = await Notifications.getPermissionsAsync();
      return this.success(toPermissionStatus(status));
    } catch (error) {
      return this.notificationFailure('Notification permission status could not be loaded.', error);
    }
  }

  async scheduleMaintenanceReminder(input: MaintenanceReminderInput): Promise<ServiceResult<ScheduledNotificationItem | null>> {
    const settingsResult = this.settingsService.areLocalNotificationsEnabled();

    if (!settingsResult.ok) {
      return this.failure(settingsResult.error);
    }

    await this.cancelMaintenanceReminder(input.maintenance.id);

    if (!settingsResult.value || !shouldScheduleMaintenance(input.maintenance)) {
      return this.success(null);
    }

    const permissionResult = await this.getPermissionStatus();

    if (!permissionResult.ok) {
      return this.failure(permissionResult.error);
    }

    if (!permissionResult.value.granted) {
      this.context.logger?.warn?.('Maintenance reminder skipped because notification permission is not granted.', {
        maintenanceId: input.maintenance.id,
        permissionState: permissionResult.value.state,
      });
      return this.success(null);
    }

    const channelResult = await this.ensureAndroidChannels();

    if (!channelResult.ok) {
      return this.failure(channelResult.error);
    }

    const reminderDate = createReminderDate(input.maintenance.nextDueDate);

    if (!reminderDate || reminderDate.getTime() <= Date.now()) {
      return this.success(null);
    }

    const identifier = createMaintenanceReminderIdentifier(input.maintenance.id);

    try {
      const scheduledIdentifier = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: 'Maintenance reminder',
          body: `${input.maintenance.title} is due today.`,
          data: {
            type: 'maintenance-reminder',
            maintenanceId: input.maintenance.id,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
          channelId: MAINTENANCE_CHANNEL_ID,
        },
      });

      return this.success({
        identifier: scheduledIdentifier,
        title: 'Maintenance reminder',
        body: `${input.maintenance.title} is due today.`,
        maintenanceId: input.maintenance.id,
      });
    } catch (error) {
      return this.notificationFailure('Maintenance reminder could not be scheduled.', error);
    }
  }

  async cancelMaintenanceReminder(id: MaintenanceId): Promise<ServiceResult<{ readonly identifier: string }>> {
    const identifier = createMaintenanceReminderIdentifier(id);

    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      return this.success({ identifier });
    } catch (error) {
      return this.notificationFailure('Maintenance reminder could not be cancelled.', error);
    }
  }

  async cancelAllNotifications(): Promise<ServiceResult<void>> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return this.success(undefined);
    } catch (error) {
      return this.notificationFailure('Scheduled notifications could not be cancelled.', error);
    }
  }

  async getScheduledNotifications(): Promise<ServiceResult<readonly ScheduledNotificationItem[]>> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return this.success(
        notifications.map((notification) => ({
          identifier: notification.identifier,
          title: notification.content.title ?? null,
          body: notification.content.body ?? null,
          maintenanceId: toMaintenanceId(notification.content.data?.maintenanceId),
        })),
      );
    } catch (error) {
      return this.notificationFailure('Scheduled notifications could not be loaded.', error);
    }
  }

  async showImmediateLocalNotification(
    input: ImmediateLocalNotificationInput = {},
  ): Promise<ServiceResult<ScheduledNotificationItem | null>> {
    const settingsResult = this.settingsService.areLocalNotificationsEnabled();

    if (!settingsResult.ok) {
      return this.failure(settingsResult.error);
    }

    if (!settingsResult.value) {
      return this.success(null);
    }

    const permissionResult = await this.getPermissionStatus();

    if (!permissionResult.ok) {
      return this.failure(permissionResult.error);
    }

    if (!permissionResult.value.granted) {
      return this.success(null);
    }

    const channelResult = await this.ensureAndroidChannels();

    if (!channelResult.ok) {
      return this.failure(channelResult.error);
    }

    const title = input.title ?? 'AxionRide notifications ready';
    const body = input.body ?? 'Local notification scheduling is working on this device.';

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'local-notification-test',
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
          channelId: TEST_CHANNEL_ID,
        },
      });

      return this.success({ identifier, title, body });
    } catch (error) {
      return this.notificationFailure('Test notification could not be shown.', error);
    }
  }

  private async ensureAndroidChannels(): Promise<ServiceResult<void>> {
    if (Platform.OS !== 'android') {
      return this.success(undefined);
    }

    try {
      await Notifications.setNotificationChannelAsync(MAINTENANCE_CHANNEL_ID, {
        name: 'Maintenance reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F97316',
      });
      await Notifications.setNotificationChannelAsync(TEST_CHANNEL_ID, {
        name: 'Local notification tests',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      return this.success(undefined);
    } catch (error) {
      return this.notificationFailure('Android notification channels could not be prepared.', error);
    }
  }

  private notificationFailure<T = never>(message: string, cause: unknown): ServiceResult<T> {
    this.context.logger?.warn?.(message, { cause });

    return this.failure({
      code: 'unknown_error',
      message,
      cause,
    });
  }
}

function toPermissionStatus(status: Notifications.NotificationPermissionsStatus): NotificationPermissionStatus {
  if (status.granted) {
    return {
      state: 'granted',
      granted: true,
      canAskAgain: status.canAskAgain,
    };
  }

  return {
    state: status.status === Notifications.PermissionStatus.DENIED ? 'denied' : 'undetermined',
    granted: false,
    canAskAgain: status.canAskAgain,
  };
}

function shouldScheduleMaintenance(maintenance: Maintenance) {
  return maintenance.status !== MaintenanceStatus.Completed
    && maintenance.status !== MaintenanceStatus.Skipped
    && Boolean(maintenance.nextDueDate);
}

function createReminderDate(nextDueDate: string | undefined) {
  if (!nextDueDate) {
    return null;
  }

  const [year, month, day] = nextDueDate.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 9, 0, 0, 0);
}

function createMaintenanceReminderIdentifier(id: MaintenanceId) {
  return `${MAINTENANCE_IDENTIFIER_PREFIX}${encodeURIComponent(id)}`;
}

function toMaintenanceId(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

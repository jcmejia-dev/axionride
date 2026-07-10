import Constants, { ExecutionEnvironment } from 'expo-constants';
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
const EXPO_GO_UNAVAILABLE_MESSAGE = 'Local notification testing requires a development build. Expo Go cannot load AxionRide notification APIs safely on this SDK.';

type ExpoNotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<ExpoNotificationsModule> | null = null;
let notificationHandlerConfigured = false;

export class NotificationService extends BaseService {
  private readonly settingsService: SettingsService;

  constructor(context: ServiceContext, settingsService = new SettingsService(context)) {
    super(context);
    this.settingsService = settingsService;
  }

  async requestPermission(): Promise<ServiceResult<NotificationPermissionStatus>> {
    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      return this.success(createUnavailablePermissionStatus());
    }

    const channelResult = await this.ensureAndroidChannels();

    if (!channelResult.ok) {
      return this.failure(channelResult.error);
    }

    try {
      const status = await notifications.value.requestPermissionsAsync();
      return this.success(toPermissionStatus(status, notifications.value));
    } catch (error) {
      return this.notificationFailure('Notification permission could not be requested.', error);
    }
  }

  async getPermissionStatus(): Promise<ServiceResult<NotificationPermissionStatus>> {
    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      return this.success(createUnavailablePermissionStatus());
    }

    try {
      const status = await notifications.value.getPermissionsAsync();
      return this.success(toPermissionStatus(status, notifications.value));
    } catch (error) {
      return this.notificationFailure('Notification permission status could not be loaded.', error);
    }
  }

  async scheduleMaintenanceReminder(input: MaintenanceReminderInput): Promise<ServiceResult<ScheduledNotificationItem | null>> {
    const settingsResult = this.settingsService.areLocalNotificationsEnabled();
    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      await this.cancelMaintenanceReminder(input.maintenance.id);
      return this.success(null);
    }

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
      const scheduledIdentifier = await notifications.value.scheduleNotificationAsync({
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
          type: notifications.value.SchedulableTriggerInputTypes.DATE,
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
    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      return this.success({ identifier });
    }

    try {
      await notifications.value.cancelScheduledNotificationAsync(identifier);
      return this.success({ identifier });
    } catch (error) {
      return this.notificationFailure('Maintenance reminder could not be cancelled.', error);
    }
  }

  async cancelAllNotifications(): Promise<ServiceResult<void>> {
    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      return this.success(undefined);
    }

    try {
      await notifications.value.cancelAllScheduledNotificationsAsync();
      return this.success(undefined);
    } catch (error) {
      return this.notificationFailure('Scheduled notifications could not be cancelled.', error);
    }
  }

  async getScheduledNotifications(): Promise<ServiceResult<readonly ScheduledNotificationItem[]>> {
    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      return this.success([]);
    }

    try {
      const scheduledNotifications = await notifications.value.getAllScheduledNotificationsAsync();
      return this.success(
        scheduledNotifications.map((notification) => ({
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
    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      return this.unavailableFailure(EXPO_GO_UNAVAILABLE_MESSAGE);
    }

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
      const identifier = await notifications.value.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'local-notification-test',
          },
        },
        trigger: {
          type: notifications.value.SchedulableTriggerInputTypes.TIME_INTERVAL,
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

    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      return this.success(undefined);
    }

    try {
      await notifications.value.setNotificationChannelAsync(MAINTENANCE_CHANNEL_ID, {
        name: 'Maintenance reminders',
        importance: notifications.value.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F97316',
      });
      await notifications.value.setNotificationChannelAsync(TEST_CHANNEL_ID, {
        name: 'Local notification tests',
        importance: notifications.value.AndroidImportance.DEFAULT,
      });
      return this.success(undefined);
    } catch (error) {
      return this.notificationFailure('Android notification channels could not be prepared.', error);
    }
  }

  private async loadNotifications(): Promise<ServiceResult<ExpoNotificationsModule>> {
    if (isExpoGo()) {
      return this.unavailableFailure(EXPO_GO_UNAVAILABLE_MESSAGE);
    }

    try {
      notificationsModulePromise ??= import('expo-notifications');
      const notifications = await notificationsModulePromise;

      if (!notificationHandlerConfigured) {
        notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        notificationHandlerConfigured = true;
      }

      return this.success(notifications);
    } catch (error) {
      return this.notificationFailure(EXPO_GO_UNAVAILABLE_MESSAGE, error);
    }
  }

  private unavailableFailure<T = never>(message: string): ServiceResult<T> {
    this.context.logger?.warn?.(message);

    return this.failure({
      code: 'unavailable',
      message,
    });
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

function isExpoGo() {
  return Constants.appOwnership === 'expo'
    || (
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient
      && Constants.expoGoConfig !== null
    );
}

function createUnavailablePermissionStatus(): NotificationPermissionStatus {
  return {
    state: 'unavailable',
    granted: false,
    canAskAgain: false,
    message: EXPO_GO_UNAVAILABLE_MESSAGE,
  };
}

function toPermissionStatus(
  status: Awaited<ReturnType<ExpoNotificationsModule['getPermissionsAsync']>>,
  notifications: ExpoNotificationsModule,
): NotificationPermissionStatus {
  if (status.granted) {
    return {
      state: 'granted',
      granted: true,
      canAskAgain: status.canAskAgain,
    };
  }

  return {
    state: status.status === notifications.PermissionStatus.DENIED ? 'denied' : 'undetermined',
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

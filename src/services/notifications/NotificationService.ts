import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { type MaintenanceId } from '@/src/domain/maintenance';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { SettingsService } from '@/src/services/settings';
import { getAll, getFirst, runStatement } from '@/src/storage/sqlite';
import {
  isMaintenanceNotificationPayload,
  planMaintenanceReminder,
  type MaintenanceReminderPlan,
} from './MaintenanceReminderPlanner';

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
      if (status.granted) {
        return this.getPermissionStatus();
      }
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

      if (Platform.OS === 'android' && status.granted) {
        const channel = await notifications.value.getNotificationChannelAsync(MAINTENANCE_CHANNEL_ID);
        if (channel && channel.importance === notifications.value.AndroidImportance.NONE) {
          return this.success({
            state: 'denied',
            granted: false,
            canAskAgain: false,
            message: 'Maintenance notifications are disabled in Android system settings.',
          });
        }
      }

      return this.success(toPermissionStatus(status, notifications.value));
    } catch (error) {
      return this.notificationFailure('Notification permission status could not be loaded.', error);
    }
  }

  async scheduleMaintenanceReminder(_input: MaintenanceReminderInput): Promise<ServiceResult<ScheduledNotificationItem | null>> {
    const reconciled = await this.reconcileMaintenanceReminders();

    if (!reconciled.ok) {
      return this.failure(reconciled.error);
    }

    return this.success(null);
  }

  async reconcileMaintenanceReminders(): Promise<ServiceResult<{ readonly scheduled: number }>> {
    const notifications = await this.loadNotifications();
    if (!notifications.ok) return this.success({ scheduled: 0 });

    try {
      const workspaceId = await this.context.repositories.workspaces.getActiveWorkspaceId();
      const settings = await this.settingsService.getMaintenanceReminderSettings();
      if (!settings.ok) return this.failure(settings.error);

      const permission = await this.getPermissionStatus();
      if (!permission.ok) return this.failure(permission.error);

      const existing = await notifications.value.getAllScheduledNotificationsAsync();
      const existingIdentifiers = new Set(existing.map((item) => item.identifier));

      for (const item of existing) {
        const data = item.content.data;
        if (isMaintenanceNotificationPayload(data) && data.workspaceId !== workspaceId) {
          await notifications.value.cancelScheduledNotificationAsync(item.identifier);
        }
      }

      if (!settings.value.enabled || !permission.value.granted) {
        for (const item of existing) {
          if (isMaintenanceNotificationPayload(item.content.data) && item.content.data.workspaceId === workspaceId) {
            await notifications.value.cancelScheduledNotificationAsync(item.identifier);
          }
        }
        await runStatement('DELETE FROM maintenance_notification_state WHERE workspace_id = ?', [workspaceId]);
        return this.success({ scheduled: 0 });
      }

      const channelResult = await this.ensureAndroidChannels();
      if (!channelResult.ok) return this.failure(channelResult.error);

      const [records, motorcycles] = await Promise.all([
        this.context.repositories.maintenance.getAllMaintenance(),
        this.context.repositories.motorcycles.getAllMotorcycles(),
      ]);
      const plans = records.map((maintenance) => {
        const motorcycle = motorcycles.find((item) => item.id === maintenance.motorcycleId);
        return motorcycle
          ? planMaintenanceReminder({ workspaceId, maintenance, motorcycle, settings: settings.value })
          : null;
      }).filter((plan): plan is MaintenanceReminderPlan => plan !== null);
      const expected = new Set(plans.map(createPlanIdentifier));
      const persistedStates = await getAll<{
        maintenance_id: string;
        notification_kind: string;
        identifier: string;
      }>(
        `SELECT maintenance_id, notification_kind, identifier
         FROM maintenance_notification_state WHERE workspace_id = ?`,
        [workspaceId],
      );

      for (const item of existing) {
        if (
          isMaintenanceNotificationPayload(item.content.data)
          && item.content.data.workspaceId === workspaceId
          && !expected.has(item.identifier)
        ) {
          await notifications.value.cancelScheduledNotificationAsync(item.identifier);
        }
      }

      for (const state of persistedStates) {
        const stillExpected = plans.some(
          (plan) => plan.maintenanceId === state.maintenance_id && plan.kind === state.notification_kind,
        );
        if (!stillExpected) {
          await notifications.value.cancelScheduledNotificationAsync(state.identifier);
          await runStatement(
            `DELETE FROM maintenance_notification_state
             WHERE workspace_id = ? AND maintenance_id = ? AND notification_kind = ?`,
            [workspaceId, state.maintenance_id, state.notification_kind],
          );
        }
      }

      let scheduled = 0;
      for (const plan of plans) {
        const identifier = createPlanIdentifier(plan);
        await runStatement(
          `DELETE FROM maintenance_notification_state
           WHERE workspace_id = ? AND maintenance_id = ? AND notification_kind <> ?`,
          [workspaceId, plan.maintenanceId, plan.kind],
        );
        const state = await getFirst<{ state_signature: string }>(
          `SELECT state_signature FROM maintenance_notification_state
           WHERE workspace_id = ? AND maintenance_id = ? AND notification_kind = ?`,
          [workspaceId, plan.maintenanceId, plan.kind],
        );
        const futureScheduleStillExists = plan.triggerDate === null || existingIdentifiers.has(identifier);
        if (state?.state_signature === plan.signature && futureScheduleStillExists) continue;

        await notifications.value.cancelScheduledNotificationAsync(identifier);
        await notifications.value.scheduleNotificationAsync({
          identifier,
          content: {
            title: plan.title,
            body: plan.body,
            data: {
              type: 'maintenance-reminder',
              maintenanceId: plan.maintenanceId,
              workspaceId: plan.workspaceId,
              kind: plan.kind,
            },
          },
          trigger: plan.triggerDate ? {
            type: notifications.value.SchedulableTriggerInputTypes.DATE,
            date: plan.triggerDate,
            channelId: MAINTENANCE_CHANNEL_ID,
          } : {
            type: notifications.value.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
            channelId: MAINTENANCE_CHANNEL_ID,
          },
        });
        await runStatement(
          `INSERT INTO maintenance_notification_state(
             workspace_id, maintenance_id, notification_kind, identifier,
             state_signature, scheduled_for, updated_at
           ) VALUES(?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(workspace_id, maintenance_id, notification_kind) DO UPDATE SET
             identifier = excluded.identifier,
             state_signature = excluded.state_signature,
             scheduled_for = excluded.scheduled_for,
             updated_at = excluded.updated_at`,
          [
            workspaceId,
            plan.maintenanceId,
            plan.kind,
            identifier,
            plan.signature,
            plan.triggerDate?.toISOString() ?? null,
            new Date().toISOString(),
          ],
        );
        scheduled += 1;
      }

      return this.success({ scheduled });
    } catch (error) {
      return this.notificationFailure('Maintenance reminders could not be reconciled.', error);
    }
  }

  async addMaintenanceResponseListener(
    handler: (maintenanceId: string) => void,
  ): Promise<ServiceResult<{ remove(): void }>> {
    const notifications = await this.loadNotifications();
    if (!notifications.ok) return this.failure(notifications.error);

    const handle = (data: unknown) => {
      if (!isMaintenanceNotificationPayload(data)) return;
      void this.context.repositories.workspaces.getActiveWorkspaceId().then((workspaceId) => {
        if (workspaceId === data.workspaceId) handler(data.maintenanceId);
      });
    };
    const subscription = notifications.value.addNotificationResponseReceivedListener((response) => {
      handle(response.notification.request.content.data);
    });
    const last = await notifications.value.getLastNotificationResponseAsync();
    if (last) {
      handle(last.notification.request.content.data);
      await notifications.value.clearLastNotificationResponseAsync();
    }
    return this.success(subscription);
  }

  async cancelMaintenanceReminder(id: MaintenanceId): Promise<ServiceResult<{ readonly identifier: string }>> {
    const identifier = createMaintenanceReminderIdentifier(id);
    const notifications = await this.loadNotifications();

    if (!notifications.ok) {
      return this.success({ identifier });
    }

    try {
      await notifications.value.cancelScheduledNotificationAsync(identifier);
      const workspaceId = await this.context.repositories.workspaces.getActiveWorkspaceId();
      const states = await this.getMaintenanceNotificationState(workspaceId, id);
      for (const state of states) {
        await notifications.value.cancelScheduledNotificationAsync(state.identifier);
      }
      await runStatement(
        'DELETE FROM maintenance_notification_state WHERE workspace_id = ? AND maintenance_id = ?',
        [workspaceId, id],
      );
      await this.reconcileMaintenanceReminders();
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
    if (!__DEV__) {
      return this.unavailableFailure('Test notifications are available only in development builds.');
    }

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

  private getMaintenanceNotificationState(workspaceId: string, maintenanceId: string) {
    return getAll<{ identifier: string }>(
      `SELECT identifier FROM maintenance_notification_state
       WHERE workspace_id = ? AND maintenance_id = ?`,
      [workspaceId, maintenanceId],
    );
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
        importance: notifications.value.AndroidImportance.HIGH,
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

function createMaintenanceReminderIdentifier(id: MaintenanceId) {
  return `${MAINTENANCE_IDENTIFIER_PREFIX}${encodeURIComponent(id)}`;
}
function createPlanIdentifier(plan: MaintenanceReminderPlan) {
  return `${MAINTENANCE_IDENTIFIER_PREFIX}${encodeURIComponent(plan.workspaceId)}:${encodeURIComponent(plan.maintenanceId)}:${plan.kind}`;
}

export { isMaintenanceNotificationPayload, planMaintenanceReminder } from './MaintenanceReminderPlanner';

function toMaintenanceId(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

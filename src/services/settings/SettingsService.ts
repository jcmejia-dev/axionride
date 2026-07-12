import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import { getFirst, runStatement } from '@/src/storage/sqlite';

import type { MaintenanceReminderSettings, SettingsOverview } from './SettingsServiceTypes';

const DEFAULT_REMINDER_SETTINGS: MaintenanceReminderSettings = {
  enabled: false,
  dueSoonKm: 500,
  dueSoonDays: 7,
  dailySummaryEnabled: false,
};

let localNotificationsEnabled = DEFAULT_REMINDER_SETTINGS.enabled;
let dueSoonKm = DEFAULT_REMINDER_SETTINGS.dueSoonKm;
let dueSoonDays = DEFAULT_REMINDER_SETTINGS.dueSoonDays;
let dailySummaryEnabled = DEFAULT_REMINDER_SETTINGS.dailySummaryEnabled;

/**
 * Local settings application service.
 *
 * Preferences are kept local. Durable persistence will move behind this service
 * when the planned local storage settings boundary is introduced.
 */
export class SettingsService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }

  getSettingsOverview(): ServiceResult<SettingsOverview> {
    return this.success({
      units: {
        speed: 'km/h',
        distance: 'km',
      },
      localNotificationsEnabled,
      sections: [
        {
          id: 'preferences',
          title: 'App Preferences',
          subtitle: 'Local display defaults',
          items: [
            { id: 'speed-unit', label: 'Speed', value: 'km/h' },
            { id: 'distance-unit', label: 'Distance', value: 'km' },
            { id: 'theme', label: 'Theme', value: 'Dark placeholder' },
          ],
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Local reminders and ride alerts',
          items: [
            {
              id: 'local-notifications',
              label: 'Local notifications',
              value: localNotificationsEnabled ? 'Enabled' : 'Disabled',
              action: 'toggle-local-notifications',
            },
            {
              id: 'maintenance-distance-threshold',
              label: 'Due-soon distance',
              value: `${dueSoonKm} km`,
              action: 'set-maintenance-distance-threshold',
            },
            {
              id: 'maintenance-date-threshold',
              label: 'Due-soon date',
              value: `${dueSoonDays} days`,
              action: 'set-maintenance-date-threshold',
            },
            {
              id: 'notification-permission',
              label: 'Permission',
              value: 'Loading...',
              action: 'request-notification-permission',
            },
            ...(__DEV__ ? [{
              id: 'test-notification',
              label: 'Test notification',
              value: 'Send local test',
              action: 'test-notification' as const,
              disabled: !localNotificationsEnabled,
            }] : []),
          ],
        },
        {
          id: 'data-storage',
          title: 'Data & Storage',
          subtitle: 'Offline-first local foundation',
          items: [
            { id: 'local-data', label: 'Local data', value: 'Stored on device' },
            { id: 'export-backup', label: 'Export Backup', value: 'Share JSON file', action: 'export-backup' },
            { id: 'import-backup', label: 'Import Backup', value: 'Replaces local data', action: 'import-backup' },
            { id: 'sync-status', label: 'Cloud sync', value: 'Not connected', disabled: true },
          ],
        },
        {
          id: 'account',
          title: 'Account',
          subtitle: 'Supabase authentication and local workspace',
          items: [
            { id: 'sign-out', label: 'Sign out', value: 'Keep local data isolated', action: 'sign-out' },
            { id: 'supabase-sync', label: 'Supabase sync', value: 'Disabled', disabled: true },
          ],
        },
        {
          id: 'about',
          title: 'About AxionRide',
          subtitle: 'Motorcycle companion foundation',
          items: [
            { id: 'app', label: 'App', value: 'AxionRide' },
            { id: 'mode', label: 'Data mode', value: 'Local SQLite' },
          ],
        },
      ],
    });
  }

  areLocalNotificationsEnabled(): ServiceResult<boolean> {
    return this.success(localNotificationsEnabled);
  }

  setLocalNotificationsEnabled(enabled: boolean): ServiceResult<boolean> {
    localNotificationsEnabled = enabled;
    return this.success(localNotificationsEnabled);
  }
  async getMaintenanceReminderSettings(): Promise<ServiceResult<MaintenanceReminderSettings>> {
    try {
      const workspaceId = await this.context.repositories.workspaces.getActiveWorkspaceId();
      const row = await getFirst<{ enabled: number; due_soon_km: number; due_soon_days: number; daily_summary_enabled: number }>(
        'SELECT enabled, due_soon_km, due_soon_days, daily_summary_enabled FROM maintenance_notification_settings WHERE workspace_id = ?',
        [workspaceId],
      );

      return this.success(row ? {
        enabled: Boolean(row.enabled),
        dueSoonKm: row.due_soon_km,
        dueSoonDays: row.due_soon_days,
        dailySummaryEnabled: Boolean(row.daily_summary_enabled),
      } : DEFAULT_REMINDER_SETTINGS);
    } catch (cause) {
      return this.failure({ code: 'repository_error', message: 'Reminder settings could not be loaded.', cause });
    }
  }
  async updateMaintenanceReminderSettings(patch:Partial<MaintenanceReminderSettings>):Promise<ServiceResult<MaintenanceReminderSettings>>{const current=await this.getMaintenanceReminderSettings();if(!current.ok)return current;const next={...current.value,...patch,dueSoonKm:Math.max(0,Math.round(patch.dueSoonKm??current.value.dueSoonKm)),dueSoonDays:Math.max(0,Math.round(patch.dueSoonDays??current.value.dueSoonDays))};try{const workspaceId=await this.context.repositories.workspaces.getActiveWorkspaceId();await runStatement(`INSERT INTO maintenance_notification_settings(workspace_id,enabled,due_soon_km,due_soon_days,daily_summary_enabled,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET enabled=excluded.enabled,due_soon_km=excluded.due_soon_km,due_soon_days=excluded.due_soon_days,daily_summary_enabled=excluded.daily_summary_enabled,updated_at=excluded.updated_at`,[workspaceId,next.enabled?1:0,next.dueSoonKm,next.dueSoonDays,next.dailySummaryEnabled?1:0,new Date().toISOString()]);localNotificationsEnabled=next.enabled;dueSoonKm=next.dueSoonKm;dueSoonDays=next.dueSoonDays;dailySummaryEnabled=next.dailySummaryEnabled;return this.success(next)}catch(cause){return this.failure({code:'repository_error',message:'Reminder settings could not be saved.',cause})}}
  async getSettingsOverviewAsync():Promise<ServiceResult<SettingsOverview>>{const reminder=await this.getMaintenanceReminderSettings();if(reminder.ok){localNotificationsEnabled=reminder.value.enabled;dueSoonKm=reminder.value.dueSoonKm;dueSoonDays=reminder.value.dueSoonDays;dailySummaryEnabled=reminder.value.dailySummaryEnabled}return this.getSettingsOverview()}
}

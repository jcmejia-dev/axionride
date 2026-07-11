import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

import type { SettingsOverview } from './SettingsServiceTypes';

let localNotificationsEnabled = true;

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
              id: 'notification-permission',
              label: 'Permission',
              value: 'Loading...',
              action: 'request-notification-permission',
            },
            {
              id: 'test-notification',
              label: 'Test notification',
              value: 'Send local test',
              action: 'test-notification',
              disabled: !localNotificationsEnabled,
            },
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
}

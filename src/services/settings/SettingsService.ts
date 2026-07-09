import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

import type { SettingsOverview } from './SettingsServiceTypes';

/**
 * Local settings application service.
 *
 * Preferences are read-only placeholders until local persistence and account
 * sync settings are introduced in later branches.
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
          id: 'data-storage',
          title: 'Data & Storage',
          subtitle: 'Offline-first local foundation',
          items: [
            { id: 'local-data', label: 'Local data', value: 'Stored on device' },
            { id: 'sync-status', label: 'Cloud sync', value: 'Not connected', disabled: true },
          ],
        },
        {
          id: 'account',
          title: 'Sign-in & Sync',
          subtitle: 'Disabled until authentication is added',
          items: [
            { id: 'sign-in', label: 'Sign in', value: 'Coming later', disabled: true },
            { id: 'supabase-sync', label: 'Supabase sync', value: 'Disabled', disabled: true },
          ],
        },
        {
          id: 'about',
          title: 'About AxionRide',
          subtitle: 'Motorcycle companion foundation',
          items: [
            { id: 'app', label: 'App', value: 'AxionRide' },
            { id: 'mode', label: 'Build mode', value: 'Local demo' },
          ],
        },
      ],
    });
  }
}

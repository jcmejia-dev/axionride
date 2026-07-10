/**
 * Local app unit preferences.
 */
export type SettingsUnits = {
  readonly speed: 'km/h';
  readonly distance: 'km';
};

/**
 * One display row in the settings foundation.
 */
export type SettingsItem = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly action?: 'toggle-local-notifications' | 'request-notification-permission' | 'test-notification';
  readonly disabled?: boolean;
};

/**
 * Grouped settings section for the Profile tab.
 */
export type SettingsSection = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly items: readonly SettingsItem[];
};

/**
 * Local settings read model.
 */
export type SettingsOverview = {
  readonly units: SettingsUnits;
  readonly localNotificationsEnabled: boolean;
  readonly sections: readonly SettingsSection[];
};

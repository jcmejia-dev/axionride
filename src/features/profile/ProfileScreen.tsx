import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, GlassCard, LoadingSpinner } from '@/src/components';
import {
  createNotificationService,
  createProfileService,
  createSettingsService,
  type NotificationPermissionStatus,
  type ProfileOverview,
  type SettingsItem,
  type SettingsOverview,
  type SettingsSection,
} from '@/src/services';
import { layout, palette, radius, spacing, typography } from '@/src/theme';

export function ProfileScreen() {
  const profileService = useMemo(() => createProfileService(), []);
  const settingsService = useMemo(() => createSettingsService(), []);
  const notificationService = useMemo(() => createNotificationService(), []);
  const [profileOverview, setProfileOverview] = useState<ProfileOverview | null>(null);
  const [settingsOverview, setSettingsOverview] = useState<SettingsOverview | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const [profileResult, settingsResult] = await Promise.all([
        profileService.getProfileOverview(),
        Promise.resolve(settingsService.getSettingsOverview()),
      ]);
      const permissionResult = await notificationService.getPermissionStatus();

      if (!active) {
        return;
      }

      if (profileResult.ok) {
        setProfileOverview(profileResult.value);
      }

      if (settingsResult.ok) {
        setSettingsOverview(settingsResult.value);
      }

      if (permissionResult.ok) {
        setNotificationPermission(permissionResult.value);
      }

      setLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [notificationService, profileService, settingsService]);

  async function handleToggleLocalNotifications() {
    if (!settingsOverview) {
      return;
    }

    const result = settingsService.setLocalNotificationsEnabled(!settingsOverview.localNotificationsEnabled);

    if (!result.ok) {
      Alert.alert('Notification setting unavailable', result.error.message);
      return;
    }

    if (!result.value) {
      await notificationService.cancelAllNotifications();
    }

    const overviewResult = settingsService.getSettingsOverview();

    if (overviewResult.ok) {
      setSettingsOverview(overviewResult.value);
    }
  }

  async function handleRequestNotificationPermission() {
    const result = await notificationService.requestPermission();

    if (!result.ok) {
      Alert.alert('Notification permission unavailable', result.error.message);
      return;
    }

    setNotificationPermission(result.value);

    if (!result.value.granted) {
      Alert.alert('Notifications not enabled', 'Local reminders will stay quiet until notification permission is granted.');
    }
  }

  async function handleSendTestNotification() {
    const permissionResult = await notificationService.requestPermission();

    if (!permissionResult.ok) {
      Alert.alert('Test notification unavailable', permissionResult.error.message);
      return;
    }

    setNotificationPermission(permissionResult.value);

    const testResult = await notificationService.showImmediateLocalNotification();

    if (!testResult.ok) {
      Alert.alert('Test notification unavailable', testResult.error.message);
      return;
    }

    if (!testResult.value) {
      Alert.alert('Test notification skipped', 'Enable local notifications and grant permission before sending a test.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Local Rider Profile</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Settings, storage, and rider intelligence.</Text>
        </View>

        {loading ? (
          <LoadingSpinner label="Loading local profile..." />
        ) : profileOverview && settingsOverview ? (
          <>
            <ProfileHero overview={profileOverview} />
            <ProfileStats overview={profileOverview} />
            <SettingsPanel
              notificationPermission={notificationPermission}
              overview={settingsOverview}
              onRequestNotificationPermission={handleRequestNotificationPermission}
              onSendTestNotification={handleSendTestNotification}
              onToggleLocalNotifications={handleToggleLocalNotifications}
            />
          </>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Profile unavailable</Text>
            <Text style={styles.mutedText}>Local profile data could not be loaded.</Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileHero({ overview }: { readonly overview: ProfileOverview }) {
  const motorcycle = overview.statistics.motorcycles.defaultMotorcycle;

  return (
    <GlassCard style={styles.heroCard}>
      <View style={styles.heroGlow} />
      <View style={styles.heroTop}>
        <View style={styles.avatar}>
          <SymbolView
            name={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }}
            tintColor={palette.text}
            size={34}
          />
        </View>
        <Badge variant="neutral">{overview.profile.membershipStatus}</Badge>
      </View>

      <View>
        <Text style={styles.heroName}>{overview.profile.riderName}</Text>
        <Text style={styles.heroSubtitle}>
          {motorcycle ? `${motorcycle.nickname} • ${motorcycle.brand} ${motorcycle.model}` : 'No motorcycle selected yet'}
        </Text>
      </View>

      <View style={styles.notice}>
        <SymbolView
          name={{ ios: 'lock.shield.fill', android: 'lock', web: 'lock' }}
          tintColor="rgba(248, 250, 252, 0.72)"
          size={18}
        />
        <Text style={styles.noticeText}>{overview.profile.notice}</Text>
      </View>
    </GlassCard>
  );
}

function ProfileStats({ overview }: { readonly overview: ProfileOverview }) {
  const statistics = overview.statistics;
  const stats = [
    {
      label: 'Motorcycles',
      value: statistics.motorcycles.hasData ? String(statistics.motorcycles.totalMotorcycles) : 'None',
      detail: statistics.motorcycles.hasData
        ? `${formatNumber(statistics.motorcycles.totalEstimatedMileageKm)} km total`
        : 'Add your first bike',
      accent: 'orange',
    },
    {
      label: 'Rides',
      value: statistics.rides.hasData ? String(statistics.rides.totalRides) : 'No rides',
      detail: statistics.rides.hasData ? `${formatNumber(statistics.rides.totalDistanceKm)} km tracked` : 'Start a ride',
      accent: 'cyan',
    },
    {
      label: 'Ride Time',
      value: statistics.rides.hasData ? formatDuration(statistics.rides.totalRideTimeSeconds) : 'Pending',
      detail: statistics.rides.hasData ? `${formatNumber(statistics.rides.averageSpeedKmh)} km/h avg` : 'No totals yet',
      accent: 'success',
    },
    {
      label: 'Service',
      value: statistics.maintenance.hasData ? String(statistics.maintenance.upcomingCount) : 'None',
      detail: statistics.maintenance.nextScheduledService?.title ?? 'No scheduled service',
      accent: 'warning',
    },
  ] as const;

  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Rider Summary</Text>
        <Text style={styles.sectionSubtitle}>Local stats from your device</Text>
      </View>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: statAccentColors[stat.accent] }]} />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>
              {stat.value}
            </Text>
            <Text numberOfLines={1} style={styles.statDetail}>
              {stat.detail}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type SettingsActions = {
  readonly onRequestNotificationPermission: () => void;
  readonly onSendTestNotification: () => void;
  readonly onToggleLocalNotifications: () => void;
};

function SettingsPanel({
  notificationPermission,
  overview,
  onRequestNotificationPermission,
  onSendTestNotification,
  onToggleLocalNotifications,
}: SettingsActions & {
  readonly notificationPermission: NotificationPermissionStatus | null;
  readonly overview: SettingsOverview;
}) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Text style={styles.sectionSubtitle}>Foundations only. Sync and sign-in are disabled.</Text>
      </View>
      <View style={styles.settingsStack}>
        {overview.sections.map((section) => (
          <SettingsSectionCard
            key={section.id}
            notificationPermission={notificationPermission}
            section={section}
            onRequestNotificationPermission={onRequestNotificationPermission}
            onSendTestNotification={onSendTestNotification}
            onToggleLocalNotifications={onToggleLocalNotifications}
          />
        ))}
      </View>
    </View>
  );
}

function SettingsSectionCard({
  notificationPermission,
  section,
  onRequestNotificationPermission,
  onSendTestNotification,
  onToggleLocalNotifications,
}: SettingsActions & {
  readonly notificationPermission: NotificationPermissionStatus | null;
  readonly section: SettingsSection;
}) {
  return (
    <GlassCard style={styles.settingsCard}>
      <View>
        <Text style={styles.cardTitle}>{section.title}</Text>
        <Text style={styles.mutedText}>{section.subtitle}</Text>
      </View>
      <View style={styles.settingsRows}>
        {section.items.map((item) => {
          const value = getSettingsItemValue(item, notificationPermission);
          const onPress = getSettingsItemAction(item, {
            onRequestNotificationPermission,
            onSendTestNotification,
            onToggleLocalNotifications,
          });
          const disabled = item.disabled || !onPress;

          return (
            <Pressable
              key={item.id}
              accessibilityRole={onPress ? 'button' : undefined}
              disabled={disabled}
              onPress={onPress}
              style={({ pressed }) => [
                styles.settingsRow,
                onPress ? styles.actionRow : null,
                pressed && !disabled ? styles.pressed : null,
              ]}>
              <Text style={[styles.settingsLabel, item.disabled ? styles.disabledText : null]}>{item.label}</Text>
              <Text style={[styles.settingsValue, item.disabled ? styles.disabledText : null]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

function getSettingsItemValue(item: SettingsItem, notificationPermission: NotificationPermissionStatus | null) {
  if (item.id !== 'notification-permission') {
    return item.value;
  }

  if (!notificationPermission) {
    return 'Unknown';
  }

  if (notificationPermission.granted) {
    return 'Granted';
  }

  return notificationPermission.state === 'denied' ? 'Denied' : 'Not requested';
}

function getSettingsItemAction(item: SettingsItem, actions: SettingsActions) {
  switch (item.action) {
    case 'toggle-local-notifications':
      return actions.onToggleLocalNotifications;
    case 'request-notification-permission':
      return actions.onRequestNotificationPermission;
    case 'test-notification':
      return actions.onSendTestNotification;
    case undefined:
      return undefined;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

const statAccentColors = {
  orange: palette.accentOrange,
  cyan: '#E5E7EB',
  success: palette.success,
  warning: palette.warning,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -130,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
  },
  kicker: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.52)',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.display,
    color: palette.text,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(248, 250, 252, 0.64)',
    fontWeight: '600',
  },
  heroCard: {
    gap: spacing.xl,
    overflow: 'hidden',
    backgroundColor: '#08090B',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.42,
    shadowRadius: 34,
    elevation: 10,
  },
  heroGlow: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroName: {
    ...typography.heading,
    color: palette.text,
  },
  heroSubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.66)',
    fontWeight: '700',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  noticeText: {
    ...typography.caption,
    flex: 1,
    color: 'rgba(248, 250, 252, 0.66)',
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 122,
    minWidth: 0,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.26,
    shadowRadius: 22,
    elevation: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    marginBottom: spacing.lg,
    borderRadius: 4,
  },
  statLabel: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.56)',
    textTransform: 'uppercase',
  },
  statValue: {
    ...typography.subheading,
    marginTop: spacing.sm,
    color: palette.text,
    fontSize: 24,
    lineHeight: 29,
  },
  statDetail: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
  settingsStack: {
    gap: spacing.md,
  },
  settingsCard: {
    gap: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
  },
  card: {
    gap: spacing.lg,
  },
  cardTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  mutedText: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
  settingsRows: {
    gap: spacing.sm,
  },
  settingsRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionRow: {
    minHeight: 48,
  },
  settingsLabel: {
    ...typography.body,
    flex: 1,
    color: palette.text,
    fontWeight: '700',
  },
  settingsValue: {
    ...typography.caption,
    maxWidth: '46%',
    color: 'rgba(248, 250, 252, 0.62)',
    textAlign: 'right',
    fontWeight: '700',
  },
  disabledText: {
    color: 'rgba(248, 250, 252, 0.36)',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});

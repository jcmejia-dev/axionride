import { SymbolView } from 'expo-symbols';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput, GlassCard, LoadingSpinner, Toast } from '@/src/components';
import {
  createBackupService,
  createNotificationService,
  createProfileService,
  createSettingsService,
  type BackupExportResult,
  type BackupImportSummary,
  type BackupImportConfirmation,
  type NotificationPermissionStatus,
  type ProfileOverview,
  type SettingsItem,
  type SettingsOverview,
  type SettingsSection,
} from '@/src/services';
import { layout, palette, radius, spacing, typography } from '@/src/theme';
import { useAuth } from '@/src/providers';

export function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const profileService = useMemo(() => createProfileService(), []);
  const settingsService = useMemo(() => createSettingsService(), []);
  const notificationService = useMemo(() => createNotificationService(), []);
  const backupService = useMemo(() => createBackupService(), []);
  const [profileOverview, setProfileOverview] = useState<ProfileOverview | null>(null);
  const [settingsOverview, setSettingsOverview] = useState<SettingsOverview | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileRefreshKey,setProfileRefreshKey]=useState(0);
  const profileFocusedOnce=useRef(false);
  useFocusEffect(useCallback(()=>{if(profileFocusedOnce.current)setProfileRefreshKey((key)=>key+1);else profileFocusedOnce.current=true;},[]));

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const [profileResult, settingsResult] = await Promise.all([
        profileService.getProfileOverview({
          email: user?.email ?? '',
          displayName: typeof user?.user_metadata.display_name === 'string' ? user.user_metadata.display_name : undefined,
        }),
        settingsService.getSettingsOverviewAsync(),
      ]);
      const permissionResult = await notificationService.getPermissionStatus();

      if (!active) {
        return;
      }

      if (profileResult.ok) {
        setProfileOverview(profileResult.value);
        setNickname(profileResult.value.profile.riderName);
        setProfileImageUri(profileResult.value.profile.imageUri);
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
  }, [notificationService, profileRefreshKey, profileService, settingsService, user]);

  function handleLogout() {
    Alert.alert('Sign out?', 'Your local records stay on this device and will be isolated from the next account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { setLogoutMessage('Signing out securely…'); void logout().then((result) => { if (!result.ok) { setLogoutMessage(result.error.message); } }); } },
    ]);
  }

  async function handleChooseProfileImage() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 8 * 1024 * 1024) {
      Alert.alert('Image too large', 'Choose a profile image smaller than 8 MB.');
      return;
    }
    const extension = asset.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
    const destination = new File(Paths.document, `profile-${user?.id ?? 'local'}.${extension}`);
    await new File(asset.uri).copy(destination, { overwrite: true });
    setProfileImageUri(destination.uri);
  }

  async function handleSaveProfile() {
    setProfileSaving(true);
    const result = await profileService.updateLocalProfile({ nickname, imageUri: profileImageUri });
    setProfileSaving(false);
    if (!result.ok) {
      Alert.alert('Profile not saved', result.error.message);
      return;
    }
    if (profileOverview) {
      setProfileOverview({ ...profileOverview, profile: { ...profileOverview.profile, riderName: nickname.trim(), imageUri: profileImageUri } });
    }
    setEditingProfile(false);
  }

  async function handleToggleLocalNotifications() {
    if (!settingsOverview) {
      return;
    }

    const enabling=!settingsOverview.localNotificationsEnabled;
    if(enabling){const permission=await notificationService.requestPermission();setNotificationPermission(permission.ok?permission.value:null);if(!permission.ok||!permission.value.granted){Alert.alert('Permission required','Enable notifications in system settings to receive maintenance reminders.');return;}}
    const result = await settingsService.updateMaintenanceReminderSettings({enabled:enabling});

    if (!result.ok) {
      Alert.alert('Notification setting unavailable', result.error.message);
      return;
    }

    await notificationService.reconcileMaintenanceReminders();

    const overviewResult = await settingsService.getSettingsOverviewAsync();

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
      Alert.alert(
        'Notifications not enabled',
        result.value.message ?? 'Local reminders will stay quiet until notification permission is granted.',
        result.value.canAskAgain ? [{ text: 'OK' }] : [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open settings', onPress: () => { void Linking.openSettings(); } },
        ],
      );
    }
  }

  function chooseReminderThreshold(kind: 'distance' | 'date') {
    const values = kind === 'distance' ? [250, 500, 1000] : [3, 7, 14];
    const unit = kind === 'distance' ? 'km' : 'days';
    Alert.alert(`Due-soon ${kind}`, 'Choose when AxionRide should consider maintenance due soon.', [
      ...values.map((value) => ({
        text: `${value} ${unit}`,
        onPress: () => {
          void settingsService.updateMaintenanceReminderSettings(
            kind === 'distance' ? { dueSoonKm: value } : { dueSoonDays: value },
          ).then(async (result) => {
            if (!result.ok) {
              Alert.alert('Setting not saved', result.error.message);
              return;
            }
            await notificationService.reconcileMaintenanceReminders();
            const overview = await settingsService.getSettingsOverviewAsync();
            if (overview.ok) setSettingsOverview(overview.value);
          });
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSendTestNotification() {
    const permissionResult = await notificationService.requestPermission();

    if (!permissionResult.ok) {
      Alert.alert('Test notification unavailable', permissionResult.error.message);
      return;
    }

    setNotificationPermission(permissionResult.value);

    if (permissionResult.value.state === 'unavailable') {
      Alert.alert(
        'Test notification unavailable',
        permissionResult.value.message ?? 'Notification testing requires a development build.',
      );
      return;
    }

    const testResult = await notificationService.showImmediateLocalNotification();

    if (!testResult.ok) {
      Alert.alert('Test notification unavailable', testResult.error.message);
      return;
    }

    if (!testResult.value) {
      Alert.alert('Test notification skipped', 'Enable local notifications and grant permission before sending a test.');
    }
  }

  async function handleExportBackup() {
    setBackupBusy(true);
    const result = await backupService.exportBackup();
    setBackupBusy(false);

    if (!result.ok) {
      setLastBackupResult(result.error.message);
      Alert.alert('Export failed', result.error.message);
      return;
    }

    const message = formatExportResult(result.value);
    setLastBackupResult(message);
    Alert.alert('Backup exported', message);
  }

  async function handleImportBackup() {
    setBackupBusy(true);
    const result = await backupService.importBackup({
      confirmReplacement: confirmBackupReplacement,
    });
    setBackupBusy(false);

    if (!result.ok) {
      setLastBackupResult(result.error.message);
      Alert.alert('Import failed', result.error.message);
      return;
    }

    const message = formatImportResult(result.value);
    setLastBackupResult(message);

    if (result.value.status === 'cancelled') {
      Alert.alert('Import cancelled', message);
      return;
    }

    Alert.alert('Backup imported', message);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} tintColor={palette.accentOrange} colors={[palette.accentOrange]} onRefresh={() => { setLoading(true); setProfileRefreshKey((key)=>key+1); }}/>} style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}><View style={styles.headerRow}><View style={styles.headerAccent}/><View><Text style={styles.title}>Profile</Text><Text style={styles.subtitle}>Your account &amp; preferences</Text></View></View></View>

        {loading ? (
          <LoadingSpinner label="Loading local profile..." />
        ) : profileOverview && settingsOverview ? (
          <>
            <ProfileHero overview={profileOverview} onEdit={() => setEditingProfile(true)} />
            <ProfileStats overview={profileOverview} />
            <MotorcyclePanel overview={profileOverview} onAdd={() => router.push('/motorcycle-management')} onViewAll={() => router.push('/garage')} />
            <SettingsPanel
              backupBusy={backupBusy}
              lastBackupResult={lastBackupResult}
              notificationPermission={notificationPermission}
              overview={settingsOverview}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onRequestNotificationPermission={handleRequestNotificationPermission}
              onSendTestNotification={handleSendTestNotification}
              onSetMaintenanceDateThreshold={() => chooseReminderThreshold('date')}
              onSetMaintenanceDistanceThreshold={() => chooseReminderThreshold('distance')}
              onToggleLocalNotifications={handleToggleLocalNotifications}
              onSignOut={handleLogout}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Log out of AxionRide" onPress={handleLogout} style={({pressed})=>[styles.logoutCard,pressed&&styles.pressed]}><View style={styles.logoutIcon}><SymbolView name={{ios:'rectangle.portrait.and.arrow.right',android:'logout',web:'logout'}} tintColor={palette.danger} size={23}/></View><View style={styles.logoutCopy}><Text style={styles.logoutTitle}>Log Out</Text><Text style={styles.logoutSubtitle}>Sign out from your account</Text></View><SymbolView name={{ios:'chevron.right',android:'chevron_right',web:'chevron_right'}} tintColor={palette.textMuted} size={22}/></Pressable>
          </>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Profile unavailable</Text>
            <Text style={styles.mutedText}>Local profile data could not be loaded.</Text>
          </GlassCard>
        )}
      </ScrollView>
      <Toast visible={Boolean(logoutMessage)} message={logoutMessage ?? ''} variant="info" onHide={() => setLogoutMessage(null)} />
      <ProfileEditModal
        imageUri={profileImageUri}
        nickname={nickname}
        saving={profileSaving}
        visible={editingProfile}
        onCancel={() => setEditingProfile(false)}
        onChangeNickname={setNickname}
        onChooseImage={() => void handleChooseProfileImage()}
        onRemoveImage={() => setProfileImageUri(null)}
        onSave={() => void handleSaveProfile()}
      />
    </SafeAreaView>
  );
}

function ProfileHero({ overview, onEdit }: { readonly overview: ProfileOverview; readonly onEdit: () => void }) {
  const motorcycle = overview.statistics.motorcycles.defaultMotorcycle;
  return (
    <View style={styles.heroCard}>
      <View style={styles.avatar}>{overview.profile.imageUri ? <Image source={{ uri: overview.profile.imageUri }} style={styles.avatarImage} /> : <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }} tintColor={palette.text} size={50} />}</View>

      <View style={styles.heroCopy}>
        <Text style={styles.heroName}>{overview.profile.riderName}</Text>
        <Text style={styles.rideMotto}>Ride safe. Ride smart.</Text>
        <View style={styles.riderBadge}><SymbolView name={{ios:'shield.fill',android:'shield',web:'shield'}} tintColor={palette.accentOrange} size={13}/><Text style={styles.riderBadgeText}>AXION RIDER</Text></View>
        <Text style={styles.heroSubtitle}>
          {motorcycle ? `${overview.profile.email} • ${motorcycle.nickname}` : overview.profile.email}
        </Text>
      </View>

      <Pressable accessibilityLabel="Edit rider profile" accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.editProfileButton, pressed && styles.pressed]}>
        <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} tintColor={palette.text} size={18} />
      </Pressable>

      <View style={styles.notice}>
        <SymbolView
          name={{ ios: 'lock.shield.fill', android: 'lock', web: 'lock' }}
          tintColor="rgba(248, 250, 252, 0.72)"
          size={18}
        />
        <Text style={styles.noticeText}>{overview.profile.notice}</Text>
      </View>
    </View>
  );
}

function ProfileEditModal({ imageUri, nickname, saving, visible, onCancel, onChangeNickname, onChooseImage, onRemoveImage, onSave }: { readonly imageUri: string | null; readonly nickname: string; readonly saving: boolean; readonly visible: boolean; readonly onCancel: () => void; readonly onChangeNickname: (value: string) => void; readonly onChooseImage: () => void; readonly onRemoveImage: () => void; readonly onSave: () => void }) {
  return <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}><View style={styles.modalOverlay}><Pressable style={StyleSheet.absoluteFill} onPress={onCancel}/><View style={styles.editSheet}><View style={styles.editHeader}><View><Text style={styles.kicker}>Rider identity</Text><Text style={styles.sectionTitle}>Edit profile</Text></View><Pressable accessibilityLabel="Close profile editor" accessibilityRole="button" onPress={onCancel} style={styles.closeEdit}><SymbolView name={{ios:'xmark',android:'close',web:'close'}} tintColor={palette.text} size={18}/></Pressable></View><View style={styles.photoEditor}><View style={styles.avatarLarge}>{imageUri?<Image source={{uri:imageUri}} style={styles.avatarImage}/>:<SymbolView name={{ios:'person.crop.circle.fill',android:'person',web:'person'}} tintColor={palette.text} size={58}/>}</View><View style={styles.photoActions}><Pressable accessibilityRole="button" onPress={onChooseImage} style={({pressed})=>[styles.photoButton,pressed&&styles.pressed]}><Text style={styles.photoButtonText}>{imageUri?'Change photo':'Add photo'}</Text></Pressable>{imageUri?<Pressable accessibilityRole="button" onPress={onRemoveImage}><Text style={styles.removePhoto}>Remove</Text></Pressable>:null}</View></View><AppTextInput label="Nickname" maxLength={32} value={nickname} onChangeText={onChangeNickname} placeholder="How riders know you"/><View style={styles.editActions}><Pressable accessibilityRole="button" onPress={onCancel} style={({pressed})=>[styles.cancelButton,pressed&&styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable accessibilityRole="button" disabled={saving} onPress={onSave} style={({pressed})=>[styles.saveButton,pressed&&styles.pressed,saving&&styles.disabledButton]}><Text style={styles.saveText}>{saving?'Saving...':'Save profile'}</Text></Pressable></View></View></View></Modal>;
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

function MotorcyclePanel({overview,onAdd,onViewAll}:{readonly overview:ProfileOverview;readonly onAdd:()=>void;readonly onViewAll:()=>void}) {
  const motorcycle=overview.statistics.motorcycles.defaultMotorcycle;
  return <GlassCard style={styles.motorcyclePanel}><View style={styles.panelHeader}><Text style={styles.panelTitle}>My Motorcycles</Text><Pressable accessibilityRole="button" onPress={onViewAll} hitSlop={12}><Text style={styles.viewAll}>View all</Text></Pressable></View>{motorcycle?<Pressable accessibilityRole="button" onPress={onViewAll} style={({pressed})=>[styles.motorcycleRow,pressed&&styles.pressed]}><View style={styles.bikeImageShell}><Image resizeMode="contain" source={motorcycle.imageUri?{uri:motorcycle.imageUri}:require('../../../assets/images/dashboard-motorcycle-fallback.png')} style={styles.bikeImage}/></View><View style={styles.bikeCopy}><Text numberOfLines={1} style={styles.bikeName}>{motorcycle.nickname}</Text><Text numberOfLines={1} style={styles.bikeSpec}>{motorcycle.engineCc}cc · {motorcycle.brand} {motorcycle.model}</Text><Text style={styles.ready}>●  Ready to ride</Text></View><SymbolView name={{ios:'chevron.right',android:'chevron_right',web:'chevron_right'}} tintColor={palette.textMuted} size={22}/></Pressable>:<Text style={styles.emptyBike}>No motorcycle added yet.</Text>}<Pressable accessibilityRole="button" onPress={onAdd} style={({pressed})=>[styles.addBike,pressed&&styles.pressed]}><SymbolView name={{ios:'plus',android:'add',web:'add'}} tintColor={palette.accentOrange} size={26}/><View><Text style={styles.addBikeTitle}>Add Motorcycle</Text><Text style={styles.addBikeCopy}>Track and manage another motorcycle</Text></View></Pressable></GlassCard>
}

type SettingsActions = {
  readonly onExportBackup: () => void;
  readonly onImportBackup: () => void;
  readonly onRequestNotificationPermission: () => void;
  readonly onSendTestNotification: () => void;
  readonly onSetMaintenanceDateThreshold: () => void;
  readonly onSetMaintenanceDistanceThreshold: () => void;
  readonly onToggleLocalNotifications: () => void;
  readonly onSignOut: () => void;
};

function SettingsPanel({
  backupBusy,
  lastBackupResult,
  notificationPermission,
  overview,
  onExportBackup,
  onImportBackup,
  onRequestNotificationPermission,
  onSendTestNotification,
  onSetMaintenanceDateThreshold,
  onSetMaintenanceDistanceThreshold,
  onToggleLocalNotifications,
  onSignOut,
}: SettingsActions & {
  readonly backupBusy: boolean;
  readonly lastBackupResult: string | null;
  readonly notificationPermission: NotificationPermissionStatus | null;
  readonly overview: SettingsOverview;
}) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Text style={styles.sectionSubtitle}>Authenticated account with offline-first local data.</Text>
      </View>
      <View style={styles.settingsStack}>
        {overview.sections.map((section) => (
          <SettingsSectionCard
            key={section.id}
            backupBusy={backupBusy}
            lastBackupResult={lastBackupResult}
            notificationPermission={notificationPermission}
            section={section}
            onExportBackup={onExportBackup}
            onImportBackup={onImportBackup}
            onRequestNotificationPermission={onRequestNotificationPermission}
            onSendTestNotification={onSendTestNotification}
            onSetMaintenanceDateThreshold={onSetMaintenanceDateThreshold}
            onSetMaintenanceDistanceThreshold={onSetMaintenanceDistanceThreshold}
            onToggleLocalNotifications={onToggleLocalNotifications}
            onSignOut={onSignOut}
          />
        ))}
      </View>
    </View>
  );
}

function SettingsSectionCard({
  backupBusy,
  lastBackupResult,
  notificationPermission,
  section,
  onExportBackup,
  onImportBackup,
  onRequestNotificationPermission,
  onSendTestNotification,
  onSetMaintenanceDateThreshold,
  onSetMaintenanceDistanceThreshold,
  onToggleLocalNotifications,
  onSignOut,
}: SettingsActions & {
  readonly backupBusy: boolean;
  readonly lastBackupResult: string | null;
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
        {section.items.filter((item) => item.action !== 'sign-out').map((item) => {
          const value = getSettingsItemValue(item, notificationPermission);
          const onPress = getSettingsItemAction(item, {
            onRequestNotificationPermission,
            onExportBackup,
            onImportBackup,
            onSendTestNotification,
            onSetMaintenanceDateThreshold,
            onSetMaintenanceDistanceThreshold,
            onToggleLocalNotifications,
            onSignOut,
          });
          const disabled = item.disabled || !onPress || (backupBusy && isBackupAction(item));

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
              <Text style={[styles.settingsValue, disabled ? styles.disabledText : null]}>{backupBusy && isBackupAction(item) ? 'Working...' : value}</Text>
            </Pressable>
          );
        })}
      </View>
      {section.id === 'data-storage' ? (
        <View style={styles.backupNotice}>
          <Text style={styles.backupWarning}>Import replaces current local data after confirmation.</Text>
          {lastBackupResult ? <Text style={styles.backupResult}>{lastBackupResult}</Text> : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

function getSettingsItemValue(item: SettingsItem, notificationPermission: NotificationPermissionStatus | null) {
  if (item.id === 'local-notifications' && item.value === 'Enabled' && !notificationPermission?.granted) {
    return notificationPermission?.state === 'denied' && !notificationPermission.canAskAgain
      ? 'Disabled in system settings'
      : 'Permission required';
  }

  if (item.id !== 'notification-permission') {
    return item.value;
  }

  if (!notificationPermission) {
    return 'Unknown';
  }

  if (notificationPermission.granted) {
    return 'Enabled';
  }

  if (notificationPermission.state === 'unavailable') {
    return 'Dev build required';
  }

  if (notificationPermission.state === 'denied' && !notificationPermission.canAskAgain) {
    return 'Disabled in system settings';
  }

  return 'Permission required';
}

function getSettingsItemAction(item: SettingsItem, actions: SettingsActions) {
  switch (item.action) {
    case 'toggle-local-notifications':
      return actions.onToggleLocalNotifications;
    case 'set-maintenance-distance-threshold':
      return actions.onSetMaintenanceDistanceThreshold;
    case 'set-maintenance-date-threshold':
      return actions.onSetMaintenanceDateThreshold;
    case 'export-backup':
      return actions.onExportBackup;
    case 'import-backup':
      return actions.onImportBackup;
    case 'request-notification-permission':
      return actions.onRequestNotificationPermission;
    case 'test-notification':
      return actions.onSendTestNotification;
    case 'sign-out':
      return actions.onSignOut;
    case undefined:
      return undefined;
  }
}

function isBackupAction(item: SettingsItem) {
  return item.action === 'export-backup' || item.action === 'import-backup';
}

function confirmBackupReplacement(confirmation: BackupImportConfirmation) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      'Replace local data?',
      [
        `This backup contains ${confirmation.summary.motorcyclesRestored} motorcycles, ${confirmation.summary.maintenanceRecordsRestored} maintenance records, and ${confirmation.summary.ridesRestored} rides.`,
        'Import will replace current local data on this device.',
      ].join('\n\n'),
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Replace', style: 'destructive', onPress: () => resolve(true) },
      ],
    );
  });
}

function formatExportResult(result: BackupExportResult) {
  return `${result.message} ${result.motorcyclesExported} motorcycles, ${result.maintenanceRecordsExported} maintenance records, and ${result.ridesExported} rides exported.`;
}

function formatImportResult(result: BackupImportSummary) {
  return `${result.message} ${result.motorcyclesRestored} motorcycles, ${result.maintenanceRecordsRestored} maintenance records, and ${result.ridesRestored} rides restored.`;
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerAccent: {
    width: 5,
    height: 34,
    borderRadius: 3,
    backgroundColor: palette.accentOrange,
  },
  kicker: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.52)',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.heading,
    color: palette.text,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(248, 250, 252, 0.64)',
    fontWeight: '600',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
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
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 106, 0, 0.10)',
  },
  avatarImage:{width:'100%',height:'100%',borderRadius:999},
  editProfileButton:{width:42,height:42,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.14)',borderRadius:radius.pill,backgroundColor:'rgba(255,255,255,.07)'},
  heroCopy:{flex:1,minWidth:0},
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
    display: 'none',
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
    padding: 0,
    gap: 0,
    overflow:'hidden',
    backgroundColor:'rgba(17,21,28,.88)',
  },
  rideMotto:{...typography.body,color:palette.textMuted,marginTop:3},
  riderBadge:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,marginTop:8,paddingHorizontal:10,paddingVertical:6,borderWidth:1,borderColor:'rgba(255,106,0,.35)',borderRadius:8,backgroundColor:'rgba(255,106,0,.07)'},
  riderBadgeText:{fontSize:11,fontWeight:'900',letterSpacing:.6,color:palette.accentOrange},
  statCard: {
    flex: 1,
    minHeight: 112,
    minWidth: 0,
    alignItems:'center',
    paddingHorizontal: spacing.xs,
    paddingVertical:spacing.lg,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.26,
    shadowRadius: 22,
    elevation: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    marginBottom: spacing.sm,
    borderRadius: 4,
  },
  statLabel: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.56)',
    textTransform: 'uppercase',
    textAlign:'center',
  },
  statValue: {
    ...typography.subheading,
    marginTop: spacing.sm,
    color: palette.text,
    fontSize: 18,
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
  backupNotice: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  backupWarning: {
    ...typography.caption,
    color: palette.warning,
    fontWeight: '700',
  },
  backupResult: {
    ...typography.caption,
    color: 'rgba(248, 250, 252, 0.62)',
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
  motorcyclePanel:{gap:spacing.md,backgroundColor:'rgba(17,21,28,.88)',borderColor:'rgba(255,255,255,.11)'},
  panelHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},panelTitle:{...typography.subtitle,color:palette.text,fontWeight:'900'},viewAll:{...typography.body,color:palette.accentOrange,fontWeight:'800'},
  motorcycleRow:{minHeight:96,flexDirection:'row',alignItems:'center',gap:spacing.md},bikeImageShell:{width:104,height:78,overflow:'hidden',borderRadius:radius.lg,backgroundColor:'rgba(255,255,255,.04)'},bikeImage:{width:'100%',height:'100%'},bikeCopy:{flex:1,minWidth:0},bikeName:{...typography.subtitle,color:palette.text,fontWeight:'900'},bikeSpec:{...typography.caption,color:palette.textMuted,marginTop:4},ready:{...typography.caption,color:palette.success,marginTop:8,fontWeight:'700'},emptyBike:{...typography.body,color:palette.textMuted},
  addBike:{minHeight:70,flexDirection:'row',alignItems:'center',gap:spacing.lg,paddingHorizontal:spacing.lg,borderWidth:1,borderStyle:'dashed',borderColor:'rgba(255,255,255,.15)',borderRadius:radius.lg},addBikeTitle:{...typography.body,color:palette.text,fontWeight:'800'},addBikeCopy:{...typography.caption,color:palette.textMuted,marginTop:2},
  logoutCard:{minHeight:86,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderWidth:1,borderColor:'rgba(255,255,255,.1)',borderRadius:radius.xl,backgroundColor:'rgba(17,21,28,.88)'},logoutIcon:{width:46,height:46,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'rgba(255,77,79,.1)'},logoutCopy:{flex:1},logoutTitle:{...typography.body,color:palette.text,fontWeight:'900'},logoutSubtitle:{...typography.caption,color:palette.textMuted,marginTop:3},
  modalOverlay:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,.72)'},editSheet:{gap:spacing.xl,padding:spacing.xl,paddingBottom:spacing.xxl,borderTopLeftRadius:radius.xl,borderTopRightRadius:radius.xl,borderWidth:1,borderColor:'rgba(255,255,255,.14)',backgroundColor:'#0B0E13'},editHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},closeEdit:{width:42,height:42,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,backgroundColor:'rgba(255,255,255,.08)'},photoEditor:{flexDirection:'row',alignItems:'center',gap:spacing.lg},avatarLarge:{width:96,height:96,overflow:'hidden',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'rgba(249,115,22,.7)',borderRadius:48,backgroundColor:'rgba(255,255,255,.07)'},photoActions:{gap:spacing.md},photoButton:{minHeight:44,justifyContent:'center',paddingHorizontal:spacing.lg,borderRadius:radius.lg,backgroundColor:'rgba(249,115,22,.13)'},photoButtonText:{...typography.body,color:palette.accentOrange,fontWeight:'800'},removePhoto:{...typography.caption,color:palette.danger,fontWeight:'700'},editActions:{flexDirection:'row',gap:spacing.md},cancelButton:{flex:1,minHeight:50,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.13)',borderRadius:radius.lg},cancelText:{...typography.body,color:palette.text,fontWeight:'800'},saveButton:{flex:1,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:radius.lg,backgroundColor:palette.accentOrange},saveText:{...typography.body,color:'#0A0B0E',fontWeight:'900'},disabledButton:{opacity:.55},
});

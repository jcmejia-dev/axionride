import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppTextInput,
  GlassCard,
  LoadingSpinner,
  Toast,
} from "@/src/components";
import type { RiderAchievementId } from "@/src/domain/rider-progress";
import { useAuth } from "@/src/providers";
import {
  BackupService,
  NotificationService,
  ProfileService,
  SettingsService,
  createServiceContext,
  subscribeToRiderProgressRewards,
  type BackupExportResult,
  type BackupImportConfirmation,
  type BackupImportSummary,
  type NotificationPermissionStatus,
  type ProfileOverview,
  type SettingsItem,
  type SettingsOverview,
  type SettingsSection,
} from "@/src/services";
import { layout, palette, radius, spacing, typography } from "@/src/theme";

import {
  AchievementUnlockOverlay,
  type UnlockEvent,
} from "./components/AchievementUnlockOverlay";
import {
  ACHIEVEMENT_ICONS,
  AchievementsGrid,
} from "./components/AchievementsGrid";
import { ProfileHeader as PlayerProfileHeader } from "./components/ProfileHeader";
import { StatsSummary } from "./components/StatsSummary";
import { useProfileData } from "./hooks/useProfileData";

export function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const serviceContext = useMemo(() => createServiceContext(), []);
  const profileService = useMemo(
    () => new ProfileService(serviceContext),
    [serviceContext],
  );
  const settingsService = useMemo(
    () => new SettingsService(serviceContext),
    [serviceContext],
  );
  const notificationService = useMemo(
    () => new NotificationService(serviceContext),
    [serviceContext],
  );
  const backupService = useMemo(
    () => new BackupService(serviceContext),
    [serviceContext],
  );
  const [profileOverview, setProfileOverview] =
    useState<ProfileOverview | null>(null);
  const [settingsOverview, setSettingsOverview] =
    useState<SettingsOverview | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionStatus | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nickname, setNickname] = useState("");
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [unlockEvent, setUnlockEvent] = useState<UnlockEvent | null>(null);
  const profileFocusedOnce = useRef(false);

  const playerProfile = useProfileData(
    serviceContext,
    profileOverview?.profile.riderName ?? nickname,
    profileRefreshKey,
  );

  // Subscribe to reward events for achievement unlock overlay
  useEffect(() => {
    const unsub = subscribeToRiderProgressRewards((reward) => {
      if (reward.kind !== "achievement") return;
      // Extract achievement id from reward id format "achievement:{id}:{timestamp}"
      const achievementId = reward.id.split(":")[1] as RiderAchievementId;
      const icon = ACHIEVEMENT_ICONS[achievementId];
      if (icon) {
        setUnlockEvent({ id: reward.id, title: reward.message, icon });
      }
    });
    return unsub;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (profileFocusedOnce.current) {
        setProfileRefreshKey((key) => key + 1);
      } else {
        profileFocusedOnce.current = true;
      }
    }, []),
  );

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setProfileLoadError(null);
      try {
        const [profileResult, settingsResult] = await withTimeout(
          Promise.all([
            profileService.getProfileOverview({
              email: user?.email ?? "",
              displayName:
                typeof user?.user_metadata.display_name === "string"
                  ? user.user_metadata.display_name
                  : undefined,
            }),
            Promise.resolve(settingsService.getSettingsOverview()),
          ]),
          10_000,
          "Local profile loading timed out.",
        );

        if (!active) return;
        if (!profileResult.ok) {
          setProfileLoadError(profileResult.error.message);
        } else {
          setProfileOverview(profileResult.value);
          setNickname(profileResult.value.profile.riderName);
          setProfileImageUri(profileResult.value.profile.imageUri);
        }

        if (!settingsResult.ok) {
          setProfileLoadError(settingsResult.error.message);
        } else {
          setSettingsOverview(settingsResult.value);
        }
      } catch (cause) {
        if (active) {
          setProfileLoadError(
            cause instanceof Error
              ? cause.message
              : "Local profile data could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }

      // Notification APIs are optional device integrations and must never
      // block the local profile from rendering.
      void notificationService
        .getPermissionStatus()
        .then((permissionResult) => {
          if (active && permissionResult.ok) {
            setNotificationPermission(permissionResult.value);
          }
        })
        .catch(() => undefined);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [
    notificationService,
    profileRefreshKey,
    profileService,
    settingsService,
    user,
  ]);

  function handleLogout() {
    Alert.alert(
      "Sign out?",
      "Your local records stay on this device and will be isolated from the next account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            setLogoutMessage("Signing out securely…");
            void logout().then((result) => {
              if (!result.ok) {
                setLogoutMessage(result.error.message);
              }
            });
          },
        },
      ],
    );
  }

  async function handleChooseProfileImage() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 8 * 1024 * 1024) {
      Alert.alert(
        "Image too large",
        "Choose a profile image smaller than 8 MB.",
      );
      return;
    }
    const extension =
      asset.name
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase() || "jpg";
    const destination = new File(
      Paths.document,
      `profile-${user?.id ?? "local"}.${extension}`,
    );
    await new File(asset.uri).copy(destination, { overwrite: true });
    setProfileImageUri(destination.uri);
  }

  async function handleSaveProfile() {
    setProfileSaving(true);
    const result = await profileService.updateLocalProfile({
      nickname,
      imageUri: profileImageUri,
    });
    setProfileSaving(false);
    if (!result.ok) {
      Alert.alert("Profile not saved", result.error.message);
      return;
    }
    if (profileOverview) {
      setProfileOverview({
        ...profileOverview,
        profile: {
          ...profileOverview.profile,
          riderName: nickname.trim(),
          imageUri: profileImageUri,
        },
      });
    }
    setEditingProfile(false);
  }

  async function handleToggleLocalNotifications() {
    if (!settingsOverview) {
      return;
    }

    const result = settingsService.setLocalNotificationsEnabled(
      !settingsOverview.localNotificationsEnabled,
    );

    if (!result.ok) {
      Alert.alert("Notification setting unavailable", result.error.message);
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
      Alert.alert("Notification permission unavailable", result.error.message);
      return;
    }

    setNotificationPermission(result.value);

    if (!result.value.granted) {
      Alert.alert(
        "Notifications not enabled",
        result.value.message ??
          "Local reminders will stay quiet until notification permission is granted.",
      );
    }
  }

  async function handleSendTestNotification() {
    const permissionResult = await notificationService.requestPermission();

    if (!permissionResult.ok) {
      Alert.alert(
        "Test notification unavailable",
        permissionResult.error.message,
      );
      return;
    }

    setNotificationPermission(permissionResult.value);

    if (permissionResult.value.state === "unavailable") {
      Alert.alert(
        "Test notification unavailable",
        permissionResult.value.message ??
          "Notification testing requires a development build.",
      );
      return;
    }

    const testResult =
      await notificationService.showImmediateLocalNotification();

    if (!testResult.ok) {
      Alert.alert("Test notification unavailable", testResult.error.message);
      return;
    }

    if (!testResult.value) {
      Alert.alert(
        "Test notification skipped",
        "Enable local notifications and grant permission before sending a test.",
      );
    }
  }

  async function handleExportBackup() {
    setBackupBusy(true);
    const result = await backupService.exportBackup();
    setBackupBusy(false);

    if (!result.ok) {
      setLastBackupResult(result.error.message);
      Alert.alert("Export failed", result.error.message);
      return;
    }

    const message = formatExportResult(result.value);
    setLastBackupResult(message);
    Alert.alert("Backup exported", message);
  }

  async function handleImportBackup() {
    setBackupBusy(true);
    const result = await backupService.importBackup({
      confirmReplacement: confirmBackupReplacement,
    });
    setBackupBusy(false);

    if (!result.ok) {
      setLastBackupResult(result.error.message);
      Alert.alert("Import failed", result.error.message);
      return;
    }

    const message = formatImportResult(result.value);
    setLastBackupResult(message);

    if (result.value.status === "cancelled") {
      Alert.alert("Import cancelled", message);
      return;
    }

    Alert.alert("Backup imported", message);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            tintColor={palette.accentOrange}
            colors={[palette.accentOrange]}
            onRefresh={() => {
              setLoading(true);
              setProfileRefreshKey((key) => key + 1);
            }}
          />
        }
        style={styles.screen}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerAccent} />
            <View>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>
                Your rider identity & progress
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <LoadingSpinner label="Loading local profile..." />
        ) : profileOverview && settingsOverview ? (
          <>
            <ProfileHero
              overview={profileOverview}
              onEdit={() => setEditingProfile(true)}
              level={playerProfile.snapshot?.progress.level ?? 1}
              xp={playerProfile.snapshot?.progress.xp ?? 0}
              xpToNext={playerProfile.levelProgress?.next ?? 1000}
            />

            {playerProfile.snapshot ? (
              <PlayerProfileHeader
                riderName={profileOverview.profile.riderName}
                level={playerProfile.snapshot.progress.level}
                xp={playerProfile.snapshot.progress.xp}
                streakCount={playerProfile.snapshot.streak.streakCount}
              />
            ) : null}

            <StatsSummary metrics={playerProfile.metrics} />

            {playerProfile.snapshot ? (
              <AchievementsGrid
                achievements={playerProfile.snapshot.achievements}
              />
            ) : null}

            <ProfileStats overview={profileOverview} />
            <MotorcyclePanel
              overview={profileOverview}
              onAdd={() => router.push("/motorcycle-management")}
              onViewAll={() => router.push("/garage")}
            />
            <SettingsPanel
              backupBusy={backupBusy}
              lastBackupResult={lastBackupResult}
              notificationPermission={notificationPermission}
              overview={settingsOverview}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onRequestNotificationPermission={
                handleRequestNotificationPermission
              }
              onSendTestNotification={handleSendTestNotification}
              onToggleLocalNotifications={handleToggleLocalNotifications}
              onSignOut={handleLogout}
            />
            <LogoutButton onLogout={handleLogout} />
          </>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Profile unavailable</Text>
            <Text style={styles.mutedText}>
              {profileLoadError ?? "Local profile data could not be loaded."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setLoading(true);
                setProfileRefreshKey((key) => key + 1);
              }}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Retry profile</Text>
            </Pressable>
          </GlassCard>
        )}
      </ScrollView>
      <Toast
        visible={Boolean(logoutMessage)}
        message={logoutMessage ?? ""}
        variant="info"
        onHide={() => setLogoutMessage(null)}
      />
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
      <AchievementUnlockOverlay
        event={unlockEvent}
        onComplete={() => setUnlockEvent(null)}
      />
    </SafeAreaView>
  );
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function LogoutButton({ onLogout }: { readonly onLogout: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Log out of AxionRide"
      onPress={onLogout}
      style={({ pressed }) => [styles.logoutCard, pressed && styles.pressed]}
    >
      <View style={styles.logoutIcon}>
        <SymbolView
          name={{
            ios: "rectangle.portrait.and.arrow.right",
            android: "logout",
            web: "logout",
          }}
          tintColor={palette.danger}
          size={23}
        />
      </View>
      <View style={styles.logoutCopy}>
        <Text style={styles.logoutTitle}>Log Out</Text>
        <Text style={styles.logoutSubtitle}>Sign out from your account</Text>
      </View>
      <SymbolView
        name={{
          ios: "chevron.right",
          android: "chevron_right",
          web: "chevron_right",
        }}
        tintColor={palette.textMuted}
        size={22}
      />
    </Pressable>
  );
}

function ProfileHero({
  overview,
  onEdit,
  level,
  xp,
  xpToNext,
}: {
  readonly overview: ProfileOverview;
  readonly onEdit: () => void;
  readonly level: number;
  readonly xp: number;
  readonly xpToNext: number;
}) {
  const motorcycle = overview.statistics.motorcycles.defaultMotorcycle;

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatar}>
            {overview.profile.imageUri ? (
              <Image
                source={{ uri: overview.profile.imageUri }}
                style={styles.avatarImage}
              />
            ) : (
              <SymbolView
                name={{
                  ios: "person.crop.circle.fill",
                  android: "person",
                  web: "person",
                }}
                tintColor={palette.text}
                size={50}
              />
            )}
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLabel}>LEVEL</Text>
            <Text style={styles.levelValue}>{level}</Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroName}>{overview.profile.riderName}</Text>
          <Text style={styles.rideMotto}>Ride safe. Ride smart.</Text>
          <View style={styles.riderBadge}>
            <SymbolView
              name={{ ios: "shield.fill", android: "shield", web: "shield" }}
              tintColor={palette.accentOrange}
              size={13}
            />
            <Text style={styles.riderBadgeText}>AXION RIDER</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            {motorcycle
              ? `${overview.profile.email} • ${motorcycle.nickname}`
              : overview.profile.email}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Edit rider profile"
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [
            styles.editProfileButton,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "pencil", android: "edit", web: "edit" }}
            tintColor={palette.accentOrange}
            size={18}
          />
        </Pressable>
      </View>

      <View style={styles.xpSection}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpCurrent}>{xp.toLocaleString()} XP</Text>
          <Text style={styles.xpTarget}>
            to next level {xpToNext.toLocaleString()} XP
          </Text>
        </View>
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBar}>
            <View
              style={[
                styles.xpFill,
                { width: `${Math.min((xp / xpToNext) * 100, 100)}%` },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function ProfileEditModal({
  imageUri,
  nickname,
  saving,
  visible,
  onCancel,
  onChangeNickname,
  onChooseImage,
  onRemoveImage,
  onSave,
}: {
  readonly imageUri: string | null;
  readonly nickname: string;
  readonly saving: boolean;
  readonly visible: boolean;
  readonly onCancel: () => void;
  readonly onChangeNickname: (value: string) => void;
  readonly onChooseImage: () => void;
  readonly onRemoveImage: () => void;
  readonly onSave: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.editSheet}>
          <View style={styles.editHeader}>
            <View>
              <Text style={styles.kicker}>Rider identity</Text>
              <Text style={styles.sectionTitle}>Edit profile</Text>
            </View>
            <Pressable
              accessibilityLabel="Close profile editor"
              accessibilityRole="button"
              onPress={onCancel}
              style={styles.closeEdit}
            >
              <SymbolView
                name={{ ios: "xmark", android: "close", web: "close" }}
                tintColor={palette.text}
                size={18}
              />
            </Pressable>
          </View>
          <View style={styles.photoEditor}>
            <View style={styles.avatarLarge}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <SymbolView
                  name={{
                    ios: "person.crop.circle.fill",
                    android: "person",
                    web: "person",
                  }}
                  tintColor={palette.text}
                  size={58}
                />
              )}
            </View>
            <View style={styles.photoActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onChooseImage}
                style={({ pressed }) => [
                  styles.photoButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.photoButtonText}>
                  {imageUri ? "Change photo" : "Add photo"}
                </Text>
              </Pressable>
              {imageUri ? (
                <Pressable accessibilityRole="button" onPress={onRemoveImage}>
                  <Text style={styles.removePhoto}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <AppTextInput
            label="Nickname"
            maxLength={32}
            value={nickname}
            onChangeText={onChangeNickname}
            placeholder="How riders know you"
          />
          <View style={styles.editActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={onSave}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
                saving && styles.disabledButton,
              ]}
            >
              <Text style={styles.saveText}>
                {saving ? "Saving..." : "Save profile"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ProfileStats({ overview }: { readonly overview: ProfileOverview }) {
  const statistics = overview.statistics;
  const stats = [
    {
      label: "Motorcycles",
      value: statistics.motorcycles.hasData
        ? String(statistics.motorcycles.totalMotorcycles)
        : "None",
      detail: statistics.motorcycles.hasData
        ? `${formatNumber(statistics.motorcycles.totalEstimatedMileageKm)} km total`
        : "Add your first bike",
      accent: "orange" as const,
    },
    {
      label: "Rides",
      value: statistics.rides.hasData
        ? String(statistics.rides.totalRides)
        : "No rides",
      detail: statistics.rides.hasData
        ? `${formatNumber(statistics.rides.totalDistanceKm)} km tracked`
        : "Start a ride",
      accent: "cyan" as const,
    },
    {
      label: "Ride Time",
      value: statistics.rides.hasData
        ? formatDuration(statistics.rides.totalRideTimeSeconds)
        : "Pending",
      detail: statistics.rides.hasData
        ? `${formatNumber(statistics.rides.averageSpeedKmh)} km/h avg`
        : "No totals yet",
      accent: "success" as const,
    },
    {
      label: "Service",
      value: statistics.maintenance.hasData
        ? String(statistics.maintenance.upcomingCount)
        : "None",
      detail:
        statistics.maintenance.nextScheduledService?.title ??
        "No scheduled service",
      accent: "warning" as const,
    },
  ] as const;

  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Rider Summary</Text>
        <Text style={styles.sectionSubtitle}>Local stats from your device</Text>
      </View>
      <GlassCard style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View
              style={[
                styles.statDot,
                { backgroundColor: statAccentColors[stat.accent] },
              ]}
            />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={styles.statValue}
            >
              {stat.value}
            </Text>
            <Text numberOfLines={1} style={styles.statDetail}>
              {stat.detail}
            </Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

function MotorcyclePanel({
  overview,
  onAdd,
  onViewAll,
}: {
  readonly overview: ProfileOverview;
  readonly onAdd: () => void;
  readonly onViewAll: () => void;
}) {
  const motorcycle = overview.statistics.motorcycles.defaultMotorcycle;
  return (
    <GlassCard style={styles.motorcyclePanel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>My Motorcycles</Text>
        <Pressable accessibilityRole="button" onPress={onViewAll} hitSlop={12}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>
      {motorcycle ? (
        <Pressable
          accessibilityRole="button"
          onPress={onViewAll}
          style={({ pressed }) => [
            styles.motorcycleRow,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.bikeImageShell}>
            <Image
              resizeMode="contain"
              source={
                motorcycle.imageUri
                  ? { uri: motorcycle.imageUri }
                  : require("../../../assets/images/dashboard-motorcycle-fallback.png")
              }
              style={styles.bikeImage}
            />
          </View>
          <View style={styles.bikeCopy}>
            <Text numberOfLines={1} style={styles.bikeName}>
              {motorcycle.nickname}
            </Text>
            <Text numberOfLines={1} style={styles.bikeSpec}>
              {motorcycle.engineCc}cc · {motorcycle.brand} {motorcycle.model}
            </Text>
            <Text style={styles.ready}>● Ready to ride</Text>
          </View>
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            tintColor={palette.textMuted}
            size={22}
          />
        </Pressable>
      ) : (
        <Text style={styles.emptyBike}>No motorcycle added yet.</Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        style={({ pressed }) => [styles.addBike, pressed && styles.pressed]}
      >
        <SymbolView
          name={{ ios: "plus", android: "add", web: "add" }}
          tintColor={palette.accentOrange}
          size={26}
        />
        <View>
          <Text style={styles.addBikeTitle}>Add Motorcycle</Text>
          <Text style={styles.addBikeCopy}>
            Track and manage another motorcycle
          </Text>
        </View>
      </Pressable>
    </GlassCard>
  );
}

type SettingsActions = {
  readonly onExportBackup: () => void;
  readonly onImportBackup: () => void;
  readonly onRequestNotificationPermission: () => void;
  readonly onSendTestNotification: () => void;
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
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.sectionSubtitle}>
          Manage your data and preferences
        </Text>
      </View>
      <View style={styles.settingsStack}>
        {overview.sections.map((section) => (
          <SettingsSectionCard
            key={section.id}
            backupBusy={backupBusy}
            lastBackupResult={lastBackupResult}
            localNotificationsEnabled={overview.localNotificationsEnabled}
            notificationPermission={notificationPermission}
            section={section}
            onExportBackup={onExportBackup}
            onImportBackup={onImportBackup}
            onRequestNotificationPermission={onRequestNotificationPermission}
            onSendTestNotification={onSendTestNotification}
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
  localNotificationsEnabled,
  notificationPermission,
  section,
  onExportBackup,
  onImportBackup,
  onRequestNotificationPermission,
  onSendTestNotification,
  onToggleLocalNotifications,
  onSignOut,
}: SettingsActions & {
  readonly backupBusy: boolean;
  readonly lastBackupResult: string | null;
  readonly localNotificationsEnabled: boolean;
  readonly notificationPermission: NotificationPermissionStatus | null;
  readonly section: SettingsSection;
}) {
  const sectionIcon = getSectionIcon(section.id);

  return (
    <GlassCard style={styles.settingsCard}>
      <View style={styles.settingsCardHeader}>
        <View style={styles.settingsCardIcon}>
          <SymbolView
            name={sectionIcon}
            size={24}
            tintColor={palette.accentOrange}
          />
        </View>
        <View style={styles.settingsCardHeaderText}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.mutedText}>{section.subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingsRows}>
        {section.items
          .filter((item) => item.action !== "sign-out")
          .map((item, index) => {
            const value = getSettingsItemValue(item, notificationPermission);
            const onPress = getSettingsItemAction(item, {
              onRequestNotificationPermission,
              onExportBackup,
              onImportBackup,
              onSendTestNotification,
              onToggleLocalNotifications,
              onSignOut,
            });
            const disabled =
              item.disabled || !onPress || (backupBusy && isBackupAction(item));
            const isToggle = item.action === "toggle-local-notifications";

            return (
              <Pressable
                key={item.id}
                accessibilityRole={onPress ? "button" : undefined}
                disabled={disabled}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.settingsRow,
                  index > 0 && styles.settingsRowBorder,
                  onPress ? styles.actionRow : null,
                  pressed && !disabled ? styles.pressed : null,
                ]}
              >
                <View style={styles.settingsRowLeft}>
                  <View style={styles.settingsItemIcon}>
                    <SymbolView
                      name={getItemIcon(item.id)}
                      size={20}
                      tintColor={
                        disabled ? palette.textMuted : palette.accentOrange
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.settingsLabel,
                      item.disabled ? styles.disabledText : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <View style={styles.settingsRowRight}>
                  {isToggle ? (
                    <View
                      style={[styles.toggle, disabled && styles.toggleDisabled]}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          localNotificationsEnabled
                            ? styles.toggleThumbOn
                            : styles.toggleThumbOff,
                        ]}
                      />
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.settingsValue,
                        disabled ? styles.disabledText : null,
                      ]}
                    >
                      {backupBusy && isBackupAction(item)
                        ? "Working..."
                        : value}
                    </Text>
                  )}
                  {onPress && !isToggle ? (
                    <SymbolView
                      name={{
                        ios: "chevron.right",
                        android: "chevron_right",
                        web: "chevron_right",
                      }}
                      size={18}
                      tintColor={palette.textMuted}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
      </View>
      {section.id === "data-storage" ? (
        <View style={styles.backupNotice}>
          <Text style={styles.backupWarning}>
            Import replaces current local data after confirmation.
          </Text>
          {lastBackupResult ? (
            <Text style={styles.backupResult}>{lastBackupResult}</Text>
          ) : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

function getSectionIcon(sectionId: string) {
  const icons: Record<string, { ios: string; android: string; web: string }> = {
    "app-preferences": { ios: "gear", android: "settings", web: "settings" },
    notifications: {
      ios: "bell.fill",
      android: "notifications",
      web: "notifications",
    },
    "data-storage": {
      ios: "externaldrive.fill",
      android: "storage",
      web: "storage",
    },
  };

  return (icons[sectionId] || icons["app-preferences"]) as any;
}

function getItemIcon(itemId: string) {
  const icons: Record<string, { ios: string; android: string; web: string }> = {
    "speed-unit": { ios: "speedometer", android: "speed", web: "speed" },
    "distance-unit": { ios: "ruler", android: "straighten", web: "straighten" },
    theme: { ios: "paintbrush.fill", android: "brush", web: "brush" },
    "local-notifications": {
      ios: "bell.fill",
      android: "notifications_active",
      web: "notifications_active",
    },
    "notification-permission": {
      ios: "checkmark.shield.fill",
      android: "verified_user",
      web: "verified_user",
    },
    "test-notification": { ios: "envelope.fill", android: "mail", web: "mail" },
    "export-backup": {
      ios: "square.and.arrow.up.fill",
      android: "upload",
      web: "upload",
    },
    "import-backup": {
      ios: "square.and.arrow.down.fill",
      android: "download",
      web: "download",
    },
  };

  return (icons[itemId] || {
    ios: "circle.fill",
    android: "circle",
    web: "circle",
  }) as any;
}

function getSettingsItemValue(
  item: SettingsItem,
  notificationPermission: NotificationPermissionStatus | null,
) {
  if (item.id !== "notification-permission") {
    return item.value;
  }

  if (!notificationPermission) {
    return "Unknown";
  }

  if (notificationPermission.granted) {
    return "Granted";
  }

  if (notificationPermission.state === "unavailable") {
    return "Dev build required";
  }

  return notificationPermission.state === "denied" ? "Denied" : "Not requested";
}

function getSettingsItemAction(item: SettingsItem, actions: SettingsActions) {
  switch (item.action) {
    case "toggle-local-notifications":
      return actions.onToggleLocalNotifications;
    case "export-backup":
      return actions.onExportBackup;
    case "import-backup":
      return actions.onImportBackup;
    case "request-notification-permission":
      return actions.onRequestNotificationPermission;
    case "test-notification":
      return actions.onSendTestNotification;
    case "sign-out":
      return actions.onSignOut;
    case undefined:
      return undefined;
  }
}

function isBackupAction(item: SettingsItem) {
  return item.action === "export-backup" || item.action === "import-backup";
}

function confirmBackupReplacement(confirmation: BackupImportConfirmation) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      "Replace local data?",
      [
        `This backup contains ${confirmation.summary.motorcyclesRestored} motorcycles, ${confirmation.summary.maintenanceRecordsRestored} maintenance records, and ${confirmation.summary.ridesRestored} rides.`,
        "Import will replace current local data on this device.",
      ].join("\n\n"),
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Replace",
          style: "destructive",
          onPress: () => resolve(true),
        },
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

const statAccentColors: Record<string, string> = {
  orange: palette.accentOrange,
  cyan: "#E5E7EB",
  success: palette.success,
  warning: palette.warning,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -130,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: 120,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(249, 115, 22, 0.08)",
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    alignSelf: "stretch",
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: spacing.sm,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: 20,
  },
  header: {
    gap: spacing.xs,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "rgba(248, 250, 252, 0.52)",
    textTransform: "uppercase",
  },
  title: {
    ...typography.heading,
    color: palette.text,
  },
  subtitle: {
    ...typography.body,
    color: "rgba(248, 250, 252, 0.64)",
    fontWeight: "600",
  },
  heroCard: {
    flexDirection: "column",
    gap: spacing.lg,
    overflow: "hidden",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    width: "100%",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    width: "100%",
  },
  heroGlow: {
    position: "absolute",
    top: -90,
    right: -80,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  avatarContainer: {
    position: "relative",
    width: 88,
    height: 88,
  },
  avatarGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 52,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    shadowColor: palette.accentOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor: "rgba(255, 106, 0, 0.10)",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 999 },
  editProfileButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,.07)",
  },
  heroCopy: { flex: 1, minWidth: 0 },
  heroName: {
    ...typography.heading,
    color: palette.text,
  },
  heroSubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: "rgba(248, 250, 252, 0.66)",
    fontWeight: "700",
  },
  notice: {
    display: "none",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
  },
  noticeText: {
    ...typography.caption,
    flex: 1,
    color: "rgba(248, 250, 252, 0.66)",
  },
  section: {
    gap: spacing.md,
    width: "100%",
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: "rgba(248, 250, 252, 0.58)",
  },
  statsGrid: {
    flexDirection: "row",
    padding: 0,
    gap: 0,
    overflow: "hidden",
    backgroundColor: "rgba(17,21,28,.88)",
  },
  rideMotto: { ...typography.body, color: palette.textMuted, marginTop: 3 },
  riderBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,106,0,.35)",
    borderRadius: 8,
    backgroundColor: "rgba(255,106,0,.07)",
  },
  riderBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: palette.accentOrange,
  },
  levelBadge: {
    position: "absolute",
    bottom: -8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.4)",
  },
  levelLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: palette.accentOrange,
    textTransform: "uppercase",
  },
  levelValue: {
    fontSize: 16,
    fontWeight: "900",
    color: palette.accentOrange,
    lineHeight: 20,
  },
  xpSection: {
    marginTop: spacing.md,
    gap: spacing.xs,
    width: "100%",
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpCurrent: {
    ...typography.label,
    fontSize: 12,
    fontWeight: "800",
    color: palette.text,
    textTransform: "uppercase",
  },
  xpTarget: {
    ...typography.caption,
    fontSize: 11,
    color: "rgba(248, 250, 252, 0.58)",
    fontWeight: "700",
  },
  xpBarContainer: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  xpBar: {
    flex: 1,
    height: "100%",
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  xpFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: palette.accentOrange,
  },
  statCard: {
    flex: 1,
    minHeight: 112,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000000",
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
    color: "rgba(248, 250, 252, 0.56)",
    textTransform: "uppercase",
    textAlign: "center",
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
    color: "rgba(248, 250, 252, 0.58)",
  },
  settingsStack: {
    gap: spacing.md,
  },
  settingsCard: {
    gap: spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.075)",
    borderColor: "rgba(255, 255, 255, 0.13)",
  },
  settingsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingsCardIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
  },
  settingsCardHeaderText: {
    flex: 1,
  },
  settingsRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  settingsItemIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(249, 115, 22, 0.08)",
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    padding: 2,
    justifyContent: "center",
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
    backgroundColor: palette.accentOrange,
  },
  toggleThumbOff: {
    transform: [{ translateX: 0 }],
    backgroundColor: "rgba(255, 255, 255, 0.6)",
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
    color: "rgba(248, 250, 252, 0.58)",
  },
  retryButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,106,0,.42)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,106,0,.1)",
  },
  retryButtonText: {
    ...typography.button,
    color: palette.accentOrange,
  },
  settingsRows: {
    gap: spacing.sm,
  },
  backupNotice: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  backupWarning: {
    ...typography.caption,
    color: palette.warning,
    fontWeight: "700",
  },
  backupResult: {
    ...typography.caption,
    color: "rgba(248, 250, 252, 0.62)",
  },
  settingsRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  actionRow: {
    minHeight: 48,
  },
  settingsLabel: {
    ...typography.body,
    flex: 1,
    color: palette.text,
    fontWeight: "700",
  },
  settingsValue: {
    ...typography.caption,
    maxWidth: "46%",
    color: "rgba(248, 250, 252, 0.62)",
    textAlign: "right",
    fontWeight: "700",
  },
  disabledText: {
    color: "rgba(248, 250, 252, 0.36)",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  motorcyclePanel: {
    gap: spacing.md,
    backgroundColor: "rgba(17,21,28,.88)",
    borderColor: "rgba(255,255,255,.11)",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: {
    ...typography.subtitle,
    color: palette.text,
    fontWeight: "900",
  },
  viewAll: {
    ...typography.body,
    color: palette.accentOrange,
    fontWeight: "800",
  },
  motorcycleRow: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bikeImageShell: {
    width: 104,
    height: 78,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,.04)",
  },
  bikeImage: { width: "100%", height: "100%" },
  bikeCopy: { flex: 1, minWidth: 0 },
  bikeName: { ...typography.subtitle, color: palette.text, fontWeight: "900" },
  bikeSpec: { ...typography.caption, color: palette.textMuted, marginTop: 4 },
  ready: {
    ...typography.caption,
    color: palette.success,
    marginTop: 8,
    fontWeight: "700",
  },
  emptyBike: { ...typography.body, color: palette.textMuted },
  addBike: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,.15)",
    borderRadius: radius.lg,
  },
  addBikeTitle: { ...typography.body, color: palette.text, fontWeight: "800" },
  addBikeCopy: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  logoutCard: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    borderRadius: radius.xl,
    backgroundColor: "rgba(17,21,28,.88)",
  },
  logoutIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,77,79,.1)",
  },
  logoutCopy: { flex: 1 },
  logoutTitle: { ...typography.body, color: palette.text, fontWeight: "900" },
  logoutSubtitle: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,.72)",
  },
  editSheet: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    backgroundColor: "#0B0E13",
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeEdit: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,.08)",
  },
  photoEditor: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatarLarge: {
    width: 96,
    height: 96,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(249,115,22,.7)",
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,.07)",
  },
  photoActions: { gap: spacing.md },
  photoButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(249,115,22,.13)",
  },
  photoButtonText: {
    ...typography.body,
    color: palette.accentOrange,
    fontWeight: "800",
  },
  removePhoto: {
    ...typography.caption,
    color: palette.danger,
    fontWeight: "700",
  },
  editActions: { flexDirection: "row", gap: spacing.md },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.13)",
    borderRadius: radius.lg,
  },
  cancelText: { ...typography.body, color: palette.text, fontWeight: "800" },
  saveButton: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: palette.accentOrange,
  },
  saveText: { ...typography.body, color: "#0A0B0E", fontWeight: "900" },
  disabledButton: { opacity: 0.55 },
});

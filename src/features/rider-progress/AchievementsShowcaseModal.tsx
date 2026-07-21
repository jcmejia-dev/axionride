import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type {
  RiderAchievement,
  RiderAchievementId,
  RiderAchievementProgress,
  RiderProgressSnapshot,
} from "@/src/domain/rider-progress";
import { premiumColors, radius, spacing, typography } from "@/src/theme";

import {
  ACHIEVEMENT_ICONS,
  type AchievementSymbolName,
} from "./achievementPresentation";

type AchievementsShowcaseModalProps = {
  readonly visible: boolean;
  readonly snapshot: RiderProgressSnapshot;
  readonly onClose: () => void;
};

type AchievementMeter = {
  readonly current: number;
  readonly target: number;
  readonly unit: string;
};

const HUD_FONT = Platform.select({ android: "sans-serif-condensed", default: undefined });

export function AchievementsShowcaseModal({
  visible,
  snapshot,
  onClose,
}: AchievementsShowcaseModalProps) {
  const initialSelection = useMemo(
    () =>
      [...snapshot.achievements]
        .reverse()
        .find((achievement) => achievement.unlocked) ?? snapshot.achievements[0] ?? null,
    [snapshot.achievements],
  );
  const [selectedId, setSelectedId] = useState<RiderAchievementId | null>(
    initialSelection?.id ?? null,
  );
  const entrance = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    setSelectedId(initialSelection?.id ?? null);
    entrance.value = 0;
    entrance.value = withSpring(1, { damping: 17, stiffness: 150 });
  }, [entrance, initialSelection?.id, visible]);

  const selected =
    snapshot.achievements.find((achievement) => achievement.id === selectedId) ??
    initialSelection;
  const unlockedCount = snapshot.achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;
  const completion = snapshot.achievements.length
    ? unlockedCount / snapshot.achievements.length
    : 0;
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: withTiming(entrance.value, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    }),
    transform: [
      { translateY: interpolate(entrance.value, [0, 1], [42, 0]) },
      { scale: interpolate(entrance.value, [0, 1], [0.97, 1]) },
    ],
  }));

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close achievements"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View pointerEvents="none" style={styles.topGlow} />
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>RIDER RECORD // ACHIEVEMENTS</Text>
              <Text accessibilityRole="header" style={styles.title}>
                Your trophy garage
              </Text>
              <Text style={styles.subtitle}>
                Every recorded milestone upgrades your rider profile.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <SymbolView
                name={{ ios: "xmark", android: "close", web: "close" }}
                size={18}
                tintColor={premiumColors.textPrimary}
              />
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRing}>
              <Text style={styles.summaryNumber}>{unlockedCount}</Text>
              <Text style={styles.summaryTotal}>/{snapshot.achievements.length}</Text>
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>COLLECTION PROGRESS</Text>
              <Text style={styles.summaryValue}>{Math.round(completion * 100)}% unlocked</Text>
              <View
                accessibilityLabel={`${unlockedCount} of ${snapshot.achievements.length} achievements unlocked`}
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: snapshot.achievements.length,
                  now: unlockedCount,
                }}
                style={styles.summaryTrack}
              >
                <View style={[styles.summaryFill, { width: `${completion * 100}%` }]} />
              </View>
            </View>
            <View style={styles.levelPill}>
              <Text style={styles.levelLabel}>LV {snapshot.progress.level}</Text>
              <Text style={styles.levelXp}>{snapshot.progress.totalXp} XP</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {snapshot.achievements.map((achievement, index) => (
                <AchievementTile
                  achievement={achievement}
                  index={index}
                  key={achievement.id}
                  meter={getAchievementMeter(achievement.id, snapshot.achievementProgress)}
                  onPress={() => setSelectedId(achievement.id)}
                  selected={selected?.id === achievement.id}
                />
              ))}
            </View>

            {selected ? (
              <Animated.View
                entering={FadeInDown.duration(260)}
                exiting={FadeOutDown.duration(160)}
                key={selected.id}
                style={styles.detailCard}
              >
                <View style={styles.detailHeading}>
                  <View
                    style={[
                      styles.detailIcon,
                      selected.unlocked ? styles.iconUnlocked : styles.iconLocked,
                    ]}
                  >
                    <SymbolView
                      name={ACHIEVEMENT_ICONS[selected.id]}
                      size={28}
                      tintColor={
                        selected.unlocked
                          ? premiumColors.primary
                          : premiumColors.textTertiary
                      }
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailKicker}>
                      {selected.unlocked ? "MILESTONE UNLOCKED" : "NEXT OBJECTIVE"}
                    </Text>
                    <Text style={styles.detailTitle}>{selected.title}</Text>
                  </View>
                  <SymbolView
                    name={
                      selected.unlocked
                        ? { ios: "checkmark.seal.fill", android: "verified", web: "verified" }
                        : { ios: "lock.fill", android: "lock", web: "lock" }
                    }
                    size={22}
                    tintColor={
                      selected.unlocked ? premiumColors.success : premiumColors.textTertiary
                    }
                  />
                </View>
                <Text style={styles.detailDescription}>{selected.description}</Text>
                <AchievementProgress
                  achievement={selected}
                  meter={getAchievementMeter(selected.id, snapshot.achievementProgress)}
                />
              </Animated.View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function AchievementTile({
  achievement,
  index,
  meter,
  onPress,
  selected,
}: {
  readonly achievement: RiderAchievement;
  readonly index: number;
  readonly meter: AchievementMeter;
  readonly onPress: () => void;
  readonly selected: boolean;
}) {
  const ratio = achievement.unlocked ? 1 : Math.min(meter.current / meter.target, 1);
  return (
    <Animated.View entering={FadeInDown.delay(70 + index * 65).springify()} style={styles.tileShell}>
      <Pressable
        accessibilityLabel={`${achievement.title}. ${achievement.unlocked ? "Unlocked" : `${formatMeterValue(meter.current, meter.unit)} of ${formatMeterValue(meter.target, meter.unit)}`}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          selected && styles.tileSelected,
          achievement.unlocked && styles.tileUnlocked,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.tileTopRow}>
          <View style={[styles.tileIcon, achievement.unlocked ? styles.iconUnlocked : styles.iconLocked]}>
            <SymbolView
              name={ACHIEVEMENT_ICONS[achievement.id]}
              size={24}
              tintColor={achievement.unlocked ? premiumColors.primary : premiumColors.textTertiary}
            />
          </View>
          <Text style={[styles.tileState, achievement.unlocked && styles.tileStateUnlocked]}>
            {achievement.unlocked ? "UNLOCKED" : `${Math.round(ratio * 100)}%`}
          </Text>
        </View>
        <Text numberOfLines={2} style={styles.tileTitle}>{achievement.title}</Text>
        <View style={styles.tileTrack}>
          <View style={[styles.tileFill, { width: `${ratio * 100}%` }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AchievementProgress({
  achievement,
  meter,
}: {
  readonly achievement: RiderAchievement;
  readonly meter: AchievementMeter;
}) {
  const ratio = achievement.unlocked ? 1 : Math.min(meter.current / meter.target, 1);
  return (
    <View style={styles.detailProgress}>
      <View style={styles.detailProgressLabels}>
        <Text style={styles.detailProgressLabel}>PROGRESS</Text>
        <Text style={styles.detailProgressValue}>
          {achievement.unlocked
            ? "Complete"
            : `${formatMeterValue(meter.current, meter.unit)} / ${formatMeterValue(meter.target, meter.unit)}`}
        </Text>
      </View>
      <View style={styles.detailTrack}>
        <View style={[styles.detailFill, { width: `${ratio * 100}%` }]} />
      </View>
      {achievement.unlockedAt ? (
        <Text style={styles.unlockedDate}>
          Added to your garage {new Date(achievement.unlockedAt).toLocaleDateString()}
        </Text>
      ) : null}
    </View>
  );
}

function getAchievementMeter(
  id: RiderAchievementId,
  progress: RiderAchievementProgress,
): AchievementMeter {
  switch (id) {
    case "first-ride":
      return { current: progress.completedRideCount, target: 1, unit: "rides" };
    case "ten-rides":
      return { current: progress.completedRideCount, target: 10, unit: "rides" };
    case "hundred-km-rider":
      return { current: progress.totalDistanceKm, target: 100, unit: "km" };
    case "maintenance-master":
      return { current: progress.completedMaintenanceCount, target: 5, unit: "tasks" };
  }
}

function formatMeterValue(value: number, unit: string) {
  const display = unit === "km" ? Math.round(value) : Math.floor(value);
  return `${display} ${unit}`;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(1, 4, 8, 0.82)",
  },
  sheet: {
    maxHeight: "91%",
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255, 118, 23, 0.30)",
    backgroundColor: "#080D13",
    shadowColor: premiumColors.primary,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 24,
  },
  topGlow: {
    position: "absolute",
    top: -110,
    right: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 106, 0, 0.10)",
  },
  handle: {
    alignSelf: "center",
    width: 46,
    height: 4,
    marginTop: 10,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.20)",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    ...typography.label,
    fontFamily: HUD_FONT,
    color: premiumColors.primary,
    fontSize: 10,
    letterSpacing: 1.3,
  },
  title: {
    ...typography.heading,
    fontFamily: HUD_FONT,
    marginTop: 5,
    color: premiumColors.textPrimary,
    fontSize: 25,
    fontWeight: "900",
  },
  subtitle: {
    ...typography.caption,
    marginTop: 5,
    color: premiumColors.textSecondary,
  },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,.06)",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 118, 23, 0.20)",
    borderRadius: radius.xl,
    backgroundColor: "rgba(255, 118, 23, 0.055)",
  },
  summaryRing: {
    width: 56,
    height: 56,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    paddingTop: 14,
    borderWidth: 2,
    borderColor: premiumColors.primary,
    borderRadius: 28,
    backgroundColor: "rgba(255, 118, 23, 0.09)",
  },
  summaryNumber: { color: premiumColors.textPrimary, fontSize: 20, fontWeight: "900" },
  summaryTotal: { color: premiumColors.textTertiary, fontSize: 11, fontWeight: "800" },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryLabel: {
    ...typography.label,
    color: premiumColors.textTertiary,
    fontSize: 9,
    letterSpacing: 0.9,
  },
  summaryValue: { marginTop: 3, color: premiumColors.textPrimary, fontSize: 15, fontWeight: "900" },
  summaryTrack: {
    height: 5,
    marginTop: 8,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,.08)",
  },
  summaryFill: { height: "100%", borderRadius: radius.pill, backgroundColor: premiumColors.primary },
  levelPill: { alignItems: "flex-end", gap: 2 },
  levelLabel: { color: premiumColors.primary, fontSize: 11, fontWeight: "900" },
  levelXp: { color: premiumColors.textSecondary, fontSize: 10, fontWeight: "700" },
  scrollContent: { padding: 20, paddingBottom: 34, gap: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tileShell: { width: "48.5%" },
  tile: {
    minHeight: 126,
    gap: 10,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.09)",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,.035)",
  },
  tileSelected: { borderColor: "rgba(255, 118, 23, .62)", backgroundColor: "rgba(255, 118, 23, .075)" },
  tileUnlocked: { shadowColor: premiumColors.primary, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3 },
  tileTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tileIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  iconUnlocked: { borderWidth: 1, borderColor: "rgba(255,118,23,.28)", backgroundColor: "rgba(255,118,23,.12)" },
  iconLocked: { borderWidth: 1, borderColor: "rgba(255,255,255,.07)", backgroundColor: "rgba(255,255,255,.045)" },
  tileState: { color: premiumColors.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  tileStateUnlocked: { color: premiumColors.success },
  tileTitle: { minHeight: 34, color: premiumColors.textPrimary, fontSize: 13, lineHeight: 17, fontWeight: "900" },
  tileTrack: { height: 4, overflow: "hidden", borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,.08)" },
  tileFill: { height: "100%", borderRadius: radius.pill, backgroundColor: premiumColors.primary },
  detailCard: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.11)",
    borderRadius: 20,
    backgroundColor: "rgba(16, 22, 30, .96)",
  },
  detailHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailIcon: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  detailCopy: { flex: 1, minWidth: 0 },
  detailKicker: { color: premiumColors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  detailTitle: { marginTop: 3, color: premiumColors.textPrimary, fontSize: 18, fontWeight: "900" },
  detailDescription: { ...typography.body, color: premiumColors.textSecondary, lineHeight: 21 },
  detailProgress: { gap: 8 },
  detailProgressLabels: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailProgressLabel: { color: premiumColors.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  detailProgressValue: { color: premiumColors.textPrimary, fontSize: 11, fontWeight: "900" },
  detailTrack: { height: 7, overflow: "hidden", borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,.08)" },
  detailFill: { height: "100%", borderRadius: radius.pill, backgroundColor: premiumColors.primary },
  unlockedDate: { ...typography.caption, color: premiumColors.textTertiary },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
});

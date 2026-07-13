import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { RiderProgressSnapshot } from "@/src/services";
import { premiumColors, radius, spacing, typography } from "@/src/theme";

const HUD_FONT = Platform.select({ android: 'sans-serif-condensed', default: undefined });

type DashboardTopHeaderProps = {
  readonly greeting: string;
  readonly riderName: string;
  readonly riderProgress: RiderProgressSnapshot;
  readonly onOpenAchievements: () => void;
  readonly onOpenSearch: () => void;
};

export function DashboardTopHeader({
  greeting,
  riderName,
  riderProgress,
  onOpenAchievements,
  onOpenSearch,
}: DashboardTopHeaderProps) {
  const level = riderProgress.progress.level;
  const xp = riderProgress.progress.xp;
  const unlockedCount = riderProgress.achievements.filter((achievement) => achievement.unlocked).length;
  const animatedProgress = useSharedValue(xp);

  useEffect(() => {
    animatedProgress.value = withTiming(xp, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, xp]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View>
          <View accessibilityRole="image" accessibilityLabel="AxionRide" style={styles.wordmark}>
            <Text style={styles.wordmarkAxion}>AXION</Text>
            <Text style={styles.wordmarkRide}>RIDE</Text>
          </View>
          <Text style={styles.tagline}>RIDE SAFE. RIDE SMART.</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel={`Open rider achievements. ${unlockedCount} unlocked`}
            accessibilityRole="button"
            onPress={onOpenAchievements}
            style={({ pressed }) => [styles.iconButton, styles.trophyButton, pressed && styles.pressed]}
          >
            <View pointerEvents="none" style={[styles.iconCorner, styles.iconCornerTop]} />
            <View pointerEvents="none" style={[styles.iconCorner, styles.iconCornerBottom]} />
            <SymbolView
              name={{ ios: "trophy", android: "emoji_events", web: "emoji_events" }}
              size={21}
              tintColor={unlockedCount > 0 ? premiumColors.primary : premiumColors.textSecondary}
            />
            {unlockedCount > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{unlockedCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityLabel="Search motorcycles, rides, and maintenance"
            accessibilityRole="search"
            onPress={onOpenSearch}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <View pointerEvents="none" style={[styles.iconCorner, styles.iconCornerTop]} />
            <View pointerEvents="none" style={[styles.iconCorner, styles.iconCornerBottom]} />
            <SymbolView
              name={{ ios: "magnifyingglass", android: "search", web: "search" }}
              size={21}
              tintColor={premiumColors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.hudRow}>
        <View style={styles.greetingLine}>
          <Text numberOfLines={1} style={styles.greeting}>{greeting},</Text>
          <Text accessibilityRole="header" numberOfLines={1} style={styles.name}>
            {riderName}
          </Text>
        </View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelLabel}>LV</Text>
          <Text style={styles.levelValue}>{level}</Text>
          <View style={styles.levelDivider} />
          <Text style={styles.xpValue}>{xp} XP</Text>
          <View
            accessibilityLabel={`${xp} of 100 XP toward level ${level + 1}`}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: xp }}
            style={styles.badgeProgressTrack}
          >
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  logoRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    transform: [{ skewX: "-8deg" }],
  },
  wordmarkAxion: {
    fontFamily: HUD_FONT,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1.3,
    color: premiumColors.textPrimary,
  },
  wordmarkRide: {
    fontFamily: HUD_FONT,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1.3,
    color: premiumColors.primaryBright,
  },
  tagline: {
    marginTop: 4,
    fontFamily: HUD_FONT,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1.55,
    color: "rgba(247, 248, 250, 0.9)",
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(130, 143, 158, 0.2)",
    borderRadius: 5,
    backgroundColor: "rgba(4, 9, 14, 0.94)",
  },
  trophyButton: {
    borderColor: "rgba(116, 137, 153, 0.38)",
    backgroundColor: "rgba(6, 12, 18, 0.96)",
  },
  iconCorner: {
    position: 'absolute',
    width: 13,
    height: 2,
    backgroundColor: 'rgba(123, 151, 170, 0.58)',
  },
  iconCornerTop: {
    top: -1,
    left: 4,
  },
  iconCornerBottom: {
    right: 4,
    bottom: -1,
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderRadius: 3,
    backgroundColor: premiumColors.primary,
  },
  countText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },
  hudRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  greetingLine: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  greeting: {
    fontFamily: HUD_FONT,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0.15,
    color: premiumColors.textSecondary,
  },
  name: {
    fontFamily: HUD_FONT,
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    fontStyle: 'italic',
    letterSpacing: -0.25,
    color: premiumColors.textPrimary,
  },
  levelBadge: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
  },
  levelLabel: {
    ...typography.label,
    fontFamily: HUD_FONT,
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 0.7,
    color: premiumColors.textSecondary,
  },
  levelValue: {
    fontFamily: HUD_FONT,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "900",
    color: premiumColors.textPrimary,
  },
  levelDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    marginHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  xpValue: {
    ...typography.caption,
    fontFamily: HUD_FONT,
    fontSize: 10,
    fontWeight: '700',
    color: premiumColors.textSecondary,
  },
  badgeProgressTrack: {
    width: 22,
    height: 3,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: "rgba(130, 143, 158, 0.18)",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: premiumColors.primary,
  },
});

import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { GlassCard } from "@/src/components/premium";
import type { RiderProgressSnapshot } from "@/src/services";
import { premiumColors, radius, spacing, typography } from "@/src/theme";

type RiderProgressCardProps = {
  readonly snapshot: RiderProgressSnapshot;
};

export function RiderProgressCard({ snapshot }: RiderProgressCardProps) {
  const unlockedCount = snapshot.achievements.filter((achievement) => achievement.unlocked).length;
  const progressPercent = Math.max(0, Math.min(snapshot.progress.xp, 100));
  const animatedProgress = useSharedValue(progressPercent);

  useEffect(() => {
    animatedProgress.value = withTiming(progressPercent, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progressPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.levelIcon}>
          <SymbolView
            name={{ ios: "chart.line.uptrend.xyaxis", android: "trending_up", web: "trending_up" }}
            tintColor={premiumColors.primary}
            size={20}
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Rider progress</Text>
          <Text style={styles.title}>Level {snapshot.progress.level} Rider</Text>
        </View>
        <View style={styles.streakChip}>
          <Text style={styles.streakText}>
            {snapshot.streak.streakCount}-day riding streak
          </Text>
        </View>
      </View>

      <View
        accessibilityLabel={`${snapshot.progress.xp} of 100 XP toward the next rider level`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: snapshot.progress.xp }}
        style={styles.progressTrack}
      >
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.xpText}>{snapshot.progress.xp} / 100 XP</Text>
        <Text style={styles.achievementText}>
          {unlockedCount} / {snapshot.achievements.length} achievements
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderColor: "rgba(255, 106, 0, 0.22)",
    backgroundColor: "rgba(17, 21, 28, 0.84)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  levelIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: premiumColors.borderOrange,
    borderRadius: radius.pill,
    backgroundColor: premiumColors.primaryMuted,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.label,
    color: premiumColors.textSecondary,
    textTransform: "uppercase",
  },
  title: {
    ...typography.subtitle,
    marginTop: 2,
    color: premiumColors.textPrimary,
  },
  streakChip: {
    maxWidth: 132,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  streakText: {
    ...typography.label,
    color: premiumColors.textSecondary,
    textAlign: "center",
    textTransform: "none",
  },
  progressTrack: {
    height: 7,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: premiumColors.primary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  xpText: {
    ...typography.caption,
    color: premiumColors.textPrimary,
    fontWeight: "800",
  },
  achievementText: {
    ...typography.caption,
    color: premiumColors.textSecondary,
  },
});

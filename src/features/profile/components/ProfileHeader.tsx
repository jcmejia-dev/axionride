import { SymbolView } from "expo-symbols";
import { Platform, StyleSheet, Text, View } from "react-native";

import { premiumColors, radius, spacing, typography } from "@/src/theme";

const HUD_FONT = Platform.select({
  android: "sans-serif-condensed",
  default: undefined,
});

export type ProfileHeaderProps = {
  readonly riderName: string;
  readonly level: number;
  readonly xp: number;
  readonly streakCount: number;
};

export function ProfileHeader({
  riderName,
  level,
  xp,
  streakCount,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.greetingLine}>
        <Text numberOfLines={1} style={styles.greeting}>
          {riderName}
        </Text>
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
            <View style={[styles.progressFill, { width: `${xp}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.streakRow}>
        <SymbolView
          name={{ ios: "flame.fill", android: "whatshot", web: "whatshot" }}
          size={14}
          tintColor={
            streakCount > 0
              ? premiumColors.primary
              : premiumColors.textSecondary
          }
        />
        <Text
          style={[styles.streakText, streakCount > 0 && styles.streakActive]}
          numberOfLines={1}
        >
          {streakCount > 0
            ? `${streakCount} day${streakCount !== 1 ? "s" : ""}`
            : "No streak"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 36,
  },
  greetingLine: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  greeting: {
    fontFamily: HUD_FONT,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: 0.15,
    color: premiumColors.textSecondary,
    flexShrink: 1,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
  },
  levelLabel: {
    ...typography.label,
    fontFamily: HUD_FONT,
    fontWeight: "900",
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
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  xpValue: {
    ...typography.caption,
    fontFamily: HUD_FONT,
    fontSize: 10,
    fontWeight: "700",
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
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
  },
  streakText: {
    fontFamily: HUD_FONT,
    fontSize: 13,
    fontWeight: "700",
    color: premiumColors.textSecondary,
  },
  streakActive: {
    color: premiumColors.primary,
  },
});

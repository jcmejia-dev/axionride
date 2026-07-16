import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/src/components/premium";
import { iconSizes, premiumColors, typography } from "@/src/theme";

type SymbolName = ComponentProps<typeof SymbolView>["name"];
const HUD_FONT = Platform.select({
  android: "sans-serif-condensed",
  default: undefined,
});
const HUD_ICON_COLOR = "#7F8A98";

export type RideMetrics = {
  readonly totalRides: number;
  readonly totalDistanceKm: number;
  readonly totalDurationSeconds: number;
  readonly bestScore: number | null;
};

export type StatsSummaryProps = {
  readonly metrics: RideMetrics;
};

function formatDistance(km: number): string {
  if (km >= 100) return `${Math.round(km)} km`;
  if (km >= 1) return `${km.toFixed(1)} km`;
  return `${(km * 1000).toFixed(0)} m`;
}

function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function StatsSummary({ metrics }: StatsSummaryProps) {
  const items = [
    {
      icon: {
        ios: "road.lanes" as const,
        android: "route" as const,
        web: "route" as const,
      } satisfies SymbolName,
      label: "RIDES",
      value: String(metrics.totalRides),
      detail: metrics.totalRides > 0 ? "completed" : "no rides yet",
    },
    {
      icon: {
        ios: "point.topleft.down.curvedto.point.bottomright.up" as const,
        android: "straighten" as const,
        web: "straighten" as const,
      } satisfies SymbolName,
      label: "DISTANCE",
      value: formatDistance(metrics.totalDistanceKm),
      detail: metrics.totalDistanceKm > 0 ? "total ridden" : "no distance",
    },
    {
      icon: {
        ios: "clock" as const,
        android: "timer" as const,
        web: "timer" as const,
      } satisfies SymbolName,
      label: "TIME",
      value: formatDuration(metrics.totalDurationSeconds),
      detail: metrics.totalDurationSeconds > 0 ? "total time" : "no time",
    },
    {
      icon: {
        ios: "star.fill" as const,
        android: "star" as const,
        web: "star" as const,
      } satisfies SymbolName,
      label: "BEST SCORE",
      value: metrics.bestScore !== null ? String(metrics.bestScore) : "---",
      detail: metrics.bestScore !== null ? "personal best" : "complete a ride",
    },
  ] as const;

  return (
    <GlassCard style={styles.card}>
      {items.map((item) => (
        <View key={item.label} style={styles.metric}>
          <View style={styles.iconRing}>
            <SymbolView
              name={item.icon}
              size={iconSizes.md}
              tintColor={HUD_ICON_COLOR}
            />
          </View>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={1}
            style={styles.label}
          >
            {item.label}
          </Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={1}
            style={styles.value}
          >
            {item.value}
          </Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            numberOfLines={1}
            style={styles.detail}
          >
            {item.detail}
          </Text>
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexWrap: "wrap",
    flexDirection: "row",
    minHeight: 210,
    padding: 10,
    gap: 8,
    borderColor: "rgba(112, 126, 141, 0.16)",
    borderRadius: 8,
    backgroundColor: "rgba(9, 14, 21, 0.88)",
  },
  metric: {
    width: "48%",
    minHeight: 90,
    flexGrow: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(103, 127, 144, 0.18)",
    borderRadius: 5,
    backgroundColor: "rgba(5, 10, 16, 0.72)",
  },
  iconRing: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(119, 141, 157, 0.22)",
    borderRadius: 4,
    backgroundColor: "rgba(105, 128, 145, 0.06)",
  },
  label: {
    ...typography.label,
    maxWidth: "68%",
    fontFamily: HUD_FONT,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: premiumColors.textSecondary,
    textTransform: "uppercase",
  },
  value: {
    maxWidth: "76%",
    marginTop: 8,
    fontFamily: HUD_FONT,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900",
    color: premiumColors.textPrimary,
    textTransform: "uppercase",
  },
  detail: {
    ...typography.caption,
    fontFamily: HUD_FONT,
    fontSize: 12,
    color: premiumColors.textSecondary,
  },
});

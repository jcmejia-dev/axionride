import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/premium';
import type { StatisticsDashboardSummary } from '@/src/services';
import { iconSizes, premiumColors, spacing, typography } from '@/src/theme';

type MonthlyStatsCardProps = {
  readonly summary: StatisticsDashboardSummary | null;
  readonly loading?: boolean;
};

type SymbolName = ComponentProps<typeof SymbolView>['name'];
const HUD_ICON_COLOR = '#7F919E';
const HUD_FONT = Platform.select({ android: 'sans-serif-condensed', default: undefined });

export function MonthlyStatsCard({ summary, loading = false }: MonthlyStatsCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Activity Overview</Text>
        <View style={styles.monthPill}>
          <Text style={styles.monthText}>All time</Text>
          <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={iconSizes.sm} tintColor={premiumColors.textSecondary} />
        </View>
      </View>

      <View style={styles.rows}>
        <StatRow
          color={HUD_ICON_COLOR}
          icon={{ ios: 'chart.line.uptrend.xyaxis', android: 'show_chart', web: 'show_chart' }}
          label="Rides"
          value={loading ? 'Loading' : formatNumber(summary?.rides.totalRides ?? 0)}
        />
        <StatRow
          color={HUD_ICON_COLOR}
          icon={{ ios: 'road.lanes', android: 'route', web: 'route' }}
          label="Distance"
          value={loading ? 'Loading' : `${formatNumber(summary?.rides.totalDistanceKm ?? 0)} km`}
        />
        <StatRow color={HUD_ICON_COLOR} icon={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} label="Fuel Cost" value="-" />
        <StatRow
          color={HUD_ICON_COLOR}
          icon={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
          label="Ride Time"
          value={loading ? 'Loading' : formatDuration(summary?.rides.totalRideTimeSeconds ?? 0)}
        />
      </View>
    </GlassCard>
  );
}

type StatRowProps = {
  readonly color: string;
  readonly icon: SymbolName;
  readonly label: string;
  readonly value: string;
};

function StatRow({ color, icon, label, value }: StatRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <SymbolView name={icon} size={iconSizes.sm} tintColor={color} />
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.rowLabel}>
        {label}
      </Text>
      <Text numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
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

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 224,
    padding: 14,
    borderColor: 'rgba(98, 124, 143, 0.25)',
    borderRadius: 8,
    backgroundColor: 'rgba(4, 10, 16, 0.94)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    fontFamily: HUD_FONT,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.05,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  monthPill: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(108, 132, 149, 0.24)',
    borderRadius: 4,
    backgroundColor: 'rgba(100, 123, 140, 0.06)',
  },
  monthText: {
    ...typography.caption,
    fontFamily: HUD_FONT,
    fontWeight: '800',
    color: premiumColors.textPrimary,
  },
  rows: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  row: {
    width: '48%',
    minHeight: 72,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(103, 127, 144, 0.18)',
    borderRadius: 4,
    backgroundColor: 'rgba(5, 10, 16, 0.68)',
  },
  rowIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(113, 137, 153, 0.25)',
    borderRadius: 3,
    backgroundColor: 'rgba(105, 128, 145, 0.05)',
  },
  rowLabel: {
    ...typography.label,
    maxWidth: '67%',
    fontFamily: HUD_FONT,
    fontWeight: '900',
    letterSpacing: 0.55,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  rowValue: {
    marginTop: 5,
    fontFamily: HUD_FONT,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    color: premiumColors.textPrimary,
    textTransform: 'uppercase',
  },
});

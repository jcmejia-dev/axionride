import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/premium';
import type { StatisticsDashboardSummary } from '@/src/services';
import { iconSizes, premiumColors, spacing, typography } from '@/src/theme';

type MonthlyStatsCardProps = {
  readonly summary: StatisticsDashboardSummary | null;
  readonly loading?: boolean;
};

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export function MonthlyStatsCard({ summary, loading = false }: MonthlyStatsCardProps) {
  const monthLabel = summary ? formatMonth(summary.generatedAt) : formatMonth(new Date().toISOString());

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>This Month</Text>
        <View style={styles.monthPill}>
          <Text style={styles.monthText}>{monthLabel}</Text>
          <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={iconSizes.sm} tintColor={premiumColors.textSecondary} />
        </View>
      </View>

      <View style={styles.rows}>
        <StatRow
          color={premiumColors.primary}
          icon={{ ios: 'chart.line.uptrend.xyaxis', android: 'show_chart', web: 'show_chart' }}
          label="Rides"
          value={loading ? 'Loading' : formatNumber(summary?.rides.totalRides ?? 0)}
        />
        <StatRow
          color={premiumColors.success}
          icon={{ ios: 'road.lanes', android: 'route', web: 'route' }}
          label="Distance"
          value={loading ? 'Loading' : `${formatNumber(summary?.rides.totalDistanceKm ?? 0)} km`}
        />
        <StatRow color={premiumColors.blue} icon={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} label="Fuel Cost" value="-" />
        <StatRow
          color={premiumColors.purple}
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
      <View style={[styles.rowIcon, { backgroundColor: withAlpha(color, 0.14) }]}>
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

function formatMonth(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'This month';
  }

  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date);
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

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 340,
    padding: 18,
    backgroundColor: 'rgba(17, 21, 28, 0.82)',
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
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  monthPill: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  monthText: {
    ...typography.caption,
    color: premiumColors.textPrimary,
  },
  rows: {
    gap: 11,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  rowLabel: {
    ...typography.body,
    flex: 1,
    color: premiumColors.textSecondary,
  },
  rowValue: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    color: premiumColors.textPrimary,
    textAlign: 'right',
  },
});

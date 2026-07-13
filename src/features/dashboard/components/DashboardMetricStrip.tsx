import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/premium';
import type { StatisticsDashboardSummary } from '@/src/services';
import { iconSizes, premiumColors, spacing, typography } from '@/src/theme';

type DashboardMetricStripProps = {
  readonly summary: StatisticsDashboardSummary | null;
  readonly loading?: boolean;
};

type SymbolName = ComponentProps<typeof SymbolView>['name'];
const HUD_ICON_COLOR = '#7F8A98';
const HUD_FONT = Platform.select({ android: 'sans-serif-condensed', default: undefined });

export function DashboardMetricStrip({ summary, loading = false }: DashboardMetricStripProps) {
  const metrics = getMetrics(summary, loading);

  return (
    <GlassCard style={styles.card}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.metric}>
          <View style={styles.iconRing}>
            <SymbolView name={metric.icon} size={iconSizes.md} tintColor={metric.color} />
          </View>
          <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.label}>
            {metric.label}
          </Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.value}>
            {metric.value}
          </Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.detail}>
            {metric.detail}
          </Text>
        </View>
      ))}
    </GlassCard>
  );
}

function getMetrics(summary: StatisticsDashboardSummary | null, loading: boolean) {
  if (loading) {
    return [
      createMetric('Next Maint.', 'Loading', 'status', { ios: 'wrench.and.screwdriver', android: 'build', web: 'build' }, HUD_ICON_COLOR),
      createMetric('Fuel Level', '-', 'Not tracked', { ios: 'fuelpump', android: 'local_gas_station', web: 'local_gas_station' }, HUD_ICON_COLOR),
      createMetric('Total KM', 'Loading', 'All time', { ios: 'road.lanes', android: 'route', web: 'route' }, HUD_ICON_COLOR),
      createMetric('Ride Time', 'Loading', 'All time', { ios: 'clock', android: 'schedule', web: 'schedule' }, HUD_ICON_COLOR),
    ];
  }

  const motorcycle = summary?.motorcycles.defaultMotorcycle ?? null;
  const maintenance = summary?.maintenance.nextScheduledService ?? null;
  const nextKm =
    maintenance?.nextDueOdometerKm != null && motorcycle?.odometerKm != null
      ? Math.max(0, maintenance.nextDueOdometerKm - motorcycle.odometerKm)
      : null;

  return [
    createMetric(
      'Next Maint.',
      maintenance?.title ?? 'No task',
      nextKm != null ? `${formatNumber(nextKm)} km` : maintenance?.nextDueDate ? formatDateOnly(maintenance.nextDueDate) : 'remaining',
      { ios: 'wrench.and.screwdriver', android: 'build', web: 'build' },
      HUD_ICON_COLOR,
    ),
    createMetric('Fuel Level', '-', 'Not tracked', { ios: 'fuelpump', android: 'local_gas_station', web: 'local_gas_station' }, HUD_ICON_COLOR),
    createMetric('Total KM', `${formatNumber(summary?.motorcycles.totalEstimatedMileageKm ?? 0)} km`, 'All time', { ios: 'road.lanes', android: 'route', web: 'route' }, HUD_ICON_COLOR),
    createMetric('Ride Time', formatDuration(summary?.rides.totalRideTimeSeconds ?? 0), 'All time', { ios: 'clock', android: 'schedule', web: 'schedule' }, HUD_ICON_COLOR),
  ];
}

function createMetric(label: string, value: string, detail: string, icon: SymbolName, color: string) {
  return {
    label,
    value,
    detail,
    color,
    icon,
  };
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

function formatDateOnly(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

const styles = StyleSheet.create({
  card: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    minHeight: 210,
    padding: 10,
    gap: 8,
    borderColor: 'rgba(112, 126, 141, 0.16)',
    borderRadius: 8,
    backgroundColor: 'rgba(9, 14, 21, 0.88)',
  },
  metric: {
    width: '48%',
    minHeight: 90,
    flexGrow: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(103, 127, 144, 0.18)',
    borderRadius: 5,
    backgroundColor: 'rgba(5, 10, 16, 0.72)',
  },
  iconRing: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(119, 141, 157, 0.22)',
    borderRadius: 4,
    backgroundColor: 'rgba(105, 128, 145, 0.06)',
  },
  label: {
    ...typography.label,
    maxWidth: '68%',
    fontFamily: HUD_FONT,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  value: {
    maxWidth: '76%',
    marginTop: 8,
    fontFamily: HUD_FONT,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    color: premiumColors.textPrimary,
    textTransform: 'uppercase',
  },
  detail: {
    ...typography.caption,
    fontFamily: HUD_FONT,
    fontSize: 12,
    color: premiumColors.textSecondary,
  },
});

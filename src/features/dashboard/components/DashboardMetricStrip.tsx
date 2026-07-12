import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/premium';
import type { StatisticsDashboardSummary } from '@/src/services';
import { iconSizes, premiumColors, spacing, typography } from '@/src/theme';

type DashboardMetricStripProps = {
  readonly summary: StatisticsDashboardSummary | null;
  readonly loading?: boolean;
};

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export function DashboardMetricStrip({ summary, loading = false }: DashboardMetricStripProps) {
  const metrics = getMetrics(summary, loading);

  return (
    <GlassCard style={styles.card}>
      {metrics.map((metric, index) => (
        <View key={metric.label} style={styles.metric}>
          <View style={[styles.iconRing, { borderColor: metric.color, backgroundColor: withAlpha(metric.color, 0.1) }]}>
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
          {index < metrics.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </GlassCard>
  );
}

function getMetrics(summary: StatisticsDashboardSummary | null, loading: boolean) {
  if (loading) {
    return [
      createMetric('Next Maint.', 'Loading', 'status', { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' }, premiumColors.primary),
      createMetric('Fuel Level', '-', 'Not tracked', { ios: 'fuelpump.fill', android: 'local_gas_station', web: 'local_gas_station' }, premiumColors.success),
      createMetric('Total KM', 'Loading', 'All time', { ios: 'road.lanes', android: 'route', web: 'route' }, premiumColors.blue),
      createMetric('Ride Time', 'Loading', 'All time', { ios: 'clock.fill', android: 'schedule', web: 'schedule' }, premiumColors.purple),
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
      { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' },
      premiumColors.primary,
    ),
    createMetric('Fuel Level', '-', 'Not tracked', { ios: 'fuelpump.fill', android: 'local_gas_station', web: 'local_gas_station' }, premiumColors.success),
    createMetric('Total KM', `${formatNumber(summary?.motorcycles.totalEstimatedMileageKm ?? 0)} km`, 'All time', { ios: 'road.lanes', android: 'route', web: 'route' }, premiumColors.blue),
    createMetric('Ride Time', formatDuration(summary?.rides.totalRideTimeSeconds ?? 0), 'All time', { ios: 'clock.fill', android: 'schedule', web: 'schedule' }, premiumColors.purple),
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

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    minHeight: 164,
    paddingVertical: 16,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(17, 21, 28, 0.82)',
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 3,
  },
  iconRing: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderRadius: 24,
  },
  label: {
    ...typography.label,
    width: '100%',
    color: premiumColors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  value: {
    width: '100%',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '900',
    color: premiumColors.textPrimary,
    textAlign: 'center',
  },
  detail: {
    width: '100%',
    ...typography.caption,
    fontSize: 12,
    color: premiumColors.textSecondary,
    textAlign: 'center',
  },
  divider: {
    position: 'absolute',
    top: 26,
    right: 0,
    bottom: 26,
    width: StyleSheet.hairlineWidth,
    backgroundColor: premiumColors.borderStrong,
  },
});

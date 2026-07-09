import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/src/components';
import type { StatisticsDashboardSummary } from '@/src/services';
import { palette, radius, spacing, typography } from '@/src/theme';

type StatisticsSummaryProps = {
  readonly summary: StatisticsDashboardSummary | null;
  readonly loading?: boolean;
};

type StatisticChip = {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly accent: 'orange' | 'cyan' | 'success' | 'warning';
};

export function StatisticsSummary({ summary, loading = false }: StatisticsSummaryProps) {
  const chips = summary ? createStatisticChips(summary) : [];

  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Statistics Summary</Text>
        <Text style={styles.sectionSubtitle}>Live local snapshot</Text>
      </View>
      {loading ? (
        <StatisticsSkeleton />
      ) : chips.length > 0 ? (
        <View style={styles.grid}>
          {chips.map((chip, index) => (
            <AnimatedStatisticChip key={chip.label} chip={chip} index={index} />
          ))}
        </View>
      ) : (
        <EmptyState
          title="No statistics yet"
          description="Finish a ride, add maintenance, or add a motorcycle to unlock dashboard stats."
        />
      )}
    </View>
  );
}

function createStatisticChips(summary: StatisticsDashboardSummary): StatisticChip[] {
  const chips: StatisticChip[] = [];

  if (summary.rides.hasData) {
    chips.push({
      label: 'Rides',
      value: String(summary.rides.totalRides),
      detail: `${formatNumber(summary.rides.totalDistanceKm)} km tracked`,
      accent: 'cyan',
    });
    chips.push({
      label: 'Ride Time',
      value: formatDuration(summary.rides.totalRideTimeSeconds),
      detail: `${formatNumber(summary.rides.averageSpeedKmh)} km/h avg`,
      accent: 'orange',
    });
  }

  if (summary.maintenance.hasData) {
    chips.push({
      label: 'Service',
      value: String(summary.maintenance.upcomingCount),
      detail: summary.maintenance.nextScheduledService?.title ?? 'Upcoming tasks',
      accent: summary.maintenance.overdueCount > 0 ? 'warning' : 'success',
    });
  }

  if (summary.motorcycles.hasData) {
    chips.push({
      label: 'Garage',
      value: String(summary.motorcycles.totalMotorcycles),
      detail: `${formatNumber(summary.motorcycles.totalEstimatedMileageKm)} km odometer`,
      accent: 'success',
    });
  }

  return chips;
}

function AnimatedStatisticChip({ chip, index }: { readonly chip: StatisticChip; readonly index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const accentColor = accentColors[chip.accent];

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay: 120 + index * 70,
      friction: 8,
      tension: 52,
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        styles.statChip,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={[styles.statDot, { backgroundColor: accentColor }]} />
      <Text style={styles.statLabel}>{chip.label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>
        {chip.value}
      </Text>
      <Text numberOfLines={1} style={styles.statDetail}>
        {chip.detail}
      </Text>
    </Animated.View>
  );
}

function StatisticsSkeleton() {
  return (
    <View style={styles.grid}>
      {['Ride', 'Service'].map((label) => (
        <View key={label} style={[styles.statChip, styles.skeletonChip]}>
          <View style={styles.skeletonDot} />
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.skeletonValue}>Loading</Text>
          <Text style={styles.statDetail}>Reading local data</Text>
        </View>
      ))}
    </View>
  );
}

function formatDuration(totalSeconds: number) {
  const roundedSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}

const accentColors = {
  orange: palette.accentOrange,
  cyan: '#E5E7EB',
  success: palette.success,
  warning: palette.warning,
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statChip: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 0,
    minHeight: 116,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 6,
  },
  skeletonChip: {
    opacity: 0.72,
  },
  statDot: {
    width: 8,
    height: 8,
    marginBottom: spacing.lg,
    borderRadius: 4,
  },
  skeletonDot: {
    width: 8,
    height: 8,
    marginBottom: spacing.lg,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  statLabel: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.56)',
    textTransform: 'uppercase',
  },
  statValue: {
    ...typography.subheading,
    marginTop: spacing.sm,
    color: palette.text,
    fontSize: 24,
    lineHeight: 29,
  },
  skeletonValue: {
    ...typography.subheading,
    marginTop: spacing.sm,
    color: 'rgba(248, 250, 252, 0.72)',
    fontSize: 24,
    lineHeight: 29,
  },
  statDetail: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
});

import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/premium';
import type { Ride } from '@/src/domain/ride';
import { iconSizes, motion, opacity, premiumColors, radius, spacing, typography } from '@/src/theme';

type RecentRideCardProps = {
  readonly ride: Ride | null;
  readonly loading?: boolean;
  readonly onPress?: () => void;
};

export function RecentRideCard({ ride, loading = false, onPress }: RecentRideCardProps) {
  const hasRide = Boolean(ride);

  return (
    <Pressable
      accessibilityLabel={hasRide ? 'Open recent ride details' : 'Recent ride summary'}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Recent Ride</Text>
            <View style={styles.dateRow}>
              <SymbolView name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} size={iconSizes.xs} tintColor={premiumColors.textSecondary} />
              <Text numberOfLines={1} style={styles.dateText}>
                {loading ? 'Loading ride' : ride ? formatDateTime(ride.startTime) : 'No rides recorded yet'}
              </Text>
            </View>
          </View>
          <View style={styles.shareButton}>
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} size={iconSizes.sm} tintColor={premiumColors.textPrimary} />
          </View>
        </View>

        <RoutePreview hasRoute={Boolean(ride?.route.length)} />

        <View style={styles.metrics}>
          <RideMetric label="Distance" value={loading ? '-' : ride ? `${formatNumber(ride.distanceKm, 1)} km` : '0 km'} />
          <RideMetric label="Duration" value={loading ? '-' : ride ? formatDuration(ride.durationSeconds) : '0m'} />
          <RideMetric label="Avg. Speed" value={loading ? '-' : ride ? `${formatNumber(ride.averageSpeedKmh, 0)} km/h` : '0 km/h'} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{hasRide ? 'View Ride Details' : 'Start your first ride'}</Text>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={iconSizes.sm} tintColor={premiumColors.primaryBright} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

function RoutePreview({ hasRoute }: { readonly hasRoute: boolean }) {
  return (
    <View style={styles.routePreview}>
      <View style={styles.mapGrid} />
      <View style={[styles.routeSegment, styles.routeSegmentOne]} />
      <View style={[styles.routeSegment, styles.routeSegmentTwo]} />
      <View style={[styles.routeSegment, styles.routeSegmentThree]} />
      <View style={styles.startPin} />
      <View style={styles.endPin}>
        <View style={styles.endPinInner} />
      </View>
      {!hasRoute ? <Text style={styles.routePlaceholder}>Route preview</Text> : null}
    </View>
  );
}

type RideMetricProps = {
  readonly label: string;
  readonly value: string;
};

function RideMetric({ label, value }: RideMetricProps) {
  return (
    <View style={styles.metric}>
      <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.metricLabel}>
        {label}
      </Text>
    </View>
  );
}

function formatNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
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

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 340,
    padding: 0,
    backgroundColor: 'rgba(17, 21, 28, 0.82)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: 18,
    paddingBottom: 12,
  },
  eyebrow: {
    ...typography.label,
    marginBottom: spacing.md,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    ...typography.caption,
    color: premiumColors.textSecondary,
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  routePreview: {
    height: 108,
    overflow: 'hidden',
    marginHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#0A1114',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.5,
    backgroundColor: 'rgba(37, 211, 102, 0.08)',
  },
  routeSegment: {
    position: 'absolute',
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: premiumColors.primaryBright,
  },
  routeSegmentOne: {
    top: 68,
    left: 42,
    width: 96,
    transform: [{ rotate: '-18deg' }],
  },
  routeSegmentTwo: {
    top: 59,
    left: 124,
    width: 86,
    transform: [{ rotate: '20deg' }],
  },
  routeSegmentThree: {
    top: 78,
    right: 34,
    width: 116,
    transform: [{ rotate: '-11deg' }],
  },
  startPin: {
    position: 'absolute',
    bottom: 31,
    left: 35,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#0A1114',
    borderRadius: 12,
    backgroundColor: premiumColors.success,
  },
  endPin: {
    position: 'absolute',
    right: 28,
    bottom: 36,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: premiumColors.primaryBright,
  },
  endPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: premiumColors.textPrimary,
  },
  routePlaceholder: {
    ...typography.label,
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    color: premiumColors.textTertiary,
    textTransform: 'uppercase',
  },
  metrics: {
    flexDirection: 'row',
    padding: 18,
    gap: 10,
  },
  metric: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: premiumColors.textPrimary,
  },
  metricLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
  },
  footer: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: premiumColors.border,
  },
  footerText: {
    ...typography.button,
    color: premiumColors.primaryBright,
  },
  pressed: {
    opacity: opacity.pressed,
    transform: [{ scale: motion.scale.pressed }],
  },
});

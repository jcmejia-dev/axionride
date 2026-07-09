import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, GlassCard, Label } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { DashboardRide } from '../types';

type RecentRideCardProps = {
  ride: DashboardRide;
};

export function RecentRideCard({ ride }: RecentRideCardProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Recent Ride</Text>
        <Text style={styles.sectionSubtitle}>{ride.when}</Text>
      </View>
      <Pressable onPress={() => undefined} style={({ pressed }) => [pressed ? styles.pressed : null]}>
        <GlassCard style={styles.card}>
          <View style={styles.routeLine} />
          <View style={styles.routeIcon}>
            <SymbolView name={{ ios: 'road.lanes', android: 'route', web: 'route' }} tintColor={palette.text} size={25} />
          </View>
          <View style={styles.metrics}>
            <RideMetric label="Distance" value={ride.distance} />
            <RideMetric label="Time" value={ride.duration} />
            <RideMetric label="Avg Speed" value={ride.averageSpeed} />
          </View>
        </GlassCard>
      </Pressable>
    </View>
  );
}

type RideMetricProps = {
  label: string;
  value: string;
};

function RideMetric({ label, value }: RideMetricProps) {
  return (
    <View style={styles.metric}>
      <Label style={styles.metricLabel}>{label}</Label>
      <Body style={styles.metricValue}>{value}</Body>
    </View>
  );
}

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
  card: {
    minHeight: 156,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(12, 13, 15, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 25,
    elevation: 7,
  },
  routeLine: {
    position: 'absolute',
    right: 24,
    left: 84,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  routeIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  metrics: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  metric: {
    minWidth: 78,
    gap: spacing.xs,
  },
  metricLabel: {
    color: 'rgba(248, 250, 252, 0.56)',
  },
  metricValue: {
    ...typography.subheading,
    color: palette.text,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});

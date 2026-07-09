import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { RecentRide } from '../types';

type RecentRideListProps = {
  rides: readonly RecentRide[];
};

export function RecentRideList({ rides }: RecentRideListProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Recent Rides</Text>
        <Text style={styles.sectionSubtitle}>Mock history for future ride tracking</Text>
      </View>
      <View style={styles.list}>
        {rides.map((ride) => (
          <RideCard key={ride.id} ride={ride} />
        ))}
      </View>
    </View>
  );
}

type RideCardProps = {
  ride: RecentRide;
};

function RideCard({ ride }: RideCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView name={{ ios: 'road.lanes', android: 'route', web: 'route' }} tintColor={palette.text} size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.rideTitle}>{ride.title}</Text>
        <Text style={styles.rideDate}>{ride.date}</Text>
        <View style={styles.metrics}>
          <Text style={styles.metric}>{ride.distance}</Text>
          <Text style={styles.metric}>{ride.duration}</Text>
          <Text style={styles.metric}>{ride.averageSpeed}</Text>
        </View>
      </View>
    </GlassCard>
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
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
  },
  iconShell: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  rideTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  rideDate: {
    ...typography.caption,
    color: 'rgba(248, 250, 252, 0.56)',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metric: {
    ...typography.caption,
    color: 'rgba(248, 250, 252, 0.78)',
    fontWeight: '800',
  },
});

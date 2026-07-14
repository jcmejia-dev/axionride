import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ride } from '@/src/domain/ride';
import { palette, spacing, typography } from '@/src/theme';

import { groupRideHistory } from '../rideHistory';
import { RideHistoryCard } from './RideHistoryCard';

type Props = {
  readonly rides: readonly Ride[];
  readonly onOpenRide: (rideId: string) => void;
  readonly onViewAll: () => void;
};

export function RecentRideList({ rides, onOpenRide, onViewAll }: Props) {
  const sections = groupRideHistory(rides.slice(0, 4));
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.sectionTitle}>Ride History</Text>
        <Pressable accessibilityRole="button" onPress={onViewAll} hitSlop={10}><Text style={styles.viewAll}>VIEW ALL</Text></Pressable>
      </View>
      {sections.map((section) => (
        <View key={section.title} style={styles.group}>
          <Text style={styles.groupTitle}>{section.title}</Text>
          {section.data.map((ride) => <RideHistoryCard key={ride.id} ride={ride} onPress={() => onOpenRide(ride.id)} />)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.subtitle, color: palette.text, fontWeight: '900' },
  viewAll: { ...typography.label, color: palette.accentOrange, fontWeight: '900', letterSpacing: .8 },
  group: { gap: spacing.sm },
  groupTitle: { ...typography.label, color: palette.textMuted, fontWeight: '900', letterSpacing: .8, textTransform: 'uppercase' },
});

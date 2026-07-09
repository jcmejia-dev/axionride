import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { MaintenanceTimelineItem } from '../types';

type MaintenanceTimelineProps = {
  items: readonly MaintenanceTimelineItem[];
};

export function MaintenanceTimeline({ items }: MaintenanceTimelineProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Maintenance Timeline</Text>
        <Text style={styles.sectionSubtitle}>Recent service history</Text>
      </View>
      <GlassCard style={styles.card}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.rail}>
              <View style={styles.node} />
              {index < items.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.copy}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemDate}>{item.completedAt}</Text>
            </View>
          </View>
        ))}
      </GlassCard>
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
    gap: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    width: 18,
    alignItems: 'center',
  },
  node: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.accentOrange,
  },
  line: {
    flex: 1,
    width: 1,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  copy: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  itemTitle: {
    ...typography.body,
    color: palette.text,
    fontWeight: '800',
  },
  itemDescription: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.62)',
  },
  itemDate: {
    ...typography.label,
    marginTop: spacing.sm,
    color: 'rgba(248, 250, 252, 0.42)',
    textTransform: 'uppercase',
  },
});

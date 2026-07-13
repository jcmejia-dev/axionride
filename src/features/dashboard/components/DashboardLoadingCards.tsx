import { StyleSheet, View } from 'react-native';

import { GlassCard, SkeletonBlock } from '@/src/components/premium';
import { spacing } from '@/src/theme';

export function DashboardLoadingCards({ stacked }: { readonly stacked: boolean }) {
  return (
    <View accessibilityLabel="Loading dashboard data" accessibilityRole="progressbar" style={styles.stack}>
      <GlassCard style={styles.hero}>
        <SkeletonBlock height={18} width="34%" />
        <SkeletonBlock height={34} width="66%" />
        <SkeletonBlock height={16} width="48%" />
      </GlassCard>
      <GlassCard style={styles.metrics}>
        {[0, 1, 2, 3].map((index) => <SkeletonBlock key={index} height={72} width="22%" />)}
      </GlassCard>
      <View style={[styles.grid, stacked && styles.gridStacked]}>
        <GlassCard style={styles.detailCard}>
          <SkeletonBlock height={16} width="38%" />
          <SkeletonBlock height={168} />
          <SkeletonBlock height={24} width="72%" />
        </GlassCard>
        <GlassCard style={styles.detailCard}>
          <SkeletonBlock height={16} width="44%" />
          <SkeletonBlock height={48} />
          <SkeletonBlock height={48} />
          <SkeletonBlock height={48} />
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  hero: { minHeight: 220, justifyContent: 'flex-end', gap: spacing.md, padding: spacing.xl },
  metrics: { minHeight: 132, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  grid: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  gridStacked: { flexDirection: 'column' },
  detailCard: { flex: 1, minHeight: 300, gap: spacing.lg, padding: spacing.lg },
});

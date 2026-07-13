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
        {[0, 1, 2, 3].map((index) => <SkeletonBlock key={index} height={80} width="47%" />)}
      </GlassCard>
      <View style={[styles.grid, stacked && styles.gridStacked]}>
        <GlassCard style={styles.detailCard}>
          <SkeletonBlock height={16} width="38%" />
          <SkeletonBlock height={140} width="39%" />
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
  stack: { gap: 20 },
  hero: { minHeight: 164, justifyContent: 'flex-end', gap: spacing.md, padding: spacing.lg, borderRadius: 8, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,14,20,0.86)' },
  metrics: { minHeight: 194, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 10, borderRadius: 8, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,14,20,0.86)' },
  grid: { flexDirection: 'row', alignItems: 'stretch', gap: 16 },
  gridStacked: { flexDirection: 'column' },
  detailCard: { flex: 1, minHeight: 224, gap: spacing.lg, padding: spacing.lg, borderRadius: 8, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,14,20,0.86)' },
});

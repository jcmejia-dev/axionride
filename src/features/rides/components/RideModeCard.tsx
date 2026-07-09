import { GlassCard } from '@/src/components';
import { spacing } from '@/src/theme';
import { StyleSheet } from 'react-native';

import { SpeedometerPreview } from './SpeedometerPreview';

export function RideModeCard() {
  return (
    <GlassCard style={styles.card}>
      <SpeedometerPreview />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#08090B',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: spacing.xl,
  },
});

import { GlassCard } from '@/src/components';
import { spacing } from '@/src/theme';
import { StyleSheet } from 'react-native';

import { SpeedometerPreview } from './SpeedometerPreview';

type RideModeCardProps = {
  readonly speedKmh: number;
  readonly status: 'idle' | 'active' | 'paused' | 'completed';
  readonly permissionLabel: string;
  readonly gpsActive: boolean;
  readonly elapsedTime: string;
  readonly disabled?: boolean;
  readonly onStart: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onFinish: () => void;
  readonly onCancel: () => void;
};

export function RideModeCard(props: RideModeCardProps) {
  return (
    <GlassCard style={styles.card}>
      <SpeedometerPreview {...props} />
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

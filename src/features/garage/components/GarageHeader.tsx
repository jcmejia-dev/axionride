import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

type GarageHeaderProps = {
  motorcycleCount: number;
};

export function GarageHeader({ motorcycleCount }: GarageHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>My Garage</Text>
      <Text style={styles.title}>Personal motorcycle bay</Text>
      <Text style={styles.subtitle}>
        {motorcycleCount} {motorcycleCount === 1 ? 'machine' : 'machines'} ready for rides, service, and stories.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  kicker: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.58)',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.display,
    color: palette.text,
  },
  subtitle: {
    ...typography.body,
    maxWidth: 340,
    color: 'rgba(248, 250, 252, 0.68)',
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

export function RideHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Cockpit</Text>
      <Text style={styles.title}>Ride Mode</Text>
      <Text style={styles.subtitle}>Track every kilometer.</Text>
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
    color: 'rgba(248, 250, 252, 0.68)',
  },
});

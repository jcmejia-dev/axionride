import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

export function EmptyMaintenanceState() {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView name={{ ios: 'checklist.checked', android: 'checklist', web: 'checklist' }} tintColor={palette.text} size={34} />
      </View>
      <Text style={styles.title}>No maintenance scheduled</Text>
      <Text style={styles.description}>Future service reminders and completed work will appear here.</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
  },
  iconShell: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    ...typography.title,
    color: palette.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    maxWidth: 290,
    color: 'rgba(248, 250, 252, 0.66)',
    textAlign: 'center',
  },
});

import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { MaintenanceTask } from '../types';

type MaintenanceTaskCardProps = {
  task: MaintenanceTask;
};

export function MaintenanceTaskCard({ task }: MaintenanceTaskCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView name={{ ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' }} tintColor={palette.text} size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.subtitle}>{task.remainingDistance}</Text>
      </View>
      <Badge variant={task.status === 'Due Soon' ? 'warning' : 'success'}>{task.status}</Badge>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
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
  },
  title: {
    ...typography.subtitle,
    color: palette.text,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
});

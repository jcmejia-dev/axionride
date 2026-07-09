import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { MaintenanceTask } from '../types';

type MaintenanceTaskCardProps = {
  task: MaintenanceTask;
  readonly onComplete?: () => void;
};

export function MaintenanceTaskCard({ task, onComplete }: MaintenanceTaskCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView name={{ ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' }} tintColor={palette.text} size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.subtitle}>{task.remainingDistance}</Text>
      </View>
      <View style={styles.trailing}>
        <Badge variant={getBadgeVariant(task.status)}>{task.status}</Badge>
        {onComplete ? (
          <Pressable
            accessibilityRole="button"
            onPress={onComplete}
            style={({ pressed }) => [styles.completeButton, pressed ? styles.pressed : null]}>
            <Text style={styles.completeText}>Complete</Text>
          </Pressable>
        ) : null}
      </View>
    </GlassCard>
  );
}

function getBadgeVariant(status: MaintenanceTask['status']) {
  if (status === 'Overdue') {
    return 'danger';
  }

  if (status === 'Due Soon') {
    return 'warning';
  }

  return 'success';
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
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  completeButton: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  completeText: {
    ...typography.label,
    color: palette.text,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});

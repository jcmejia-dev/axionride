import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/src/theme';

const quickActions = [
  {
    label: 'Add Maintenance',
    icon: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    primary: true,
  },
  {
    label: 'Log Service',
    icon: { ios: 'checkmark.seal.fill', android: 'task_alt', web: 'task_alt' },
    primary: false,
  },
  {
    label: 'View History',
    icon: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
    primary: false,
  },
] as const;

type MaintenanceQuickActionsProps = {
  readonly onAddMaintenance: () => void;
  readonly onLogService: () => void;
  readonly onViewHistory: () => void;
};

export function MaintenanceQuickActions({
  onAddMaintenance,
  onLogService,
  onViewHistory,
}: MaintenanceQuickActionsProps) {
  const handlers = [onAddMaintenance, onLogService, onViewHistory];

  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.title}>Quick Actions</Text>
        <Text style={styles.subtitle}>Manage local service records</Text>
      </View>
      <View style={styles.actions}>
        {quickActions.map((action, index) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            onPress={handlers[index]}
            style={({ pressed }) => [
              styles.action,
              action.primary ? styles.primaryAction : null,
              pressed ? styles.pressed : null,
            ]}>
            <View style={[styles.iconShell, action.primary ? styles.primaryIconShell : null]}>
              <SymbolView
                name={action.icon}
                tintColor={action.primary ? palette.darkBackground : palette.text}
                size={20}
              />
            </View>
            <Text style={[styles.actionText, action.primary ? styles.primaryText : null]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 6,
  },
  primaryAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  iconShell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  primaryIconShell: {
    backgroundColor: 'rgba(7, 10, 15, 0.08)',
  },
  actionText: {
    ...typography.button,
    color: palette.text,
    textAlign: 'center',
  },
  primaryText: {
    color: palette.darkBackground,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ translateY: 2 }, { scale: 0.98 }],
  },
});

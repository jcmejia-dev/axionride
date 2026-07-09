import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/src/theme';

import type { DashboardQuickAction } from '../types';

type QuickActionsProps = {
  actions: DashboardQuickAction[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.sectionSubtitle}>Mock actions for core riding workflows</Text>
      </View>
      <View style={styles.actions}>
        {actions.map((action, index) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            onPress={() => undefined}
            style={({ pressed }) => [
              styles.action,
              index === 0 ? styles.primaryAction : null,
              pressed ? styles.pressed : null,
            ]}>
            <View style={[styles.iconShell, index === 0 ? styles.primaryIconShell : null]}>
              <SymbolView name={action.icon} tintColor={index === 0 ? palette.darkBackground : palette.text} size={20} />
            </View>
            <Text style={[styles.actionText, index === 0 ? styles.primaryText : null]}>{action.label}</Text>
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
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  sectionSubtitle: {
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
    minHeight: 118,
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

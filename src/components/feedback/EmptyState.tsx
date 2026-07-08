import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { radius, semanticColors, spacing, typography } from '@/src/theme';

type EmptyStateProps = ViewProps & {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

/** Reusable empty state for first-run and no-data views. */
export function EmptyState({ title, description, icon, action, style, ...props }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  icon: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
  },
});

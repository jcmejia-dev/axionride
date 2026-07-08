import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { semanticColors, spacing, typography } from '@/src/theme';

type SectionHeaderProps = ViewProps & {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

/** Consistent section header with optional subtitle and trailing action. */
export function SectionHeader({ title, subtitle, action, style, ...props }: SectionHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];

  return (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  action: {
    flexShrink: 0,
  },
});

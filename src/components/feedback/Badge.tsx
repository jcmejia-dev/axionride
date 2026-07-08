import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { palette, radius, semanticColors, spacing, typography } from '@/src/theme';

type BadgeVariant = 'neutral' | 'orange' | 'cyan' | 'success' | 'warning' | 'danger';

type BadgeProps = ViewProps & {
  children: ReactNode;
  variant?: BadgeVariant;
};

/** Compact status badge for labels, sync states, and motorcycle metadata. */
export function Badge({ children, variant = 'neutral', style, ...props }: BadgeProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];
  const variantStyle = badgeVariants[variant](colors);

  return (
    <View style={[styles.badge, variantStyle.container, style]} {...props}>
      <Text style={[styles.text, variantStyle.text]}>{children}</Text>
    </View>
  );
}

const badgeVariants = {
  neutral: (colors: typeof semanticColors.dark) => ({
    container: { backgroundColor: colors.surfaceStrong, borderColor: colors.border },
    text: { color: colors.text },
  }),
  orange: () => ({
    container: { backgroundColor: 'rgba(249, 115, 22, 0.14)', borderColor: 'rgba(249, 115, 22, 0.35)' },
    text: { color: palette.accentOrange },
  }),
  cyan: () => ({
    container: { backgroundColor: 'rgba(34, 211, 238, 0.12)', borderColor: 'rgba(34, 211, 238, 0.32)' },
    text: { color: palette.accentBlue },
  }),
  success: () => ({
    container: { backgroundColor: 'rgba(34, 197, 94, 0.14)', borderColor: 'rgba(34, 197, 94, 0.32)' },
    text: { color: palette.success },
  }),
  warning: () => ({
    container: { backgroundColor: 'rgba(245, 158, 11, 0.14)', borderColor: 'rgba(245, 158, 11, 0.32)' },
    text: { color: palette.warning },
  }),
  danger: () => ({
    container: { backgroundColor: 'rgba(239, 68, 68, 0.14)', borderColor: 'rgba(239, 68, 68, 0.32)' },
    text: { color: palette.danger },
  }),
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  text: {
    ...typography.label,
    textTransform: 'uppercase',
  },
});

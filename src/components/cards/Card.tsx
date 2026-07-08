import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { elevation, palette, radius, semanticColors, spacing, typography } from '@/src/theme';

type GlassCardProps = ViewProps & {
  children: ReactNode;
};

type StatCardProps = ViewProps & {
  label: string;
  value: string;
  detail?: string;
  accent?: 'orange' | 'cyan' | 'success' | 'warning' | 'danger';
};

/** Glassmorphism-inspired container for premium grouped content. */
export function GlassCard({ children, style, ...props }: GlassCardProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];

  return (
    <View
      style={[
        styles.glassCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        colorScheme === 'dark' ? elevation.soft : elevation.none,
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}

/** Compact metric card for future dashboard and motorcycle stats. */
export function StatCard({ label, value, detail, accent = 'orange', style, ...props }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];
  const accentColor = statAccentColors[accent];

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        colorScheme === 'dark' ? elevation.soft : elevation.none,
        style,
      ]}
      {...props}>
      <View style={[styles.statRail, { backgroundColor: accentColor }]} />
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {detail ? <Text style={[styles.statDetail, { color: colors.textMuted }]}>{detail}</Text> : null}
    </View>
  );
}

const statAccentColors = {
  orange: palette.accentOrange,
  cyan: palette.accentBlue,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
};

const styles = StyleSheet.create({
  glassCard: {
    padding: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  statCard: {
    minWidth: 144,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  statRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
  statLabel: {
    ...typography.label,
    textTransform: 'uppercase',
  },
  statValue: {
    ...typography.title,
    marginTop: spacing.sm,
  },
  statDetail: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});

import { ActivityIndicator, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { palette, semanticColors, spacing, typography } from '@/src/theme';

type LoadingSpinnerProps = ViewProps & {
  label?: string;
};

/** Centered loading indicator for lightweight in-app loading states. */
export function LoadingSpinner({ label, style, ...props }: LoadingSpinnerProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];

  return (
    <View style={[styles.container, style]} {...props}>
      <ActivityIndicator color={palette.accentOrange} />
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    textAlign: 'center',
  },
});

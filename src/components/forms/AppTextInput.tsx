import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { radius, semanticColors, spacing, typography } from '@/src/theme';

type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

/** Branded text input with label, error, and dark-mode aware styling. */
export function AppTextInput({ label, error, style, ...props }: AppTextInputProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];

  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? semanticColors.dark.dangerSoft : colors.border,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
    ...typography.body,
  },
  error: {
    ...typography.caption,
    color: '#EF4444',
  },
});

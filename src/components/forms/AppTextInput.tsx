import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { radius, semanticColors, spacing, typography } from '@/src/theme';

type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  passwordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
};

/** Branded text input with label, error, and dark-mode aware styling. */
export function AppTextInput({
  label,
  error,
  helperText,
  showPasswordToggle = false,
  passwordVisible = false,
  onTogglePasswordVisibility,
  style,
  ...props
}: AppTextInputProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];
  const supportingText = error ?? helperText;

  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: colors.surface,
            borderColor: error ? '#EF4444' : colors.border,
          },
        ]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.text,
            },
            showPasswordToggle ? styles.inputWithToggle : null,
            style,
          ]}
          {...props}
          secureTextEntry={showPasswordToggle ? !passwordVisible : props.secureTextEntry}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            hitSlop={spacing.sm}
            onPress={onTogglePasswordVisibility}
            style={styles.toggle}>
            <Text style={styles.toggleText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {supportingText ? (
        <Text style={[styles.supportingText, error ? styles.error : { color: colors.textMuted }]}>
          {supportingText}
        </Text>
      ) : null}
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
  inputShell: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  input: {
    minHeight: 52,
    flex: 1,
    paddingHorizontal: spacing.lg,
    ...typography.body,
  },
  inputWithToggle: {
    paddingRight: spacing.sm,
  },
  toggle: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  toggleText: {
    ...typography.label,
    color: '#22D3EE',
    textTransform: 'uppercase',
  },
  supportingText: {
    ...typography.caption,
  },
  error: {
    color: '#EF4444',
  },
});

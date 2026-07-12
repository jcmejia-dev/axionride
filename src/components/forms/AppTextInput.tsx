import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
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
  leadingIcon?: ReactNode;
};

/** Branded text input with label, error, and dark-mode aware styling. */
export function AppTextInput({
  label,
  error,
  helperText,
  showPasswordToggle = false,
  passwordVisible = false,
  onTogglePasswordVisibility,
  leadingIcon,
  style,
  ...props
}: AppTextInputProps) {
  useColorScheme();
  const colors = semanticColors.dark;
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
        {leadingIcon ? <View style={styles.leadingIcon}>{leadingIcon}</View> : null}
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
            <SymbolView
              name={{ ios: passwordVisible ? 'eye.slash.fill' : 'eye.fill', android: passwordVisible ? 'visibility_off' : 'visibility', web: 'visibility' }}
              tintColor="rgba(248,250,252,0.62)"
              size={22}
            />
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
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.xl,
    backgroundColor: '#11151B',
  },
  input: {
    minHeight: 58,
    flex: 1,
    paddingHorizontal: spacing.lg,
    ...typography.body,
  },
  leadingIcon: {
    width: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  inputWithToggle: {
    paddingRight: spacing.sm,
  },
  toggle: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  supportingText: {
    ...typography.caption,
  },
  error: {
    color: '#EF4444',
  },
});

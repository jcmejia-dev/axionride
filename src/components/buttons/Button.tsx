import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { palette, radius, semanticColors, spacing, typography } from '@/src/theme';

type ButtonProps = PressableProps & {
  title: string;
  icon?: ReactNode;
  loading?: boolean;
};

function BaseButton({
  title,
  icon,
  loading = false,
  disabled = false,
  style,
  variant,
  ...props
}: ButtonProps & { variant: 'primary' | 'secondary' | 'ghost' }) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];
  const isDisabled = disabled || loading;
  const variantStyle = getVariantStyle(variant, colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        variantStyle.container,
        state.pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {loading ? <ActivityIndicator color={variantStyle.text.color} /> : icon}
      <Text style={[styles.label, variantStyle.text]}>{title}</Text>
    </Pressable>
  );
}

/** High-emphasis action button using the AxionRide burnt orange accent. */
export function PrimaryButton(props: ButtonProps) {
  return <BaseButton {...props} variant="primary" />;
}

/** Medium-emphasis action button for secondary decisions. */
export function SecondaryButton(props: ButtonProps) {
  return <BaseButton {...props} variant="secondary" />;
}

/** Low-emphasis text-like action button for quiet commands. */
export function GhostButton(props: ButtonProps) {
  return <BaseButton {...props} variant="ghost" />;
}

function getVariantStyle(variant: 'primary' | 'secondary' | 'ghost', colors: typeof semanticColors.dark) {
  const variants = {
    primary: {
      container: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      text: {
        color: colors.primaryText,
      },
    },
    secondary: {
      container: {
        backgroundColor: colors.surfaceStrong,
        borderColor: colors.border,
      },
      text: {
        color: colors.text,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      text: {
        color: palette.accentBlue,
      },
    },
  };

  return variants[variant];
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  label: {
    ...typography.button,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
});

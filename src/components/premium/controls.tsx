import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type ViewProps } from 'react-native';

import { elevation, iconSizes, motion, opacity, premiumColors, radius, spacing, touchSizes, typography } from '@/src/theme';

type PremiumButtonProps = PressableProps & {
  readonly title: string;
  readonly icon?: ReactNode;
  readonly loading?: boolean;
  readonly variant?: 'primary' | 'secondary' | 'ghost';
};

export function PremiumButton({
  title,
  icon,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  ...props
}: PremiumButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = premiumButtonVariants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        variantStyle.container,
        variant === 'primary' ? elevation.glowOrange : null,
        state.pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {loading ? <ActivityIndicator color={variantStyle.text.color} /> : icon}
      <Text style={[styles.buttonText, variantStyle.text]}>{title}</Text>
    </Pressable>
  );
}

type IconButtonProps = Omit<PressableProps, 'children'> & {
  readonly icon: ReactNode;
  readonly accessibilityLabel: string;
  readonly size?: 'default' | 'large';
  readonly active?: boolean;
};

export function IconButton({ icon, accessibilityLabel, size = 'default', active = false, disabled, style, ...props }: IconButtonProps) {
  const buttonSize = size === 'large' ? touchSizes.large : touchSizes.default;
  const isDisabled = Boolean(disabled);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected: active }}
      disabled={isDisabled}
      hitSlop={spacing.sm}
      style={(state) => [
        styles.iconButton,
        {
          height: buttonSize,
          width: buttonSize,
        },
        active ? styles.iconButtonActive : null,
        state.pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {icon}
    </Pressable>
  );
}

type MetricChipProps = ViewProps & {
  readonly label: string;
  readonly value: string;
  readonly icon?: ReactNode;
  readonly tone?: 'orange' | 'success' | 'warning' | 'danger' | 'blue' | 'purple';
};

export function MetricChip({ label, value, icon, tone = 'orange', style, ...props }: MetricChipProps) {
  const toneColor = toneColors[tone];

  return (
    <View style={[styles.metricChip, style]} {...props}>
      {icon ? <View style={[styles.metricIcon, { backgroundColor: withAlpha(toneColor, 0.14) }]}>{icon}</View> : null}
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

type StatusBadgeProps = ViewProps & {
  readonly label: string;
  readonly tone?: MetricChipProps['tone'] | 'neutral';
  readonly dot?: boolean;
};

export function StatusBadge({ label, tone = 'neutral', dot = false, style, ...props }: StatusBadgeProps) {
  const toneColor = tone === 'neutral' ? premiumColors.textSecondary : toneColors[tone];

  return (
    <View style={[styles.statusBadge, { borderColor: withAlpha(toneColor, 0.32), backgroundColor: withAlpha(toneColor, 0.12) }, style]} {...props}>
      {dot ? <View style={[styles.statusDot, { backgroundColor: toneColor }]} /> : null}
      <Text style={[styles.statusText, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

const toneColors = {
  orange: premiumColors.primary,
  success: premiumColors.success,
  warning: premiumColors.warning,
  danger: premiumColors.danger,
  blue: premiumColors.blue,
  purple: premiumColors.purple,
};

const premiumButtonVariants = {
  primary: {
    container: {
      backgroundColor: premiumColors.primary,
      borderColor: premiumColors.primaryBright,
    },
    text: {
      color: '#FFFFFF',
    },
  },
  secondary: {
    container: {
      backgroundColor: premiumColors.surfaceElevated,
      borderColor: premiumColors.borderStrong,
    },
    text: {
      color: premiumColors.textPrimary,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    text: {
      color: premiumColors.primaryBright,
    },
  },
};

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchSizes.comfortable,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  buttonText: {
    ...typography.button,
    fontSize: 17,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconButtonActive: {
    borderColor: premiumColors.borderOrange,
    backgroundColor: premiumColors.primaryMuted,
  },
  pressed: {
    opacity: opacity.pressed,
    transform: [{ scale: motion.scale.pressed }],
  },
  disabled: {
    opacity: opacity.disabled,
  },
  metricChip: {
    minHeight: touchSizes.default,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metricIcon: {
    width: touchSizes.default,
    height: touchSizes.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  metricCopy: {
    minWidth: 0,
  },
  metricLabel: {
    ...typography.label,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  metricValue: {
    ...typography.subtitle,
    marginTop: spacing.xs,
    color: premiumColors.textPrimary,
  },
  statusBadge: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: iconSizes.xs - 6,
    height: iconSizes.xs - 6,
    borderRadius: iconSizes.xs,
  },
  statusText: {
    ...typography.label,
    textTransform: 'uppercase',
  },
});

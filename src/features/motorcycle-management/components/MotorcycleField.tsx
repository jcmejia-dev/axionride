import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type ViewStyle,
  View,
} from 'react-native';

import { motion, premiumColors, radius, spacing, typography } from '@/src/theme';

type MotorcycleFieldProps = TextInputProps & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  counter?: string;
  containerStyle?: ViewStyle;
};

export function MotorcycleField({
  label,
  value,
  onChangeText,
  error,
  helperText,
  required = false,
  counter,
  containerStyle,
  multiline = false,
  style,
  ...props
}: MotorcycleFieldProps) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useRef(new Animated.Value(0)).current;
  const supportingText = error ?? helperText;

  useEffect(() => {
    Animated.timing(focusProgress, {
      toValue: focused ? 1 : 0,
      duration: motion.duration.base,
      useNativeDriver: false,
    }).start();
  }, [focused, focusProgress]);

  const borderColor = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? premiumColors.danger : premiumColors.border, error ? premiumColors.danger : premiumColors.borderOrange],
  });

  return (
    <View style={[styles.field, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        {counter ? <Text style={styles.counter}>{counter}</Text> : null}
      </View>
      <Animated.View style={[styles.inputShell, multiline ? styles.multilineShell : null, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline ? styles.multilineInput : null, style]}
          {...props}
        />
      </Animated.View>
      {supportingText ? (
        <Text style={[styles.supportingText, error ? styles.errorText : null]}>{supportingText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...typography.label,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  required: {
    color: premiumColors.primary,
  },
  counter: {
    ...typography.caption,
    color: premiumColors.textTertiary,
  },
  inputShell: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  multilineShell: {
    minHeight: 132,
  },
  input: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    color: premiumColors.textPrimary,
    ...typography.body,
  },
  multilineInput: {
    minHeight: 132,
    paddingTop: spacing.lg,
    textAlignVertical: 'top',
  },
  supportingText: {
    ...typography.caption,
    color: premiumColors.textTertiary,
  },
  errorText: {
    color: premiumColors.danger,
  },
});

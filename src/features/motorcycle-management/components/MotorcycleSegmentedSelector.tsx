import { Pressable, StyleSheet, Text, View } from 'react-native';

import { motion, premiumColors, radius, spacing, typography } from '@/src/theme';

type MotorcycleSegmentedSelectorProps<T extends string> = {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  required?: boolean;
};

export function MotorcycleSegmentedSelector<T extends string>({
  label,
  value,
  options,
  onChange,
  required = false,
}: MotorcycleSegmentedSelectorProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option === value;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.selectedOption : null,
                pressed ? styles.pressed : null,
              ]}>
              <Text style={[styles.optionText, selected ? styles.selectedOptionText : null]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  required: {
    color: premiumColors.primary,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  selectedOption: {
    borderColor: premiumColors.borderOrange,
    backgroundColor: premiumColors.primaryMuted,
  },
  optionText: {
    ...typography.caption,
    color: premiumColors.textSecondary,
    fontWeight: '700',
  },
  selectedOptionText: {
    color: premiumColors.textPrimary,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: motion.scale.pressed }],
  },
});

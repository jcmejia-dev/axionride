import { Pressable, StyleSheet, Text, View } from 'react-native';

import { motion, premiumColors, radius, spacing, typography } from '@/src/theme';

import { MotorcycleField } from './MotorcycleField';

const colorOptions = [
  { label: 'Graphite', value: 'Matte Graphite', swatch: '#3F4652' },
  { label: 'Black', value: 'Ebony Black', swatch: '#09090B' },
  { label: 'White', value: 'Pearl White', swatch: '#F8FAFC' },
  { label: 'Red', value: 'Racing Red', swatch: '#DC2626' },
  { label: 'Orange', value: 'Burnt Orange', swatch: premiumColors.primary },
] as const;

type MotorcycleColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function MotorcycleColorPicker({ value, onChange, error }: MotorcycleColorPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Color <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.swatches}>
        {colorOptions.map((color) => {
          const selected = color.value === value;

          return (
            <Pressable
              key={color.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={color.label}
              onPress={() => onChange(color.value)}
              style={({ pressed }) => [
                styles.swatchButton,
                selected ? styles.selectedSwatch : null,
                pressed ? styles.pressed : null,
              ]}>
              <View style={[styles.swatch, { backgroundColor: color.swatch }]} />
              <Text style={styles.swatchLabel}>{color.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <MotorcycleField
        label="Custom color"
        value={value}
        onChangeText={onChange}
        error={error}
        helperText="Use the closest visual color or enter your paint description."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  selectedSwatch: {
    borderColor: premiumColors.borderOrange,
    backgroundColor: premiumColors.primaryMuted,
  },
  swatch: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 8,
  },
  swatchLabel: {
    ...typography.caption,
    color: premiumColors.textPrimary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: motion.scale.pressed }],
  },
});

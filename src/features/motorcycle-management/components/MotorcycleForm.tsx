import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MotorcycleCategory, FuelType, TransmissionType } from '@/src/domain/motorcycle';
import { palette, radius, spacing, typography } from '@/src/theme';

import { MotorcycleCategorySelector } from './MotorcycleCategorySelector';
import { MotorcycleColorPicker } from './MotorcycleColorPicker';
import { MotorcycleField } from './MotorcycleField';
import { MotorcycleFuelSelector } from './MotorcycleFuelSelector';
import { MotorcycleSection } from './MotorcycleSection';
import { MotorcycleTransmissionSelector } from './MotorcycleTransmissionSelector';
import type { MotorcycleFormErrors, MotorcycleFormField, MotorcycleFormValues } from '../types';

type MotorcycleFormProps = {
  values: MotorcycleFormValues;
  errors: MotorcycleFormErrors;
  hasUnsavedChanges: boolean;
  notesCharacterCount: number;
  onChangeField: (field: MotorcycleFormField, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  onDelete?: () => void;
};

export function MotorcycleForm({
  values,
  errors,
  hasUnsavedChanges,
  notesCharacterCount,
  onChangeField,
  onSave,
  onCancel,
  onReset,
  onDelete,
}: MotorcycleFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.unsavedDot, hasUnsavedChanges ? styles.unsavedDotActive : null]} />
        <Text style={styles.unsavedText}>{hasUnsavedChanges ? 'Unsaved changes' : 'No changes'}</Text>
      </View>

      <MotorcycleSection title="Basic Information" description="Name the bike and classify the machine." delay={80}>
        <MotorcycleField
          label="Nickname"
          value={values.nickname}
          onChangeText={(value) => onChangeField('nickname', value)}
          error={errors.nickname}
          helperText="What you call this motorcycle."
          required
        />
        <View style={styles.twoColumn}>
          <MotorcycleField
            label="Brand"
            value={values.brand}
            onChangeText={(value) => onChangeField('brand', value)}
            error={errors.brand}
            required
            containerStyle={styles.columnField}
          />
          <MotorcycleField
            label="Model"
            value={values.model}
            onChangeText={(value) => onChangeField('model', value)}
            error={errors.model}
            required
            containerStyle={styles.columnField}
          />
        </View>
        <MotorcycleField
          label="Year"
          value={values.year}
          onChangeText={(value) => onChangeField('year', value)}
          error={errors.year}
          keyboardType="number-pad"
          required
        />
        <MotorcycleCategorySelector
          value={values.category}
          onChange={(value: MotorcycleCategory) => onChangeField('category', value)}
        />
      </MotorcycleSection>

      <MotorcycleSection title="Specifications" description="Core specs used by future ride and maintenance features." delay={160}>
        <MotorcycleField
          label="Engine CC"
          value={values.engineCc}
          onChangeText={(value) => onChangeField('engineCc', value)}
          error={errors.engineCc}
          keyboardType="number-pad"
          required
        />
        <MotorcycleFuelSelector value={values.fuelType} onChange={(value: FuelType) => onChangeField('fuelType', value)} />
        <MotorcycleTransmissionSelector
          value={values.transmission}
          onChange={(value: TransmissionType) => onChangeField('transmission', value)}
        />
        <MotorcycleColorPicker
          value={values.color}
          onChange={(value) => onChangeField('color', value)}
          error={errors.color}
        />
      </MotorcycleSection>

      <MotorcycleSection title="Ownership" description="Sensitive identifiers stay visible only where needed." delay={240}>
        <MotorcycleField
          label="Plate Number"
          value={values.plateNumber}
          onChangeText={(value) => onChangeField('plateNumber', value)}
          error={errors.plateNumber}
          helperText="Letters, numbers, spaces, and hyphens only."
          autoCapitalize="characters"
        />
        <MotorcycleField
          label="VIN"
          value={values.vin}
          onChangeText={(value) => onChangeField('vin', value)}
          error={errors.vin}
          autoCapitalize="characters"
        />
        <View style={styles.twoColumn}>
          <MotorcycleField
            label="Purchase Date"
            value={values.purchaseDate}
            onChangeText={(value) => onChangeField('purchaseDate', value)}
            error={errors.purchaseDate}
            helperText="YYYY-MM-DD"
            containerStyle={styles.columnField}
          />
          <MotorcycleField
            label="Purchase Price"
            value={values.purchasePrice}
            onChangeText={(value) => onChangeField('purchasePrice', value)}
            error={errors.purchasePrice}
            keyboardType="decimal-pad"
            containerStyle={styles.columnField}
          />
        </View>
        <MotorcycleField
          label="Current Odometer"
          value={values.odometerKm}
          onChangeText={(value) => onChangeField('odometerKm', value)}
          error={errors.odometerKm}
          keyboardType="decimal-pad"
          required
        />
      </MotorcycleSection>

      <MotorcycleSection title="Additional Notes" description="Setup notes, reminders, or ownership context." delay={320}>
        <MotorcycleField
          label="Notes"
          value={values.notes}
          onChangeText={(value) => onChangeField('notes', value)}
          error={errors.notes}
          counter={`${notesCharacterCount}/2000`}
          multiline
        />
      </MotorcycleSection>

      <View style={styles.actions}>
        <ActionButton label="Save" onPress={onSave} primary />
        <ActionButton label="Reset" onPress={onReset} />
        <ActionButton label="Cancel" onPress={onCancel} quiet />
        {onDelete ? <ActionButton label="Delete Motorcycle" onPress={onDelete} quiet /> : null}
      </View>
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  primary?: boolean;
  quiet?: boolean;
};

function ActionButton({ label, onPress, primary = false, quiet = false }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary ? styles.primaryButton : null,
        quiet ? styles.quietButton : null,
        pressed ? styles.pressed : null,
      ]}>
      <Text style={[styles.actionText, primary ? styles.primaryActionText : null, quiet ? styles.quietActionText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  statusRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  unsavedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(248, 250, 252, 0.36)',
  },
  unsavedDotActive: {
    backgroundColor: palette.warning,
  },
  unsavedText: {
    ...typography.caption,
    color: palette.text,
    fontWeight: '700',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  columnField: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryButton: {
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  quietButton: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  actionText: {
    ...typography.button,
    color: palette.text,
  },
  primaryActionText: {
    color: palette.darkBackground,
  },
  quietActionText: {
    color: 'rgba(248, 250, 252, 0.68)',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});

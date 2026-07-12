import { SymbolView } from 'expo-symbols';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PremiumButton } from '@/src/components/premium';
import { MotorcycleCategory, FuelType, TransmissionType } from '@/src/domain/motorcycle';
import { iconSizes, motion, premiumColors, radius, spacing, typography } from '@/src/theme';

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
  editing: boolean;
  saving: boolean;
  onChangeField: (field: MotorcycleFormField, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  onDelete?: () => void;
  onChooseImage: () => void;
  onRemoveImage: () => void;
};

export function MotorcycleForm({
  values,
  errors,
  hasUnsavedChanges,
  notesCharacterCount,
  editing,
  saving,
  onChangeField,
  onSave,
  onCancel,
  onReset,
  onDelete,
  onChooseImage,
  onRemoveImage,
}: MotorcycleFormProps) {
  const compact = useWindowDimensions().width < 390;
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.unsavedDot, hasUnsavedChanges ? styles.unsavedDotActive : null]} />
        <Text style={styles.unsavedText}>{hasUnsavedChanges ? 'Unsaved changes' : 'No changes'}</Text>
      </View>

      <MotorcycleSection title="Motorcycle Photo" description="Use a clear side photo so your garage is easy to recognize." delay={30}>
        <View style={styles.photoCard}>{values.imageUri?<Image accessibilityIgnoresInvertColors resizeMode="contain" source={{uri:values.imageUri}} style={styles.photo}/>:<View style={styles.photoEmpty}><SymbolView name={{ios:'photo.fill',android:'image',web:'image'}} tintColor={premiumColors.textSecondary} size={38}/><Text style={styles.photoEmptyText}>No motorcycle photo selected</Text></View>}</View>
        <View style={styles.photoActions}><Pressable accessibilityRole="button" onPress={onChooseImage} style={({pressed})=>[styles.photoButton,pressed&&styles.pressed]}><SymbolView name={{ios:'photo.badge.plus',android:'add_photo_alternate',web:'add_photo_alternate'}} tintColor={premiumColors.primary} size={20}/><Text style={styles.photoButtonText}>{values.imageUri?'Change Photo':'Upload Photo'}</Text></Pressable>{values.imageUri?<Pressable accessibilityRole="button" onPress={onRemoveImage} style={({pressed})=>[styles.removeButton,pressed&&styles.pressed]}><Text style={styles.removeText}>Remove</Text></Pressable>:null}</View>
      </MotorcycleSection>

      <MotorcycleSection title="Identity" description="The details you use to recognize this motorcycle." delay={60}>
        <MotorcycleField
          label="Nickname"
          value={values.nickname}
          onChangeText={(value) => onChangeField('nickname', value)}
          error={errors.nickname}
          helperText="What you call this motorcycle."
          required
        />
        <View style={[styles.twoColumn, compact ? styles.stacked : null]}>
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

      <MotorcycleSection title="Specifications" description="Core mechanical details for rides and maintenance." delay={120}>
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

      <MotorcycleSection title="Ownership" description="Optional purchase and registration details kept on this device." delay={180}>
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
        <View style={[styles.twoColumn, compact ? styles.stacked : null]}>
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

      <MotorcycleSection title="Notes" description="Service context, setup details, or anything worth remembering." delay={240}>
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
        <PremiumButton title={editing ? 'Update Motorcycle' : 'Add Motorcycle'} loading={saving} disabled={saving} icon={<SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor="#FFFFFF" size={iconSizes.sm} />} onPress={onSave} />
        <View style={styles.secondaryActions}>
          {hasUnsavedChanges ? <ActionButton label="Reset" onPress={onReset} /> : null}
          <ActionButton label="Cancel" onPress={onCancel} />
        </View>
        {onDelete ? <ActionButton label="Delete Motorcycle" onPress={onDelete} danger /> : null}
      </View>
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function ActionButton({ label, onPress, danger = false }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        danger ? styles.dangerButton : null,
        pressed ? styles.pressed : null,
      ]}>
      <Text style={[styles.actionText, danger ? styles.dangerText : null]}>
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
    borderColor: premiumColors.border,
    borderRadius: radius.pill,
    backgroundColor: premiumColors.surfaceGlass,
  },
  unsavedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(248, 250, 252, 0.36)',
  },
  unsavedDotActive: {
    backgroundColor: premiumColors.primary,
  },
  unsavedText: {
    ...typography.caption,
    color: premiumColors.textSecondary,
    fontWeight: '700',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stacked: { flexDirection: 'column' },
  columnField: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  photoCard:{height:190,overflow:'hidden',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:premiumColors.border,borderRadius:radius.xl,backgroundColor:'rgba(255,255,255,.035)'},photo:{width:'100%',height:'100%'},photoEmpty:{alignItems:'center',gap:spacing.md},photoEmptyText:{...typography.caption,color:premiumColors.textSecondary},photoActions:{flexDirection:'row',gap:spacing.md},photoButton:{minHeight:48,flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderWidth:1,borderColor:'rgba(255,106,0,.3)',borderRadius:radius.lg,backgroundColor:'rgba(255,106,0,.08)'},photoButtonText:{...typography.body,color:premiumColors.primary,fontWeight:'900'},removeButton:{minHeight:48,justifyContent:'center',paddingHorizontal:spacing.lg},removeText:{...typography.body,color:premiumColors.danger,fontWeight:'800'},
  secondaryActions: { flexDirection: 'row', gap: spacing.md },
  actionButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flex: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.lg,
    backgroundColor: premiumColors.surfaceGlass,
  },
  dangerButton: {
    flex: 0,
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 77, 79, 0.28)',
  },
  actionText: {
    ...typography.button,
    color: premiumColors.textPrimary,
  },
  dangerText: { color: premiumColors.danger },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: motion.scale.pressed }],
  },
});

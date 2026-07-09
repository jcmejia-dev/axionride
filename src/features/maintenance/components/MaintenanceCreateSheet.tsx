import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTextInput, GhostButton, PrimaryButton } from '@/src/components';
import { MaintenanceType } from '@/src/domain/maintenance';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { CreateMaintenanceInput } from '@/src/services';

type MaintenanceCreateSheetProps = {
  readonly visible: boolean;
  readonly loading?: boolean;
  readonly onClose: () => void;
  readonly onCreate: (input: CreateMaintenanceInput) => void;
};

const maintenanceTypes = [
  MaintenanceType.OilChange,
  MaintenanceType.ChainService,
  MaintenanceType.BrakeInspection,
] as const;

export function MaintenanceCreateSheet({
  visible,
  loading = false,
  onClose,
  onCreate,
}: MaintenanceCreateSheetProps) {
  const [title, setTitle] = useState('Oil Change');
  const [type, setType] = useState<MaintenanceType>(MaintenanceType.OilChange);
  const [intervalKm, setIntervalKm] = useState('1500');
  const [cost, setCost] = useState('');
  const titleError = title.trim().length === 0 ? 'Maintenance title is required.' : undefined;

  function handleCreate() {
    if (titleError) {
      return;
    }

    onCreate({
      title,
      type,
      intervalKm: parseOptionalNumber(intervalKm),
      cost: parseOptionalNumber(cost),
    });
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View>
            <Text style={styles.kicker}>Service Command</Text>
            <Text style={styles.title}>Add Maintenance</Text>
            <Text style={styles.subtitle}>Create a local service record for this motorcycle.</Text>
          </View>

          <AppTextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            error={titleError}
            placeholder="Oil Change"
          />

          <View style={styles.typeGroup}>
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {maintenanceTypes.map((maintenanceType) => {
                const selected = type === maintenanceType;
                return (
                  <Pressable
                    key={maintenanceType}
                    accessibilityRole="button"
                    onPress={() => setType(maintenanceType)}
                    style={({ pressed }) => [
                      styles.typeChip,
                      selected ? styles.selectedTypeChip : null,
                      pressed ? styles.pressed : null,
                    ]}>
                    <Text style={[styles.typeChipText, selected ? styles.selectedTypeChipText : null]}>
                      {maintenanceType}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.inputRow}>
            <AppTextInput
              label="Interval KM"
              value={intervalKm}
              onChangeText={setIntervalKm}
              keyboardType="numeric"
              placeholder="1500"
              style={styles.numericInput}
            />
            <AppTextInput
              label="Cost"
              value={cost}
              onChangeText={setCost}
              keyboardType="numeric"
              placeholder="0"
              style={styles.numericInput}
            />
          </View>

          <View style={styles.actions}>
            <GhostButton title="Cancel" onPress={onClose} disabled={loading} />
            <PrimaryButton title="Create" onPress={handleCreate} loading={loading} disabled={Boolean(titleError)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function parseOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
  },
  sheet: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: '#090B0F',
  },
  kicker: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.56)',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.subheading,
    marginTop: spacing.xs,
    color: palette.text,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.62)',
  },
  typeGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.58)',
    textTransform: 'uppercase',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  selectedTypeChip: {
    borderColor: 'rgba(255, 255, 255, 0.84)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  typeChipText: {
    ...typography.caption,
    color: palette.text,
    fontWeight: '800',
  },
  selectedTypeChipText: {
    color: palette.darkBackground,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  numericInput: {
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});

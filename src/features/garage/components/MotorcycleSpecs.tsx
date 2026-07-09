import { StyleSheet, Text, View } from 'react-native';

import type { Motorcycle } from '@/src/domain/motorcycle';
import { palette, radius, spacing, typography } from '@/src/theme';

type MotorcycleSpecsProps = {
  motorcycle: Motorcycle;
};

export function MotorcycleSpecs({ motorcycle }: MotorcycleSpecsProps) {
  const purchaseYear = motorcycle.purchaseDate?.slice(0, 4) ?? 'Not set';

  return (
    <View style={styles.grid}>
      <SpecChip label="Category" value={motorcycle.category} />
      <SpecChip label="Fuel" value={motorcycle.fuelType} />
      <SpecChip label="Transmission" value={motorcycle.transmission} />
      <SpecChip label="Color" value={motorcycle.color} />
      <SpecChip label="Purchase" value={purchaseYear} />
      <SpecChip label="Plate" value={maskPlate(motorcycle.plateNumber)} />
      <SpecChip label="VIN" value={maskVin(motorcycle.vin)} wide />
    </View>
  );
}

type SpecChipProps = {
  label: string;
  value: string;
  wide?: boolean;
};

function SpecChip({ label, value, wide = false }: SpecChipProps) {
  return (
    <View style={[styles.chip, wide ? styles.wideChip : null]}>
      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

function maskPlate(plateNumber?: string) {
  if (!plateNumber) {
    return 'Not set';
  }

  const visible = plateNumber.replace(/\s/g, '').slice(-3);
  return `*** ${visible}`;
}

function maskVin(vin?: string) {
  if (!vin) {
    return 'Not set';
  }

  return `•••• ${vin.slice(-5)}`;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chip: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 0,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  wideChip: {
    flexBasis: '100%',
  },
  label: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.54)',
    textTransform: 'uppercase',
  },
  value: {
    ...typography.body,
    marginTop: spacing.xs,
    color: palette.text,
    fontWeight: '800',
  },
});

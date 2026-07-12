import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { iconSizes, premiumColors, radius, spacing, touchSizes, typography } from '@/src/theme';

type GarageHeaderProps = {
  onAdd: () => void;
};

export function GarageHeader({ onAdd }: GarageHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.accent} />
        <View style={styles.copy}>
          <Text style={styles.title}>Garage</Text>
          <Text style={styles.subtitle}>Your motorcycles</Text>
        </View>
      </View>
      <Pressable accessibilityLabel="Add motorcycle" accessibilityRole="button" hitSlop={spacing.sm} onPress={onAdd} style={({ pressed }) => [styles.addButton, pressed ? styles.pressed : null]}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={premiumColors.primary} size={iconSizes.lg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  accent: {
    width: 5,
    height: 38,
    marginTop: 2,
    borderRadius: 2,
    backgroundColor: premiumColors.primary,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: premiumColors.textPrimary,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
    fontWeight: '500',
  },
  addButton: {
    width: touchSizes.large,
    height: touchSizes.large,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.md,
    backgroundColor: '#11151B',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
});

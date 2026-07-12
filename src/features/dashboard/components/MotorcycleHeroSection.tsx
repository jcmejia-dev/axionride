import { SymbolView } from 'expo-symbols';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard, StatusBadge } from '@/src/components/premium';
import type { Motorcycle } from '@/src/domain/motorcycle';
import { iconSizes, motion, opacity, premiumColors, spacing, typography } from '@/src/theme';

type MotorcycleHeroSectionProps = {
  readonly motorcycle: Motorcycle | null;
  readonly loading?: boolean;
  readonly onPress: () => void;
};

export function MotorcycleHeroSection({ motorcycle, loading = false, onPress }: MotorcycleHeroSectionProps) {
  const title = motorcycle ? getMotorcycleName(motorcycle) : loading ? 'Loading' : 'Add Motorcycle';
  const details = motorcycle ? getMotorcycleDetails(motorcycle) : 'Set up your garage to personalize AxionRide';
  const statusLabel = motorcycle ? 'Ready to ride' : 'Garage setup needed';

  return (
    <Pressable
      accessibilityLabel="Open current motorcycle"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <GlassCard style={styles.card}>
        <View style={styles.cityGlow} />
        <View style={styles.orangeGlow} />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Current Motorcycle</Text>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          {motorcycle ? <StatusBadge label="Primary" tone="orange" style={styles.badge} /> : null}
          <Text numberOfLines={1} style={styles.details}>
            {details}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, motorcycle ? styles.statusDotReady : styles.statusDotMuted]} />
            <Text style={[styles.statusText, motorcycle ? styles.statusReady : styles.statusMuted]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.visual}>
          {motorcycle?.imageUri ? (
            <Image accessibilityIgnoresInvertColors resizeMode="contain" source={{ uri: motorcycle.imageUri }} style={styles.motorcycleImage} />
          ) : (
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require('../../../../assets/images/dashboard-motorcycle-fallback.png')}
              style={styles.fallbackMotorcycleImage}
            />
          )}
        </View>

        <View style={styles.chevron}>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={iconSizes.md} tintColor={premiumColors.textPrimary} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

function getMotorcycleName(motorcycle: Motorcycle) {
  const name = motorcycle.nickname.trim();

  if (name.length > 0) {
    return name;
  }

  return `${motorcycle.brand} ${motorcycle.model}`.trim();
}

function getMotorcycleDetails(motorcycle: Motorcycle) {
  const engine = motorcycle.engineCc > 0 ? `${motorcycle.engineCc}cc` : 'Electric';
  return `${engine} - ${motorcycle.transmission} - ${motorcycle.fuelType}`;
}

const styles = StyleSheet.create({
  card: {
    minHeight: 390,
    padding: 22,
    borderColor: premiumColors.borderOrange,
    backgroundColor: 'rgba(8, 12, 18, 0.9)',
  },
  cityGlow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 120,
    backgroundColor: 'rgba(255, 106, 0, 0.08)',
  },
  orangeGlow: {
    position: 'absolute',
    right: -70,
    bottom: -80,
    width: 260,
    height: 220,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 106, 0, 0.13)',
  },
  copy: {
    zIndex: 2,
    width: '100%',
    gap: 9,
  },
  eyebrow: {
    ...typography.label,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
    color: premiumColors.textPrimary,
  },
  badge: {
    marginTop: spacing.xs,
  },
  details: {
    ...typography.caption,
    fontSize: 15,
    lineHeight: 20,
    color: premiumColors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotReady: {
    backgroundColor: premiumColors.success,
  },
  statusDotMuted: {
    backgroundColor: premiumColors.textTertiary,
  },
  statusText: {
    ...typography.body,
    fontWeight: '700',
  },
  statusReady: {
    color: premiumColors.success,
  },
  statusMuted: {
    color: premiumColors.textSecondary,
  },
  visual: {
    width: '100%',
    height: 210,
    marginTop:spacing.lg,
    overflow:'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius:18,
    backgroundColor:'rgba(255,255,255,.025)',
  },
  motorcycleImage: {
    width: '100%',
    height: '100%',
    borderRadius:18,
  },
  fallbackMotorcycleImage: {
    width: '100%',
    height: '100%',
    opacity: 0.92,
  },
  chevron: {
    position: 'absolute',
    top: 26,
    right: 20,
  },
  pressed: {
    opacity: opacity.pressed,
    transform: [{ scale: motion.scale.pressed }],
  },
});

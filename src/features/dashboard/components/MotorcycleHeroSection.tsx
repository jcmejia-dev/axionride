import { SymbolView } from 'expo-symbols';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard, StatusBadge } from '@/src/components/premium';
import type { Motorcycle } from '@/src/domain/motorcycle';
import { iconSizes, motion, opacity, premiumColors, spacing, typography } from '@/src/theme';

const HUD_FONT = Platform.select({ android: 'sans-serif-condensed', default: undefined });

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
        <View style={styles.edgeRail} />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Current Motorcycle</Text>
          <Text numberOfLines={1} style={styles.title}>
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
          <View style={styles.visualRing} />
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
          <View pointerEvents="none" style={styles.visualFadeStrong} />
          <View pointerEvents="none" style={styles.visualFadeMedium} />
          <View pointerEvents="none" style={styles.visualFadeSoft} />
          <View pointerEvents="none" style={styles.visualBottomBlend} />
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
  return `${engine}  •  ${motorcycle.transmission}  •  ${motorcycle.fuelType}`;
}

const styles = StyleSheet.create({
  card: {
    minHeight: 164,
    justifyContent: 'center',
    padding: 15,
    borderColor: 'rgba(100, 126, 145, 0.24)',
    borderRadius: 8,
    backgroundColor: 'rgba(4, 10, 16, 0.94)',
  },
  cityGlow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 62,
    backgroundColor: 'rgba(33, 52, 68, 0.08)',
  },
  edgeRail: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 46,
    height: 2,
    backgroundColor: 'rgba(117, 148, 168, 0.52)',
  },
  copy: {
    zIndex: 2,
    width: '54%',
    gap: 6,
  },
  eyebrow: {
    ...typography.label,
    fontFamily: HUD_FONT,
    fontWeight: '900',
    letterSpacing: 1,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: HUD_FONT,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: premiumColors.textPrimary,
  },
  badge: {
    alignSelf: 'flex-start',
    minHeight: 26,
    marginTop: 2,
  },
  details: {
    ...typography.caption,
    fontFamily: HUD_FONT,
    fontSize: 12,
    lineHeight: 17,
    color: premiumColors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotReady: {
    backgroundColor: '#91A2AF',
  },
  statusDotMuted: {
    backgroundColor: premiumColors.textTertiary,
  },
  statusText: {
    ...typography.caption,
    fontFamily: HUD_FONT,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusReady: {
    color: '#A9BAC6',
  },
  statusMuted: {
    color: premiumColors.textSecondary,
  },
  visual: {
    position: 'absolute',
    top: 8,
    right: 0,
    bottom: 0,
    width: '52%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualRing: {
    position: 'absolute',
    top: 12,
    right: -54,
    width: 178,
    height: 178,
    borderWidth: 1,
    borderColor: 'rgba(107, 139, 159, 0.3)',
    borderRadius: 89,
    backgroundColor: 'rgba(48, 82, 103, 0.035)',
  },
  motorcycleImage: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    opacity: 0.92,
  },
  fallbackMotorcycleImage: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    opacity: 0.9,
  },
  visualFadeStrong: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    width: '11%',
    backgroundColor: 'rgba(4, 10, 16, 0.68)',
  },
  visualFadeMedium: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '11%',
    zIndex: 2,
    width: '9%',
    backgroundColor: 'rgba(4, 10, 16, 0.36)',
  },
  visualFadeSoft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '20%',
    zIndex: 2,
    width: '7%',
    backgroundColor: 'rgba(4, 10, 16, 0.16)',
  },
  visualBottomBlend: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    height: 12,
    backgroundColor: 'rgba(4, 10, 16, 0.3)',
  },
  chevron: {
    position: 'absolute',
    top: 14,
    right: 12,
    zIndex: 3,
  },
  pressed: {
    opacity: opacity.pressed,
    transform: [{ scale: motion.scale.pressed }],
  },
});

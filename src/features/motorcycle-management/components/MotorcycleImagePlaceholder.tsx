import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/src/theme';

export function MotorcycleImagePlaceholder() {
  return (
    <View style={styles.visual}>
      <View style={styles.glow} />
      <View style={styles.wheelLeft} />
      <View style={styles.wheelRight} />
      <View style={styles.bodyLine} />
      <View style={styles.seatLine} />
      <View style={styles.handleLine} />
      <View style={styles.badge}>
        <SymbolView name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }} tintColor={palette.text} size={18} />
        <Text style={styles.badgeText}>Image placeholder</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  visual: {
    height: 170,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.xl,
    backgroundColor: '#08090B',
  },
  glow: {
    position: 'absolute',
    right: 42,
    bottom: 28,
    width: 190,
    height: 96,
    borderRadius: 95,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  wheelLeft: {
    position: 'absolute',
    bottom: 26,
    left: 32,
    width: 62,
    height: 62,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.64)',
    borderRadius: 31,
  },
  wheelRight: {
    position: 'absolute',
    right: 32,
    bottom: 26,
    width: 62,
    height: 62,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.64)',
    borderRadius: 31,
  },
  bodyLine: {
    position: 'absolute',
    right: 82,
    bottom: 72,
    left: 82,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(249, 115, 22, 0.75)',
  },
  seatLine: {
    position: 'absolute',
    left: 128,
    bottom: 96,
    width: 84,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
  },
  handleLine: {
    position: 'absolute',
    right: 52,
    bottom: 100,
    width: 50,
    height: 4,
    transform: [{ rotate: '-25deg' }],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  badge: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    ...typography.caption,
    color: palette.text,
  },
});

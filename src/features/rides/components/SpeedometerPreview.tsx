import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/src/theme';

export function SpeedometerPreview() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.18, 0.38],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1.06],
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.dial}>
        <Text style={styles.speed}>0</Text>
        <Text style={styles.unit}>km/h</Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Ready to ride</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => undefined}
        style={({ pressed }) => [styles.startButton, pressed ? styles.pressed : null]}>
        <Text style={styles.startButtonText}>Start Ride</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    top: 6,
    width: 236,
    height: 236,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderRadius: 118,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  dial: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 110,
    backgroundColor: '#08090B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.38,
    shadowRadius: 30,
    elevation: 9,
  },
  speed: {
    color: palette.text,
    fontSize: 76,
    lineHeight: 82,
    fontWeight: '900',
  },
  unit: {
    ...typography.subtitle,
    color: 'rgba(248, 250, 252, 0.62)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.success,
  },
  statusText: {
    ...typography.caption,
    color: palette.text,
    fontWeight: '800',
  },
  startButton: {
    minHeight: 52,
    minWidth: 168,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  startButtonText: {
    ...typography.button,
    color: palette.darkBackground,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});

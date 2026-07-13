import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { WeatherCondition } from '../types';

type WeatherAnimationProps = {
  readonly condition: WeatherCondition;
};

export function WeatherAnimation({ condition }: WeatherAnimationProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: animationDuration(condition), easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [condition, progress]);

  if (condition === 'Sunny' || condition === 'Hot') return <SunnyAnimation progress={progress} />;
  if (condition === 'Rainy' || condition === 'Stormy') return <RainAnimation progress={progress} />;
  if (condition === 'Windy') return <WindAnimation progress={progress} />;
  return null;
}

function SunnyAnimation({ progress }: { readonly progress: SharedValue<number> }) {
  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.34, 0.58, 0.34]),
    transform: [
      { rotate: `${progress.value * 360}deg` },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.96, 1.08, 0.96]) },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.12, 0.22, 0.12]),
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [0.9, 1.12, 0.9]) }],
  }));

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.sunGlow, glowStyle]} />
      <Animated.View style={[styles.sun, sunStyle]}>
        <SymbolView name={{ ios: 'sun.max.fill', android: 'sunny', web: 'sunny' }} size={72} tintColor="#FFB25B" />
      </Animated.View>
    </View>
  );
}

function RainAnimation({ progress }: { readonly progress: SharedValue<number> }) {
  return (
    <View pointerEvents="none" style={[styles.overlay, styles.rainOverlay]}>
      {[0, 1, 2, 3, 4, 5, 6].map((index) => <RainDrop key={index} index={index} progress={progress} />)}
    </View>
  );
}

function RainDrop({ index, progress }: { readonly index: number; readonly progress: SharedValue<number> }) {
  const dropStyle = useAnimatedStyle(() => {
    const phase = (progress.value + index / 7) % 1;
    return {
      opacity: interpolate(phase, [0, 0.12, 0.88, 1], [0, 0.32, 0.32, 0]),
      transform: [{ translateY: interpolate(phase, [0, 1], [-30, 150]) }],
    };
  });

  return <Animated.View style={[styles.rainDrop, { left: `${10 + index * 13}%` }, dropStyle]} />;
}

function WindAnimation({ progress }: { readonly progress: SharedValue<number> }) {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      {[0, 1, 2, 3].map((index) => <WindStreak key={index} index={index} progress={progress} />)}
    </View>
  );
}

function WindStreak({ index, progress }: { readonly index: number; readonly progress: SharedValue<number> }) {
  const streakStyle = useAnimatedStyle(() => {
    const phase = (progress.value + index / 4) % 1;
    return {
      opacity: interpolate(phase, [0, 0.15, 0.85, 1], [0, 0.28, 0.28, 0]),
      transform: [
        { translateX: interpolate(phase, [0, 1], [-140, 360]) },
        { translateY: interpolate(phase, [0, 0.5, 1], [0, index % 2 === 0 ? 5 : -5, 0]) },
      ],
    };
  });

  return <Animated.View style={[styles.windStreak, { top: 18 + index * 24, width: 76 + index * 18 }, streakStyle]} />;
}

function animationDuration(condition: WeatherCondition) {
  if (condition === 'Rainy' || condition === 'Stormy') return 1800;
  if (condition === 'Windy') return 2600;
  return 9000;
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  sun: { position: 'absolute', top: -18, right: 72 },
  sunGlow: { position: 'absolute', top: -46, right: 42, width: 134, height: 134, borderRadius: 67, backgroundColor: '#FF8A1F' },
  rainOverlay: { backgroundColor: 'rgba(43, 92, 140, 0.06)' },
  rainDrop: { position: 'absolute', top: -24, width: 2, height: 28, borderRadius: 2, backgroundColor: 'rgba(125, 193, 255, 0.8)', transform: [{ rotate: '10deg' }] },
  windStreak: { position: 'absolute', left: -140, height: 2, borderRadius: 2, backgroundColor: 'rgba(168, 218, 255, 0.72)' },
});

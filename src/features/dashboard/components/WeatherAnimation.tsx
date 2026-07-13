import { SymbolView } from "expo-symbols";
import { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import type { WeatherCondition } from "../types";

type WeatherAnimationProps = {
  readonly type: WeatherCondition;
};

type RainDropConfig = {
  readonly leftPercent: number;
  readonly durationMs: number;
  readonly delayMs: number;
  readonly opacity: number;
  readonly height: number;
};

type WindStreakConfig = {
  readonly top: number;
  readonly width: number;
  readonly durationMs: number;
  readonly delayMs: number;
  readonly verticalDrift: number;
};

export const WeatherAnimation = memo(function WeatherAnimation({ type }: WeatherAnimationProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        type === "Rainy" || type === "Stormy" ? styles.rainTint : null,
      ]}
    >
      {type === "Sunny" || type === "Hot" ? <SunnyAnimation /> : null}
      {type === "Rainy" || type === "Stormy" ? <RainAnimation /> : null}
      {type === "Windy" ? <WindAnimation /> : null}
    </View>
  );
});

function SunnyAnimation() {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration: 12_000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2_400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2_400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
    };
  }, [pulse, rotation]);

  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.38, 0.58]),
    transform: [
      { rotate: `${rotation.value * 360}deg` },
      { scale: interpolate(pulse.value, [0, 1], [1, 1.05]) },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.12, 0.22]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.96, 1.08]) }],
  }));

  return (
    <>
      <Animated.View style={[styles.sunGlow, glowStyle]} />
      <Animated.View style={[styles.sun, sunStyle]}>
        <SymbolView
          name={{ ios: "sun.max.fill", android: "sunny", web: "sunny" }}
          size={72}
          tintColor="#FFB25B"
        />
      </Animated.View>
    </>
  );
}

function RainAnimation() {
  const drops = useMemo(() => createRainDrops(20), []);

  return (
    <>
      {drops.map((drop, index) => (
        <RainDrop key={index} config={drop} />
      ))}
    </>
  );
}

function RainDrop({ config }: { readonly config: RainDropConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delayMs,
      withRepeat(
        withTiming(1, { duration: config.durationMs, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [config.delayMs, config.durationMs, progress]);

  const dropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.12, 0.82, 1],
      [0, config.opacity, config.opacity * 0.72, 0],
    ),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-20, 180]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        { left: `${config.leftPercent}%`, height: config.height },
        dropStyle,
      ]}
    />
  );
}

function WindAnimation() {
  const streaks = useMemo(() => createWindStreaks(8), []);

  return (
    <>
      {streaks.map((streak, index) => (
        <WindStreak key={index} config={streak} />
      ))}
    </>
  );
}

function WindStreak({ config }: { readonly config: WindStreakConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delayMs,
      withRepeat(
        withTiming(1, { duration: config.durationMs, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [config.delayMs, config.durationMs, progress]);

  const streakStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.18, 0.76, 1], [0, 0.4, 0.26, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-130, 480]) },
      {
        translateY: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, config.verticalDrift, 0],
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={[styles.windStreak, { top: config.top, width: config.width }, streakStyle]}
    />
  );
}

function createRainDrops(count: number): RainDropConfig[] {
  return Array.from({ length: count }, (_, index) => ({
    leftPercent: 3 + pseudoRandom(index, 11) * 94,
    durationMs: Math.round(800 + pseudoRandom(index, 23) * 600),
    delayMs: Math.round(pseudoRandom(index, 37) * 1_200),
    opacity: 0.2 + pseudoRandom(index, 41) * 0.3,
    height: Math.round(14 + pseudoRandom(index, 53) * 14),
  }));
}

function createWindStreaks(count: number): WindStreakConfig[] {
  return Array.from({ length: count }, (_, index) => ({
    top: 12 + pseudoRandom(index, 67) * 92,
    width: Math.round(54 + pseudoRandom(index, 71) * 82),
    durationMs: Math.round(1_600 + pseudoRandom(index, 83) * 1_200),
    delayMs: Math.round(pseudoRandom(index, 97) * 1_800),
    verticalDrift: -5 + pseudoRandom(index, 101) * 10,
  }));
}

function pseudoRandom(index: number, salt: number) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  rainTint: {
    backgroundColor: "rgba(43, 92, 140, 0.07)",
  },
  sun: {
    position: "absolute",
    top: -18,
    right: 72,
    shadowColor: "#FF8A1F",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  sunGlow: {
    position: "absolute",
    top: -46,
    right: 42,
    width: 134,
    height: 134,
    borderRadius: 67,
    backgroundColor: "#FF8A1F",
  },
  rainDrop: {
    position: "absolute",
    top: -24,
    width: 2,
    borderRadius: 2,
    backgroundColor: "rgba(125, 193, 255, 0.9)",
    transform: [{ rotate: "8deg" }],
  },
  windStreak: {
    position: "absolute",
    left: -130,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(220, 229, 238, 0.78)",
  },
});

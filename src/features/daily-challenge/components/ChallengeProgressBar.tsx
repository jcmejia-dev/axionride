import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { palette } from '@/src/theme';

export function ChallengeProgressBar({ progress }: { readonly progress: number }) {
  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    animatedProgress.value = withTiming(Math.max(0, Math.min(100, progress)) / 100, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progress]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${animatedProgress.value * 100}%` }));
  return <View style={styles.track}><Animated.View style={[styles.fill, fillStyle]} /></View>;
}

const styles = StyleSheet.create({
  track: { height: 3, overflow: 'hidden', borderRadius: 2, backgroundColor: 'rgba(255,255,255,.08)' },
  fill: { height: 3, borderRadius: 2, backgroundColor: palette.accentOrange },
});

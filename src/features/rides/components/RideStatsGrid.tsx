import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { palette, spacing, typography } from '@/src/theme';

import type { CurrentRidePreview, RideInsight } from '../types';

type Props = { readonly currentRide: CurrentRidePreview; readonly insights: readonly RideInsight[]; readonly speedKmh: number; readonly active: boolean };

export function RideStatsGrid({ currentRide, speedKmh, active }: Props) {
  const stats = [
    { label: 'Distance', value: currentRide.distance, detail: 'Session total' },
    { label: 'Elapsed', value: currentRide.time, detail: 'Ride time' },
    { label: 'Avg Speed', value: currentRide.averageSpeed, detail: 'Live telemetry', reactive: true },
    { label: 'Max Speed', value: currentRide.maxSpeed, detail: 'Session peak', reactive: true },
  ];
  return <View style={styles.section}><Text style={styles.sectionTitle}>RIDE METRICS</Text><View style={styles.grid}>{stats.map((stat) => <RideStatCard key={stat.label} stat={stat} intensity={active && stat.reactive ? Math.min(speedKmh / 120, 1) : 0} />)}</View></View>;
}

function RideStatCard({ stat, intensity }: { readonly stat: { readonly label: string; readonly value: string; readonly detail: string; readonly reactive?: boolean }; readonly intensity: number }) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withTiming(intensity, { duration: 420 });
    if (stat.reactive && intensity > 0) scale.value = withSequence(withTiming(1.025, { duration: 120 }), withTiming(1, { duration: 280 }));
  }, [glow, intensity, scale, stat.reactive, stat.value]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(glow.value, [0, 1], ['rgba(255,255,255,.08)', 'rgba(255,118,23,.55)']),
    backgroundColor: interpolateColor(glow.value, [0, 1], ['rgba(10,14,20,.9)', 'rgba(35,18,8,.88)']),
  }));
  return <Animated.View style={[styles.card, animatedStyle]}><View style={[styles.signal, stat.reactive && intensity > 0 && styles.signalActive]} /><Text style={styles.label}>{stat.label}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={styles.value}>{stat.value}</Text><Text style={styles.detail}>{stat.detail}</Text></Animated.View>;
}

const styles = StyleSheet.create({
  section: { gap: spacing.md }, sectionTitle: { ...typography.label, color: '#99A7B1', fontWeight: '900', letterSpacing: 1 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, card: { width: '48%', minHeight: 102, flexGrow: 1, justifyContent: 'center', padding: spacing.md, borderWidth: 1, borderRadius: 7, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: .2, shadowRadius: 18, elevation: 4 }, signal: { position: 'absolute', top: 0, left: 12, width: 26, height: 2, backgroundColor: 'rgba(145,160,170,.35)' }, signalActive: { backgroundColor: palette.accentOrange }, label: { ...typography.label, color: palette.textMuted, textTransform: 'uppercase' }, value: { marginTop: spacing.sm, color: palette.text, fontSize: 21, lineHeight: 26, fontWeight: '900' }, detail: { ...typography.caption, marginTop: 3, color: palette.textMuted },
});

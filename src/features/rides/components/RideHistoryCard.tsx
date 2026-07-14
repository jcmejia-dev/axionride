import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { getRideName, type Ride } from '@/src/domain/ride';
import { palette, typography } from '@/src/theme';

import { RideRoutePreview } from './RideRoutePreview';

export const RideHistoryCard = memo(function RideHistoryCard({ ride, onPress, elevated = false }: { readonly ride: Ride; readonly onPress: () => void; readonly elevated?: boolean }) {
  const pressed = useSharedValue(0);
  const scrollElevation = useSharedValue(0);
  useEffect(() => {
    scrollElevation.value = withTiming(elevated ? 1 : 0, { duration: elevated ? 160 : 240 });
  }, [elevated, scrollElevation]);
  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255,118,23,${interpolate(pressed.value, [0, 1], [.08, .42])})`,
    shadowColor: pressed.value > 0 ? palette.accentOrange : '#000',
    shadowOpacity: interpolate(pressed.value + scrollElevation.value, [0, 1, 2], [.18, .26, .34]),
    shadowRadius: interpolate(scrollElevation.value, [0, 1], [18, 23]),
    elevation: interpolate(scrollElevation.value, [0, 1], [4, 7]),
    transform: [
      { translateY: interpolate(scrollElevation.value, [0, 1], [0, -1]) },
      { scale: interpolate(pressed.value, [0, 1], [1, .985]) },
    ],
  }));
  return (
    <AnimatedPressable accessibilityLabel={`Open ${getRideName(ride)}`} accessibilityRole="button" onPress={onPress} onPressIn={() => { pressed.value = withTiming(1, { duration: 90 }); }} onPressOut={() => { pressed.value = withTiming(0, { duration: 180 }); }} style={[styles.card, animatedStyle]}>
      <RideRoutePreview points={ride.route} style={styles.preview} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>{getRideName(ride)}</Text>
        <Text style={styles.date}>{formatDateTime(ride.endTime ?? ride.startTime)}</Text>
        <View style={styles.metrics}>
          <Metric value={`${ride.distanceKm.toFixed(1)} km`} label="DIST" />
          <Metric value={formatDuration(ride.durationSeconds)} label="TIME" />
          <Metric value={`${Math.round(ride.averageSpeedKmh)}`} label="KM/H" />
        </View>
      </View>
    </AnimatedPressable>
  );
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Metric({ value, label }: { readonly value: string; readonly label: string }) {
  return <View style={styles.metric}><Text numberOfLines={1} style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

const styles = StyleSheet.create({
  card: { minHeight: 132, flexDirection: 'row', gap: 13, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', borderRadius: 8, backgroundColor: 'rgba(10,14,20,.91)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: .18, shadowRadius: 18, elevation: 4 },
  preview: { width: 112, minHeight: 106, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,.09)', borderRadius: 5 },
  copy: { flex: 1, minWidth: 0, paddingVertical: 3 },
  title: { ...typography.subtitle, color: palette.text, fontWeight: '900' },
  date: { ...typography.caption, marginTop: 4, color: palette.textMuted },
  metrics: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 12 },
  metric: { flex: 1, minWidth: 0, paddingLeft: 6, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'rgba(255,255,255,.12)' },
  metricValue: { fontSize: 14, lineHeight: 17, fontWeight: '900', color: palette.text },
  metricLabel: { marginTop: 3, fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: .5, color: palette.textMuted },
});

import { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { RidePoint } from '@/src/domain/ride';

type PreviewPoint = { readonly x: number; readonly y: number };
type Segment = PreviewPoint & { readonly width: number; readonly angle: number };

export const RideRoutePreview = memo(function RideRoutePreview({ points, style }: { readonly points: readonly RidePoint[]; readonly style?: StyleProp<ViewStyle> }) {
  const geometry = useMemo(() => createGeometry(points), [points]);
  const start = geometry.points[0];
  const end = geometry.points[geometry.points.length - 1];

  return (
    <View style={[styles.preview, style]}>
      {[25, 50, 75].map((position) => <View key={`h-${position}`} style={[styles.horizontal, { top: `${position}%` }]} />)}
      {[25, 50, 75].map((position) => <View key={`v-${position}`} style={[styles.vertical, { left: `${position}%` }]} />)}
      {geometry.segments.map((segment, index) => (
        <View
          key={`${index}-${segment.x}`}
          style={[
            styles.segment,
            {
              left: `${segment.x - segment.width / 2}%`,
              top: `${segment.y}%`,
              width: `${segment.width}%`,
              transform: [{ rotate: `${segment.angle}deg` }],
            },
          ]}
        />
      ))}
      {start ? <View style={[styles.start, { left: `${start.x}%`, top: `${start.y}%` }]} /> : null}
      {end ? <View style={[styles.end, { left: `${end.x}%`, top: `${end.y}%` }]} /> : null}
      <View style={styles.corner} />
    </View>
  );
});

function createGeometry(route: readonly RidePoint[]) {
  if (route.length < 2) return { points: [] as readonly PreviewPoint[], segments: [] as readonly Segment[] };
  const stride = Math.max(1, Math.ceil(route.length / 28));
  const sampled = route.filter((_, index) => index % stride === 0);
  if (sampled[sampled.length - 1] !== route[route.length - 1]) sampled.push(route[route.length - 1]);
  const latitudes = sampled.map((point) => point.latitude);
  const longitudes = sampled.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.00001);
  const lngSpan = Math.max(maxLng - minLng, 0.00001);
  const points = sampled.map((point) => ({
    x: 10 + ((point.longitude - minLng) / lngSpan) * 80,
    y: 10 + ((maxLat - point.latitude) / latSpan) * 80,
  }));
  const segments = points.slice(1).map((point, index) => {
    const previous = points[index];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    return {
      x: (point.x + previous.x) / 2,
      y: (point.y + previous.y) / 2,
      width: Math.sqrt(dx ** 2 + dy ** 2),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    };
  });
  return { points, segments };
}

const styles = StyleSheet.create({
  preview: { overflow: 'hidden', backgroundColor: '#060B10' },
  horizontal: { position: 'absolute', right: 0, left: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(126,146,160,.11)' },
  vertical: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(126,146,160,.09)' },
  segment: { position: 'absolute', height: 2.5, borderRadius: 2, backgroundColor: '#FF7617' },
  start: { position: 'absolute', width: 8, height: 8, marginLeft: -4, marginTop: -4, borderWidth: 2, borderColor: '#AAB7C0', borderRadius: 4, backgroundColor: '#060B10' },
  end: { position: 'absolute', width: 10, height: 10, marginLeft: -5, marginTop: -5, borderWidth: 2, borderColor: '#FF7617', borderRadius: 5, backgroundColor: '#F5F7F8' },
  corner: { position: 'absolute', top: 0, left: 0, width: 22, height: 2, backgroundColor: 'rgba(255,118,23,.72)' },
});

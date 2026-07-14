import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/premium';
import { getRideName, type Ride, type RidePoint } from '@/src/domain/ride';
import { iconSizes, motion, opacity, premiumColors, typography } from '@/src/theme';

type RecentRideCardProps = {
  readonly ride: Ride | null;
  readonly loading?: boolean;
  readonly onPress?: () => void;
};

type PreviewPoint = { readonly x: number; readonly y: number };
type RouteSegment = PreviewPoint & { readonly width: number; readonly angle: number };

const HUD_FONT = Platform.select({ android: 'sans-serif-condensed', default: undefined });
const GRID_LINES = [20, 40, 60, 80];

export function RecentRideCard({ ride, loading = false, onPress }: RecentRideCardProps) {
  const hasRide = Boolean(ride);

  return (
    <Pressable
      accessibilityLabel={hasRide ? 'Open recent ride details' : 'Recent ride summary'}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>RECENT RIDE</Text>
          <View style={styles.viewAll}>
            <Text style={styles.viewAllText}>{hasRide ? 'VIEW ALL' : 'RIDES'}</Text>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={iconSizes.xs}
              tintColor={premiumColors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.rideRow}>
          <RoutePreview points={ride?.route ?? []} />
          <View style={styles.rideDetails}>
            <Text numberOfLines={1} style={styles.rideTitle}>
              {loading ? 'SYNCING RIDE' : ride ? getRideName(ride) : 'NO RIDE YET'}
            </Text>
            <View style={styles.dateRow}>
              <SymbolView
                name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                size={14}
                tintColor={premiumColors.textSecondary}
              />
              <Text numberOfLines={2} style={styles.dateText}>
                {loading ? 'Loading local record' : ride ? formatDateTime(ride.startTime) : 'Your first completed route will appear here'}
              </Text>
            </View>

            <View style={styles.metrics}>
              <RideMetric label="DISTANCE" value={loading ? '—' : ride ? `${formatNumber(ride.distanceKm, 1)} km` : '0 km'} />
              <RideMetric label="DURATION" value={loading ? '—' : ride ? formatDuration(ride.durationSeconds) : '0m'} />
              <RideMetric label="AVG SPEED" value={loading ? '—' : ride ? `${formatNumber(ride.averageSpeedKmh, 0)}` : '0'} suffix="km/h" />
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function RoutePreview({ points }: { readonly points: readonly RidePoint[] }) {
  const previewPoints = normalizeRoute(points);
  const segments = createSegments(previewPoints);
  const start = previewPoints[0];
  const end = previewPoints[previewPoints.length - 1];

  return (
    <View style={styles.routePreview}>
      {GRID_LINES.map((position) => <View key={`h-${position}`} style={[styles.gridHorizontal, { top: `${position}%` }]} />)}
      {GRID_LINES.map((position) => <View key={`v-${position}`} style={[styles.gridVertical, { left: `${position}%` }]} />)}
      <View style={styles.mapDiagonalOne} />
      <View style={styles.mapDiagonalTwo} />
      {segments.map((segment, index) => (
        <View
          key={`${index}-${segment.x}-${segment.y}`}
          style={[
            styles.routeSegment,
            {
              left: `${segment.x - segment.width / 2}%`,
              top: `${segment.y}%`,
              width: `${segment.width}%`,
              transform: [{ rotate: `${segment.angle}deg` }],
            },
          ]}
        />
      ))}
      {start ? <View style={[styles.startPin, { left: `${start.x}%`, top: `${start.y}%` }]} /> : null}
      {end ? <View style={[styles.endPin, { left: `${end.x}%`, top: `${end.y}%` }]}><View style={styles.endPinCore} /></View> : null}
      {!segments.length ? (
        <View style={styles.emptyRoute}>
          <SymbolView
            name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
            tintColor="#788B99"
            size={20}
          />
          <Text style={styles.emptyRouteText}>ROUTE PREVIEW</Text>
        </View>
      ) : null}
      <View style={styles.mapCornerTop} />
      <View style={styles.mapCornerBottom} />
    </View>
  );
}

function normalizeRoute(points: readonly RidePoint[]): readonly PreviewPoint[] {
  if (points.length < 2) return [];
  const stride = Math.max(1, Math.ceil(points.length / 32));
  const sampled = points.filter((_, index) => index % stride === 0);
  if (sampled[sampled.length - 1] !== points[points.length - 1]) sampled.push(points[points.length - 1]);

  const latitudes = sampled.map((point) => point.latitude);
  const longitudes = sampled.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.00001);
  const lngSpan = Math.max(maxLng - minLng, 0.00001);

  return sampled.map((point) => ({
    x: 10 + ((point.longitude - minLng) / lngSpan) * 80,
    y: 10 + ((maxLat - point.latitude) / latSpan) * 80,
  }));
}

function createSegments(points: readonly PreviewPoint[]): readonly RouteSegment[] {
  return points.slice(1).map((point, index) => {
    const previous = points[index];
    const deltaX = point.x - previous.x;
    const deltaY = point.y - previous.y;
    return {
      x: (previous.x + point.x) / 2,
      y: (previous.y + point.y) / 2,
      width: Math.sqrt(deltaX ** 2 + deltaY ** 2),
      angle: Math.atan2(deltaY, deltaX) * (180 / Math.PI),
    };
  });
}

function RideMetric({ label, value, suffix }: { readonly label: string; readonly value: string; readonly suffix?: string }) {
  return (
    <View style={styles.metric}>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.metricValue}>{value}</Text>
      {suffix ? <Text style={styles.metricSuffix}>{suffix}</Text> : null}
      <Text numberOfLines={1} style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const styles = StyleSheet.create({
  card: {
    minHeight: 228,
    padding: 14,
    borderColor: 'rgba(98, 124, 143, 0.25)',
    borderRadius: 8,
    backgroundColor: 'rgba(4, 10, 16, 0.94)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    ...typography.label,
    fontFamily: HUD_FONT,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.1,
    color: '#AEBBC4',
  },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: {
    ...typography.label,
    fontFamily: HUD_FONT,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: premiumColors.textSecondary,
  },
  rideRow: { minHeight: 166, flexDirection: 'row', gap: 14 },
  routePreview: {
    width: '39%',
    minWidth: 118,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(105, 132, 150, 0.27)',
    borderRadius: 5,
    backgroundColor: '#050B10',
  },
  gridHorizontal: { position: 'absolute', right: 0, left: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(77, 105, 123, 0.14)' },
  gridVertical: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(77, 105, 123, 0.12)' },
  mapDiagonalOne: { position: 'absolute', top: 40, left: -28, width: 190, height: 1, backgroundColor: 'rgba(86, 111, 127, 0.2)', transform: [{ rotate: '32deg' }] },
  mapDiagonalTwo: { position: 'absolute', right: -54, bottom: 35, width: 180, height: 1, backgroundColor: 'rgba(86, 111, 127, 0.16)', transform: [{ rotate: '-48deg' }] },
  routeSegment: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: '#FF7A1A' },
  startPin: { position: 'absolute', width: 9, height: 9, marginLeft: -4.5, marginTop: -4.5, borderWidth: 2, borderColor: '#CAD4DB', borderRadius: 5, backgroundColor: '#071019' },
  endPin: { position: 'absolute', width: 14, height: 14, marginLeft: -7, marginTop: -7, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FF7A1A', borderRadius: 7, backgroundColor: '#10161B' },
  endPinCore: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#F7F8FA' },
  mapCornerTop: { position: 'absolute', top: 0, left: 0, width: 24, height: 2, backgroundColor: 'rgba(255, 122, 26, 0.7)' },
  mapCornerBottom: { position: 'absolute', right: 0, bottom: 0, width: 24, height: 2, backgroundColor: 'rgba(107, 139, 159, 0.55)' },
  emptyRoute: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyRouteText: { ...typography.label, fontFamily: HUD_FONT, fontWeight: '900', letterSpacing: 0.7, color: '#758692' },
  rideDetails: { flex: 1, minWidth: 0, paddingVertical: 4 },
  rideTitle: { fontFamily: HUD_FONT, fontSize: 20, lineHeight: 23, fontWeight: '900', fontStyle: 'italic', letterSpacing: 0.4, color: premiumColors.textPrimary },
  dateRow: { minHeight: 39, flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 7 },
  dateText: { ...typography.caption, flex: 1, fontFamily: HUD_FONT, lineHeight: 17, color: premiumColors.textSecondary },
  metrics: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 12 },
  metric: { flex: 1, minWidth: 0, paddingLeft: 7, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'rgba(117, 139, 154, 0.28)' },
  metricValue: { fontFamily: HUD_FONT, fontSize: 17, lineHeight: 19, fontWeight: '900', color: premiumColors.textPrimary },
  metricSuffix: { fontFamily: HUD_FONT, fontSize: 10, lineHeight: 12, fontWeight: '700', color: premiumColors.textSecondary },
  metricLabel: { marginTop: 4, fontFamily: HUD_FONT, fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: 0.35, color: '#71818C' },
  pressed: { opacity: opacity.pressed, transform: [{ scale: motion.scale.pressed }] },
});

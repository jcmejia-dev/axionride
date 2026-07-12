import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';

import { GlassCard } from '@/src/components/premium';
import type { Ride, RidePoint } from '@/src/domain/ride';
import { iconSizes, motion, opacity, premiumColors, radius, spacing, typography } from '@/src/theme';

type RecentRideCardProps = {
  readonly ride: Ride | null;
  readonly loading?: boolean;
  readonly onPress?: () => void;
};

export function RecentRideCard({ ride, loading = false, onPress }: RecentRideCardProps) {
  const hasRide = Boolean(ride);

  return (
    <Pressable
      accessibilityLabel={hasRide ? 'Open recent ride details' : 'Recent ride summary'}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Recent Ride</Text>
            <View style={styles.dateRow}>
              <SymbolView name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} size={iconSizes.xs} tintColor={premiumColors.textSecondary} />
              <Text numberOfLines={1} style={styles.dateText}>
                {loading ? 'Loading ride' : ride ? formatDateTime(ride.startTime) : 'No rides recorded yet'}
              </Text>
            </View>
          </View>
          <View style={styles.shareButton}>
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} size={iconSizes.sm} tintColor={premiumColors.textPrimary} />
          </View>
        </View>

        <RoutePreview points={ride?.route ?? []} />

        <View style={styles.metrics}>
          <RideMetric label="Distance" value={loading ? '-' : ride ? `${formatNumber(ride.distanceKm, 1)} km` : '0 km'} />
          <RideMetric label="Duration" value={loading ? '-' : ride ? formatDuration(ride.durationSeconds) : '0m'} />
          <RideMetric label="Avg. Speed" value={loading ? '-' : ride ? `${formatNumber(ride.averageSpeedKmh, 0)} km/h` : '0 km/h'} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{hasRide ? 'View Ride Details' : 'Start your first ride'}</Text>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={iconSizes.sm} tintColor={premiumColors.primaryBright} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const DASHBOARD_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#111417' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#70777d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111417' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#272c31' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#14181b' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#292e33' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0e1113' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#363c42' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#8b9298' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090d10' }] },
];

const DEFAULT_PREVIEW_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

function RoutePreview({ points }: { readonly points: readonly RidePoint[] }) {
  const coordinates = points.map(toCoordinate);
  const hasRoute = coordinates.length >= 2;
  const region = createPreviewRegion(coordinates);

  return (
    <View style={styles.routePreview}>
      <MapView
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        region={region}
        customMapStyle={DASHBOARD_MAP_STYLE}
        mapType="standard"
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={false}
        zoomEnabled={false}
        showsBuildings={false}
        showsCompass={false}
        showsIndoors={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}>
        {hasRoute ? <Polyline coordinates={coordinates} strokeColor="rgba(0,0,0,.72)" strokeWidth={8} lineCap="round" lineJoin="round" /> : null}
        {hasRoute ? <Polyline coordinates={coordinates} strokeColor={premiumColors.primaryBright} strokeWidth={4.5} lineCap="round" lineJoin="round" /> : null}
        {hasRoute ? <Marker coordinate={coordinates[0]} anchor={{ x: 0.5, y: 0.5 }}><View style={styles.startPin} /></Marker> : null}
        {hasRoute ? <Marker coordinate={coordinates[coordinates.length - 1]} anchor={{ x: 0.5, y: 0.5 }}><View style={styles.endPin}><View style={styles.endPinInner} /></View></Marker> : null}
      </MapView>
      <View pointerEvents="none" style={styles.mapVignette} />
      {!hasRoute ? <View style={styles.emptyRoute}><View style={styles.emptyLocation}><SymbolView name={{ios:'location.fill',android:'location_on',web:'location_on'}} tintColor={premiumColors.textSecondary} size={20}/></View><Text style={styles.emptyRouteTitle}>No route recorded yet</Text><Text style={styles.emptyRouteCopy}>Your latest GPS route will appear here.</Text></View> : null}
    </View>
  );
}

function toCoordinate(point: RidePoint): LatLng {
  return { latitude: point.latitude, longitude: point.longitude };
}

function createPreviewRegion(coordinates: readonly LatLng[]): Region {
  if (coordinates.length === 0) return DEFAULT_PREVIEW_REGION;
  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);
  const minimumLatitude = Math.min(...latitudes);
  const maximumLatitude = Math.max(...latitudes);
  const minimumLongitude = Math.min(...longitudes);
  const maximumLongitude = Math.max(...longitudes);

  return {
    latitude: (minimumLatitude + maximumLatitude) / 2,
    longitude: (minimumLongitude + maximumLongitude) / 2,
    latitudeDelta: Math.max((maximumLatitude - minimumLatitude) * 1.45, 0.008),
    longitudeDelta: Math.max((maximumLongitude - minimumLongitude) * 1.45, 0.008),
  };
}

type RideMetricProps = {
  readonly label: string;
  readonly value: string;
};

function RideMetric({ label, value }: RideMetricProps) {
  return (
    <View style={styles.metric}>
      <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.metricLabel}>
        {label}
      </Text>
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

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

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
    flex: 1,
    minWidth: 0,
    minHeight: 356,
    padding: 0,
    backgroundColor: 'rgba(17, 21, 28, 0.82)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: 18,
    paddingBottom: 12,
  },
  eyebrow: {
    ...typography.label,
    marginBottom: spacing.md,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    ...typography.caption,
    color: premiumColors.textSecondary,
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  routePreview: {
    height: 168,
    overflow: 'hidden',
    marginHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    backgroundColor: '#111417',
  },
  mapVignette: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: 'rgba(3, 5, 7, 0.08)',
  },
  startPin: {
    width: 13,
    height: 13,
    borderWidth: 3,
    borderColor: '#F7F8FA',
    borderRadius: radius.pill,
    backgroundColor: '#111417',
  },
  endPin: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: '#111417',
    backgroundColor: premiumColors.primaryBright,
  },
  endPinInner: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: premiumColors.textPrimary,
  },
  routePlaceholder: {
    ...typography.label,
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(7, 10, 15, 0.78)',
    color: premiumColors.textTertiary,
    textTransform: 'uppercase',
  },
  emptyRoute:{position:'absolute',top:0,right:0,bottom:0,left:0,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(7,10,15,.44)'},
  emptyLocation:{width:42,height:42,alignItems:'center',justifyContent:'center',borderRadius:21,backgroundColor:'rgba(255,255,255,.07)',marginBottom:8},
  emptyRouteTitle:{...typography.caption,color:premiumColors.textPrimary,fontWeight:'900'},
  emptyRouteCopy:{...typography.label,color:premiumColors.textTertiary,marginTop:3,textTransform:'none'},
  metrics: {
    flexDirection: 'row',
    padding: 18,
    gap: 10,
  },
  metric: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: premiumColors.textPrimary,
  },
  metricLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
  },
  footer: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: premiumColors.border,
  },
  footerText: {
    ...typography.button,
    color: premiumColors.primaryBright,
  },
  pressed: {
    opacity: opacity.pressed,
    transform: [{ scale: motion.scale.pressed }],
  },
});

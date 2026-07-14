import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type LatLng, type Region } from 'react-native-maps';
import Animated, { FadeIn } from 'react-native-reanimated';

import { GlassCard } from '@/src/components';
import type { RidePoint, RideSegment } from '@/src/domain/ride';
import { palette, spacing, typography } from '@/src/theme';

import { CurrentLocationMarker } from './CurrentLocationMarker';
import { RideMapControls } from './RideMapControls';
import { RidePolyline } from './RidePolyline';

type RideMapProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly points: readonly RidePoint[];
  readonly currentPoint: RidePoint | null;
  readonly distanceLabel?: string;
  readonly durationLabel?: string;
  readonly completed?: boolean;
  readonly segments?: readonly RideSegment[];
  readonly replay?: boolean;
  readonly onReplayReady?: () => void;
};

const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.018,
  longitudeDelta: 0.018,
};

const PREMIUM_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b0f13' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7f8996' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0f13' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#20262e' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0d1116' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#222831' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#11161c' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#323944' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#080b0f' }] },
];

export function RideMap({
  title,
  subtitle,
  points,
  currentPoint,
  distanceLabel,
  durationLabel,
  completed = false,
  segments,
  replay = false,
  onReplayReady,
}: RideMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const markerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [following, setFollowing] = useState(!completed);
  const [markersVisible, setMarkersVisible] = useState(!replay);
  const startPoint = points[0] ?? null;
  const finishPoint = completed ? points[points.length - 1] ?? null : null;
  const region = useMemo(() => createRegion(currentPoint ?? startPoint), [currentPoint, startPoint]);

  useEffect(() => {
    if (following && currentPoint) {
      mapRef.current?.animateCamera({
        center: createFollowCenter(currentPoint),
        heading: currentPoint.heading ?? 0,
        pitch: 28,
        zoom: 16.5,
      }, { duration: 820 });
    }
  }, [currentPoint, following]);

  useEffect(() => {
    setMarkersVisible(!replay);
    if (markerTimerRef.current) {
      clearTimeout(markerTimerRef.current);
      markerTimerRef.current = null;
    }
    return () => {
      if (markerTimerRef.current) clearTimeout(markerTimerRef.current);
    };
  }, [points, replay]);

  function handleReplayComplete() {
    if (markerTimerRef.current) clearTimeout(markerTimerRef.current);
    markerTimerRef.current = setTimeout(() => {
      setMarkersVisible(true);
      onReplayReady?.();
      markerTimerRef.current = null;
    }, 300);
  }

  function handleMapReady() {
    if (completed) {
      fitRoute();
      return;
    }
    const targetPoint = currentPoint ?? startPoint;
    if (!targetPoint) return;
    mapRef.current?.animateCamera({
      center: createFollowCenter(targetPoint),
      heading: targetPoint.heading ?? 0,
      pitch: 18,
      zoom: 16,
    }, { duration: 280 });
  }

  function recenter() {
    const targetPoint = currentPoint ?? finishPoint ?? startPoint;

    if (targetPoint) {
      mapRef.current?.animateToRegion(createRegion(targetPoint), 650);
    }
  }

  function fitRoute() {
    const coordinates = points.map(toLatLng);

    if (coordinates.length >= 2) {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 72, right: 72, bottom: 72, left: 72 },
        animated: true,
      });
      return;
    }

    recenter();
  }

  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      <Animated.View entering={FadeIn.duration(240)} style={styles.mapEntrance}>
      <GlassCard style={styles.card}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          customMapStyle={PREMIUM_MAP_STYLE}
          mapType="standard"
          showsUserLocation={false}
          showsCompass={false}
          showsBuildings={false}
          showsIndoors={false}
          showsPointsOfInterests={false}
          showsTraffic={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          onMapReady={handleMapReady}>
          <RidePolyline
            points={points}
            segments={segments}
            animationMode={replay ? 'replay' : completed ? 'static' : 'live'}
            onReplayComplete={handleReplayComplete}
          />
          {startPoint && markersVisible ? (
            <Marker coordinate={toLatLng(startPoint)} anchor={{ x: .5, y: .5 }}><Animated.View entering={FadeIn.duration(280)} style={styles.startMarker} /></Marker>
          ) : null}
          {finishPoint && markersVisible ? (
            <Marker coordinate={toLatLng(finishPoint)} anchor={{ x: .5, y: .5 }}><Animated.View entering={FadeIn.delay(100).duration(280)} style={styles.finishMarker}><View style={styles.finishMarkerCore} /></Animated.View></Marker>
          ) : null}
          <CurrentLocationMarker point={completed ? null : currentPoint} />
        </MapView>
        {!completed ? <RideMapControls
          following={following}
          onRecenter={recenter}
          onFitRoute={fitRoute}
          onToggleFollow={() => setFollowing((value) => !value)}
        /> : null}
        <View style={styles.overlay}>
          <Metric label="Distance" value={distanceLabel ?? '--'} />
          <Metric label="Duration" value={durationLabel ?? '--'} />
          <Metric label="Points" value={String(points.length)} />
        </View>
      </GlassCard>
      </Animated.View>
    </View>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function createRegion(point: RidePoint | null): Region {
  if (!point) {
    return DEFAULT_REGION;
  }

  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };
}

function createFollowCenter(point: RidePoint): LatLng {
  const headingRadians = ((point.heading ?? 0) * Math.PI) / 180;
  const lookAheadDegrees = 0.0011;
  return {
    latitude: point.latitude + Math.cos(headingRadians) * lookAheadDegrees,
    longitude: point.longitude + Math.sin(headingRadians) * lookAheadDegrees,
  };
}

function toLatLng(point: RidePoint): LatLng {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
  card: {
    height: 320,
    overflow: 'hidden',
    padding: 0,
    borderRadius: 8,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#08090B',
  },
  mapEntrance: { height: 320 },
  startMarker: { width: 13, height: 13, borderWidth: 3, borderColor: '#AAB7C0', borderRadius: 7, backgroundColor: '#0A0E13' },
  finishMarker: { width: 17, height: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.accentOrange, borderRadius: 9, backgroundColor: '#0A0E13' },
  finishMarkerCore: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F7F8FA' },
  map: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 5,
    backgroundColor: 'rgba(7, 10, 15, 0.82)',
  },
  metricLabel: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.48)',
    textTransform: 'uppercase',
  },
  metricValue: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: palette.text,
    fontWeight: '900',
  },
});

import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type LatLng, type Region } from 'react-native-maps';

import { GlassCard } from '@/src/components';
import type { RidePoint } from '@/src/domain/ride';
import { palette, radius, spacing, typography } from '@/src/theme';

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
};

const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.018,
  longitudeDelta: 0.018,
};

export function RideMap({
  title,
  subtitle,
  points,
  currentPoint,
  distanceLabel,
  durationLabel,
  completed = false,
}: RideMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const [following, setFollowing] = useState(!completed);
  const startPoint = points[0] ?? null;
  const finishPoint = completed ? points[points.length - 1] ?? null : null;
  const region = useMemo(() => createRegion(currentPoint ?? startPoint), [currentPoint, startPoint]);

  useEffect(() => {
    if (following && currentPoint) {
      mapRef.current?.animateToRegion(createRegion(currentPoint), 650);
    }
  }, [currentPoint, following]);

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
      <GlassCard style={styles.card}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={false}
          showsCompass={false}
          toolbarEnabled={false}>
          <RidePolyline points={points} />
          {startPoint ? (
            <Marker coordinate={toLatLng(startPoint)} title="Start" pinColor="#22C55E" />
          ) : null}
          {finishPoint ? (
            <Marker coordinate={toLatLng(finishPoint)} title="Finish" pinColor="#F97316" />
          ) : null}
          <CurrentLocationMarker point={completed ? null : currentPoint} />
        </MapView>
        <RideMapControls
          following={following}
          onRecenter={recenter}
          onFitRoute={fitRoute}
          onToggleFollow={() => setFollowing((value) => !value)}
        />
        <View style={styles.overlay}>
          <Metric label="Distance" value={distanceLabel ?? '--'} />
          <Metric label="Duration" value={durationLabel ?? '--'} />
          <Metric label="Points" value={String(points.length)} />
        </View>
      </GlassCard>
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
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#08090B',
  },
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
    borderRadius: radius.lg,
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

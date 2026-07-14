import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { Circle, Polyline, type LatLng } from 'react-native-maps';

import type { RidePoint, RideSegment, RideSegmentKind } from '@/src/domain/ride';

export type RouteAnimationMode = 'static' | 'live' | 'replay';

type RidePolylineProps = {
  readonly points: readonly RidePoint[];
  readonly segments?: readonly RideSegment[];
  readonly animationMode?: RouteAnimationMode;
  readonly onReplayComplete?: () => void;
};

const LIVE_DRAW_DURATION_MS = 380;
const REPLAY_DRAW_DURATION_MS = 1_600;

export function RidePolyline({ points, segments, animationMode = 'static', onReplayComplete }: RidePolylineProps) {
  const visiblePoints = useAnimatedRoutePoints(points, animationMode, onReplayComplete);
  const visibleSegments = useMemo(
    () => trimSegments(segments, visiblePoints.length),
    [segments, visiblePoints.length],
  );
  const coordinates = visiblePoints.map(toLatLng);

  if (coordinates.length < 2) return null;
  if (!visibleSegments.length) return <RouteLine coordinates={coordinates} kind="normal" intensity={animationMode === 'live' ? 1 : .72} />;

  return <>
    {visibleSegments.flatMap((segment, segmentIndex) =>
      createGradientChunks(segment, visiblePoints, points.length).map((chunk, chunkIndex) => (
        <RouteLine key={`${segmentIndex}-${chunkIndex}-${segment.startPointIndex}`} coordinates={chunk.coordinates} kind={segment.kind} intensity={chunk.intensity} />
      )),
    )}
    {visibleSegments.filter((segment) => segment.kind === 'stopped').map((segment) => {
      const point = visiblePoints[segment.endPointIndex];
      return point ? <Circle key={`stop-glow-${segment.endPointIndex}`} center={toLatLng(point)} radius={10} fillColor="rgba(255,76,76,.16)" strokeColor="rgba(255,115,115,.28)" strokeWidth={1} /> : null;
    })}
    {visibleSegments.filter((segment) => segment.kind === 'stopped').map((segment) => {
      const point = visiblePoints[segment.endPointIndex];
      return point ? <Circle key={`stop-${segment.endPointIndex}`} center={toLatLng(point)} radius={4} fillColor="rgba(255,76,76,.94)" strokeColor="#FF8B8B" strokeWidth={2} /> : null;
    })}
  </>;
}

function useAnimatedRoutePoints(
  points: readonly RidePoint[],
  mode: RouteAnimationMode,
  onReplayComplete: (() => void) | undefined,
) {
  const progress = useRef(new Animated.Value(mode === 'replay' ? 0 : 1)).current;
  const [visiblePoints, setVisiblePoints] = useState<readonly RidePoint[]>(mode === 'replay' ? points.slice(0, 1) : points);
  const previousLength = useRef(points.length);
  const completionRef = useRef(onReplayComplete);

  useEffect(() => { completionRef.current = onReplayComplete; }, [onReplayComplete]);

  useEffect(() => {
    progress.stopAnimation();
    let lastFrame = -1;

    if (mode === 'static') {
      setVisiblePoints(points);
      previousLength.current = points.length;
      return undefined;
    }

    if (mode === 'replay') {
      progress.setValue(0);
      setVisiblePoints(points.slice(0, 1));
      const listenerId = progress.addListener(({ value }) => {
        const frame = Math.floor(value * 24);
        if (frame === lastFrame && value < 1) return;
        lastFrame = frame;
        const count = Math.min(points.length, Math.max(1, Math.ceil(value * Math.max(1, points.length - 1)) + 1));
        setVisiblePoints(points.slice(0, count));
      });
      Animated.timing(progress, {
        toValue: 1,
        duration: REPLAY_DRAW_DURATION_MS,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setVisiblePoints(points);
          completionRef.current?.();
        }
      });
      return () => {
        progress.stopAnimation();
        progress.removeListener(listenerId);
      };
    }

    if (points.length < 2 || points.length <= previousLength.current) {
      setVisiblePoints(points);
      previousLength.current = points.length;
      return undefined;
    }

    const previousPoint = points[points.length - 2];
    const latestPoint = points[points.length - 1];
    const stablePoints = points.slice(0, -1);
    progress.setValue(0);
    const listenerId = progress.addListener(({ value }) => {
      const frame = Math.floor(value * 10);
      if (frame === lastFrame && value < 1) return;
      lastFrame = frame;
      setVisiblePoints([...stablePoints, interpolatePoint(previousPoint, latestPoint, value)]);
    });
    Animated.timing(progress, {
      toValue: 1,
      duration: LIVE_DRAW_DURATION_MS,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setVisiblePoints(points);
    });
    previousLength.current = points.length;
    return () => {
      progress.stopAnimation();
      progress.removeListener(listenerId);
    };
  }, [mode, points, progress]);

  return visiblePoints;
}

function interpolatePoint(start: RidePoint, end: RidePoint, progress: number): RidePoint {
  return {
    ...end,
    latitude: start.latitude + (end.latitude - start.latitude) * progress,
    longitude: start.longitude + (end.longitude - start.longitude) * progress,
  };
}

function trimSegments(segments: readonly RideSegment[] | undefined, pointCount: number) {
  if (!segments?.length || pointCount < 2) return [];
  const finalPointIndex = pointCount - 1;
  return segments
    .filter((segment) => segment.startPointIndex < finalPointIndex)
    .map((segment) => ({ ...segment, endPointIndex: Math.min(segment.endPointIndex, finalPointIndex) }));
}

function createGradientChunks(segment: RideSegment, points: readonly RidePoint[], totalPointCount: number) {
  const intervalCount = Math.max(1, segment.endPointIndex - segment.startPointIndex);
  const chunkSpan = Math.max(1, Math.ceil(intervalCount / 5));
  const chunks: Array<{ readonly coordinates: LatLng[]; readonly intensity: number }> = [];
  for (let start = segment.startPointIndex; start < segment.endPointIndex; start += chunkSpan) {
    const end = Math.min(segment.endPointIndex, start + chunkSpan);
    const coordinates = points.slice(start, end + 1).map(toLatLng);
    if (coordinates.length < 2) continue;
    chunks.push({
      coordinates,
      intensity: Math.max(.08, Math.min(1, ((start + end) / 2) / Math.max(1, totalPointCount - 1))),
    });
  }
  return chunks;
}

function RouteLine({ coordinates, kind, intensity }: { readonly coordinates: LatLng[]; readonly kind: RideSegmentKind; readonly intensity: number }) {
  return <Polyline coordinates={coordinates} strokeColor={getSegmentColor(kind, intensity)} strokeWidth={5} lineCap="round" lineJoin="round" />;
}

function getSegmentColor(kind: RideSegmentKind, intensity: number) {
  const alpha = .24 + Math.max(0, Math.min(1, intensity)) * .76;
  if (kind === 'slow') return `rgba(234,191,69,${alpha})`;
  if (kind === 'stopped') return `rgba(255,76,76,${alpha})`;
  return `rgba(255,118,23,${alpha})`;
}

function toLatLng(point: RidePoint): LatLng {
  return { latitude: point.latitude, longitude: point.longitude };
}

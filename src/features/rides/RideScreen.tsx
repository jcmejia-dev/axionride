import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/src/components';
import type { RidePoint } from '@/src/domain/ride';
import { RideMap } from '@/src/features/maps';
import {
  createLocationService,
  createRideService,
  type CompletedRideResult,
  type ForegroundLocationPermissionState,
  type RideSessionSnapshot,
} from '@/src/services';
import { layout, palette, spacing } from '@/src/theme';

import { EmptyRidesState } from './components/EmptyRidesState';
import { RecentRideList } from './components/RecentRideList';
import { RideHeader } from './components/RideHeader';
import { RideModeCard } from './components/RideModeCard';
import { RideQuickActions } from './components/RideQuickActions';
import { RideStatsGrid } from './components/RideStatsGrid';
import { mockRides } from './data/mockRides';
import type { CurrentRidePreview, RecentRide } from './types';

export function RideScreen() {
  const rideService = useMemo(() => createRideService(), []);
  const locationService = useMemo(() => createLocationService(), []);
  const [currentRide, setCurrentRide] = useState<RideSessionSnapshot>(idleRideSnapshot);
  const [permissionState, setPermissionState] = useState<ForegroundLocationPermissionState>('unknown');
  const [gpsActive, setGpsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completedRide, setCompletedRide] = useState<CompletedRideResult | null>(null);
  const [liveRidePoints, setLiveRidePoints] = useState<readonly RidePoint[]>([]);
  const [rideHistory, setRideHistory] = useState<readonly RecentRide[]>(mockRides.recentRides);
  const currentRidePreview = toCurrentRidePreview(currentRide);
  const activeMapPoints = completedRide ? completedRide.ride.route : liveRidePoints;
  const currentMapPoint = completedRide ? null : liveRidePoints[liveRidePoints.length - 1] ?? null;

  useEffect(() => {
    refreshRideHistory(rideService, setRideHistory);
  }, [rideService]);

  useEffect(() => {
    const timer = setInterval(() => {
      const result = rideService.getCurrentRide();

      if (result.ok) {
        setCurrentRide(result.value);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [rideService]);

  useEffect(() => () => {
    void locationService.stopWatchingLocation();
  }, [locationService]);

  async function startForegroundTracking() {
    const currentLocation = await locationService.getCurrentLocation();

    if (currentLocation.ok) {
      appendLiveRidePoint(setLiveRidePoints, currentLocation.value);
      const snapshot = rideService.addRidePoint(currentLocation.value);

      if (snapshot.ok) {
        setCurrentRide(snapshot.value);
      }
    }

    const watchResult = await locationService.watchLocation((point) => {
      appendLiveRidePoint(setLiveRidePoints, point);
      const snapshot = rideService.addRidePoint(point);

      if (snapshot.ok) {
        setCurrentRide(snapshot.value);
      }
    });

    if (watchResult.ok) {
      setPermissionState(watchResult.value.state);
      setGpsActive(watchResult.value.state === 'granted');
    }
  }

  async function handleStartRide() {
    setCompletedRide(null);
    setLiveRidePoints([]);
    const permissionResult = await locationService.requestForegroundPermission();
    const rideResult = rideService.startRide();

    if (rideResult.ok) {
      setCurrentRide(rideResult.value);
    }

    if (permissionResult.ok) {
      setPermissionState(permissionResult.value.state);

      if (permissionResult.value.state === 'granted') {
        await startForegroundTracking();
        return;
      }
    }

    setGpsActive(false);
  }

  async function handlePauseRide() {
    const result = rideService.pauseRide();
    await locationService.stopWatchingLocation();
    setGpsActive(false);

    if (result.ok) {
      setCurrentRide(result.value);
    }
  }

  async function handleResumeRide() {
    const result = rideService.resumeRide();

    if (result.ok) {
      setCurrentRide(result.value);
    }

    if (permissionState === 'granted') {
      await startForegroundTracking();
    }
  }

  async function handleCancelRide() {
    await locationService.stopWatchingLocation();
    setGpsActive(false);
    setLiveRidePoints([]);
    const result = rideService.cancelRide();

    if (result.ok) {
      setCurrentRide(result.value);
    }
  }

  function handleFinishRide() {
    Alert.alert('Finish ride?', 'Save this ride to local storage?', [
      { text: 'Keep Riding', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          void finishRide();
        },
      },
    ]);
  }

  async function finishRide() {
    setIsSaving(true);
    await locationService.stopWatchingLocation();
    setGpsActive(false);
    const result = await rideService.finishRide();
    setIsSaving(false);

    if (!result.ok) {
      Alert.alert('Ride not saved', result.error.message);
      return;
    }

    setCompletedRide(result.value);
    setLiveRidePoints([]);
    setCurrentRide(idleRideSnapshot);
    await refreshRideHistory(rideService, setRideHistory);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <RideHeader />

        <AnimatedEntrance delay={80}>
          <RideModeCard
            speedKmh={currentRide.averageSpeedKmh}
            status={currentRide.status}
            permissionLabel={getPermissionLabel(permissionState, gpsActive)}
            gpsActive={gpsActive || currentRide.hasGpsSignal}
            elapsedTime={formatDuration(currentRide.elapsedSeconds)}
            disabled={isSaving}
            onStart={handleStartRide}
            onPause={() => {
              void handlePauseRide();
            }}
            onResume={() => {
              void handleResumeRide();
            }}
            onFinish={handleFinishRide}
            onCancel={() => {
              void handleCancelRide();
            }}
          />
        </AnimatedEntrance>

        {completedRide ? (
          <AnimatedEntrance delay={120}>
            <RideCompletionSummary completedRide={completedRide} />
          </AnimatedEntrance>
        ) : null}

        <AnimatedEntrance delay={160}>
          <RideMap
            title={completedRide ? 'Completed Route' : 'Live Ride Map'}
            subtitle={completedRide ? 'Saved route overview' : getMapSubtitle(permissionState, gpsActive)}
            points={activeMapPoints}
            currentPoint={currentMapPoint}
            completed={Boolean(completedRide)}
            distanceLabel={completedRide ? `${completedRide.summary.distance.toFixed(2)} km` : currentRidePreview.distance}
            durationLabel={completedRide ? formatDuration(completedRide.summary.duration) : currentRidePreview.time}
          />
        </AnimatedEntrance>

        <AnimatedEntrance delay={180}>
          <RideStatsGrid currentRide={currentRidePreview} insights={mockRides.insights} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={280}>
          {rideHistory.length > 0 ? <RecentRideList rides={rideHistory} /> : <EmptyRidesState />}
        </AnimatedEntrance>

        <AnimatedEntrance delay={380}>
          <RideQuickActions />
        </AnimatedEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}

function appendLiveRidePoint(
  setLiveRidePoints: (updater: (points: readonly RidePoint[]) => readonly RidePoint[]) => void,
  point: RidePoint,
) {
  setLiveRidePoints((points) => {
    const latestPoint = points[points.length - 1];

    if (latestPoint?.timestamp === point.timestamp) {
      return points;
    }

    return [...points, point];
  });
}

async function refreshRideHistory(
  rideService: ReturnType<typeof createRideService>,
  setRideHistory: (rides: readonly RecentRide[]) => void,
) {
  const result = await rideService.getRideHistory();

  if (!result.ok || result.value.length === 0) {
    setRideHistory(mockRides.recentRides);
    return;
  }

  setRideHistory(result.value.map(({ ride }) => toRecentRide(ride)));
}

function toCurrentRidePreview(snapshot: RideSessionSnapshot): CurrentRidePreview {
  return {
    distance: `${snapshot.distanceKm.toFixed(1)} km`,
    time: formatDuration(snapshot.elapsedSeconds),
    averageSpeed: `${Math.round(snapshot.averageSpeedKmh)} km/h`,
    maxSpeed: `${Math.round(snapshot.maximumSpeedKmh)} km/h`,
  };
}

function toRecentRide(ride: CompletedRideResult['ride']): RecentRide {
  return {
    id: ride.id,
    title: ride.title,
    distance: `${ride.distanceKm.toFixed(1)} km`,
    duration: formatDuration(ride.durationSeconds),
    averageSpeed: `${Math.round(ride.averageSpeedKmh)} km/h`,
    date: ride.endTime ? formatDate(ride.endTime) : 'Saved locally',
  };
}

function RideCompletionSummary({ completedRide }: { readonly completedRide: CompletedRideResult }) {
  return (
    <GlassCard style={styles.summaryCard}>
      <Text style={styles.summaryKicker}>Ride saved</Text>
      <Text style={styles.summaryTitle}>{completedRide.ride.title}</Text>
      <View style={styles.summaryGrid}>
        <SummaryMetric label="Distance" value={`${completedRide.summary.distance.toFixed(2)} km`} />
        <SummaryMetric label="Time" value={formatDuration(completedRide.summary.duration)} />
        <SummaryMetric label="Avg Speed" value={`${Math.round(completedRide.summary.averageSpeed)} km/h`} />
        <SummaryMetric label="Route Points" value={String(completedRide.ride.route.length)} />
      </View>
    </GlassCard>
  );
}

function SummaryMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function getPermissionLabel(permissionState: ForegroundLocationPermissionState, gpsActive: boolean) {
  if (gpsActive) {
    return 'Foreground GPS active';
  }

  if (permissionState === 'denied') {
    return 'GPS denied. Demo ride mode active.';
  }

  if (permissionState === 'granted') {
    return 'GPS ready';
  }

  return 'GPS permission requested when ride starts';
}

function getMapSubtitle(permissionState: ForegroundLocationPermissionState, gpsActive: boolean) {
  if (gpsActive) {
    return 'Following foreground GPS updates';
  }

  if (permissionState === 'denied') {
    return 'GPS denied. Map will show saved demo route after finish.';
  }

  return 'Start a ride to request GPS and draw the live route.';
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const displayMinutes = minutes % 60;
  const displaySeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;
  }

  return `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

const idleRideSnapshot: RideSessionSnapshot = {
  id: null,
  status: 'idle',
  startedAt: null,
  pausedAt: null,
  elapsedSeconds: 0,
  distanceKm: 0,
  averageSpeedKmh: 0,
  maximumSpeedKmh: 0,
  hasGpsSignal: false,
  ridePointCount: 0,
};

type AnimatedEntranceProps = {
  children: ReactNode;
  delay: number;
};

function AnimatedEntrance({ children, delay }: AnimatedEntranceProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay,
      friction: 8,
      tension: 48,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            }),
          },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -130,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xxl,
  },
  summaryCard: {
    gap: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
  },
  summaryKicker: {
    color: 'rgba(248, 250, 252, 0.52)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryTitle: {
    color: palette.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryMetric: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 0,
  },
  summaryLabel: {
    color: 'rgba(248, 250, 252, 0.52)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryValue: {
    marginTop: spacing.xs,
    color: palette.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
});

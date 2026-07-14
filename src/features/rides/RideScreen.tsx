import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Alert, Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Ride, RidePoint } from '@/src/domain/ride';
import {
  DailyChallengeHud,
  evaluateDailyChallenge,
  type DailyChallengeEvaluation,
  type DailyChallengeRideResult,
  type DailyRideChallenge,
} from '@/src/features/daily-challenge';
import { RideMap } from '@/src/features/maps';
import { useRiderProgress } from '@/src/providers';
import {
  createLocationService,
  createDailyChallengeService,
  createRideService,
  createRideScoreProgressService,
  type CompletedRideResult,
  type ForegroundLocationPermissionState,
  type RideSessionSnapshot,
  type RiderProgressSnapshot,
  type RideScoreComparison,
} from '@/src/services';
import { layout, palette, spacing } from '@/src/theme';

import { EmptyRidesState } from './components/EmptyRidesState';
import { FinishRideModal } from './components/FinishRideModal';
import { RecentRideList } from './components/RecentRideList';
import { RideCompleteModal } from './components/RideCompleteModal';
import { RideHeader } from './components/RideHeader';
import { RideModeCard } from './components/RideModeCard';
import { RideStatsGrid } from './components/RideStatsGrid';
import { calculateRideScoreForRide } from './rideScore';
import type { CurrentRidePreview } from './types';

export function RideScreen() {
  const router = useRouter();
  const rideService = useMemo(() => createRideService(), []);
  const locationService = useMemo(() => createLocationService(), []);
  const dailyChallengeService = useMemo(() => createDailyChallengeService(), []);
  const rideScoreProgressService = useMemo(() => createRideScoreProgressService(), []);
  const { snapshot: riderProgress, refresh: refreshRiderProgress } = useRiderProgress();
  const [currentRide, setCurrentRide] = useState<RideSessionSnapshot>(idleRideSnapshot);
  const [permissionState, setPermissionState] = useState<ForegroundLocationPermissionState>('unknown');
  const [gpsActive, setGpsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completedRide, setCompletedRide] = useState<CompletedRideResult | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [completionProgress, setCompletionProgress] = useState<RiderProgressSnapshot | null>(null);
  const [scoreComparison, setScoreComparison] = useState<RideScoreComparison | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyRideChallenge | null>(null);
  const [challengeEvaluation, setChallengeEvaluation] = useState<DailyChallengeEvaluation | null>(null);
  const [challengeResult, setChallengeResult] = useState<DailyChallengeRideResult | null>(null);
  const [finishConfirmVisible, setFinishConfirmVisible] = useState(false);
  const [liveRidePoints, setLiveRidePoints] = useState<readonly RidePoint[]>([]);
  const liveRidePointsRef = useRef<readonly RidePoint[]>([]);
  const dailyChallengeRef = useRef<DailyRideChallenge | null>(null);
  const lastSavedChallengeProgress = useRef(0);
  const [rideHistory, setRideHistory] = useState<readonly Ride[]>([]);
  const [refreshing,setRefreshing]=useState(false);
  const currentRidePreview = toCurrentRidePreview(currentRide);
  const activeMapPoints = completedRide ? completedRide.ride.route : liveRidePoints;
  const currentMapPoint = completedRide ? null : liveRidePoints[liveRidePoints.length - 1] ?? null;
  async function handleRefresh(){setRefreshing(true);await refreshRideHistory(rideService,setRideHistory,true);setRefreshing(false)}

  useFocusEffect(useCallback(() => { void refreshRideHistory(rideService,setRideHistory); }, [rideService]));
  useFocusEffect(useCallback(() => {
    let active = true;
    void dailyChallengeService.getTodayChallenge().then((result) => {
      if (!active || !result.ok) return;
      dailyChallengeRef.current = result.value;
      lastSavedChallengeProgress.current = result.value.progress;
      setDailyChallenge(result.value);
    });
    return () => { active = false; };
  }, [dailyChallengeService]));

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
      const snapshot = rideService.addRidePoint(currentLocation.value);
      recordLiveRidePoint(currentLocation.value);

      if (snapshot.ok) {
        setCurrentRide(snapshot.value);
      }
    }

    const watchResult = await locationService.watchLocation((point) => {
      const snapshot = rideService.addRidePoint(point);
      recordLiveRidePoint(point);

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
    setSummaryVisible(false);
    setCompletionProgress(null);
    setScoreComparison(null);
    setChallengeResult(null);
    setChallengeEvaluation(null);
    liveRidePointsRef.current = [];
    setLiveRidePoints([]);
    if (!dailyChallengeRef.current) {
      const challenge = await dailyChallengeService.getTodayChallenge();
      if (challenge.ok) {
        dailyChallengeRef.current = challenge.value;
        lastSavedChallengeProgress.current = challenge.value.progress;
        setDailyChallenge(challenge.value);
      }
    }
    const permissionResult = await locationService.requestForegroundPermission();
    const rideResult = await rideService.startRide();

    if (rideResult.ok) {
      setCurrentRide(rideResult.value);
    } else {
      Alert.alert('Motorcycle required', rideResult.error.message);
      return;
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

  function recordLiveRidePoint(point: RidePoint) {
    const currentPoints = liveRidePointsRef.current;
    if (currentPoints[currentPoints.length - 1]?.timestamp === point.timestamp) return;
    const nextPoints = [...currentPoints, point];
    liveRidePointsRef.current = nextPoints;
    setLiveRidePoints(nextPoints);
    const challenge = dailyChallengeRef.current;
    if (!challenge || challenge.completed) return;
    const evaluation = evaluateDailyChallenge(challenge, nextPoints);
    setChallengeEvaluation(evaluation);
    const shouldCheckpoint = evaluation.progress >= lastSavedChallengeProgress.current + 5
      || (evaluation.progress >= 100 && lastSavedChallengeProgress.current < 100);
    if (!shouldCheckpoint) return;
    lastSavedChallengeProgress.current = evaluation.progress;
    void dailyChallengeService.saveProgress(challenge, evaluation).then((result) => {
      if (!result.ok) return;
      dailyChallengeRef.current = result.value;
      setDailyChallenge(result.value);
    });
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
    liveRidePointsRef.current = [];
    setLiveRidePoints([]);
    setChallengeEvaluation(null);
    const result = rideService.cancelRide();

    if (result.ok) {
      setCurrentRide(result.value);
    }
  }

  function handleFinishRide() {
    setFinishConfirmVisible(true);
  }

  async function finishRide() {
    setIsSaving(true);
    const challengeRoute = liveRidePointsRef.current;
    const activeChallenge = dailyChallengeRef.current;
    await locationService.stopWatchingLocation();
    setGpsActive(false);
    const result = await rideService.finishRide();
    setIsSaving(false);

    if (!result.ok) {
      Alert.alert('Ride not saved', result.error.message);
      return;
    }

    let completedChallengeResult: DailyChallengeRideResult | null = null;
    if (activeChallenge) {
      const challengeFinish = await dailyChallengeService.finishRide(activeChallenge, challengeRoute);
      if (challengeFinish.ok) {
        completedChallengeResult = challengeFinish.value;
        dailyChallengeRef.current = challengeFinish.value.challenge;
        setDailyChallenge(challengeFinish.value.challenge);
      }
    }
    const currentScore = calculateRideScoreForRide(result.value.ride);
    const [updatedProgress, comparisonResult] = await Promise.all([
      refreshRiderProgress(),
      rideScoreProgressService.recordScore(currentScore.total),
    ]);
    setCompletionProgress(updatedProgress ?? riderProgress);
    setScoreComparison(comparisonResult.ok ? comparisonResult.value : null);
    setChallengeResult(completedChallengeResult);
    setCompletedRide(result.value);
    setSummaryVisible(true);
    setLiveRidePoints([]);
    liveRidePointsRef.current = [];
    setChallengeEvaluation(null);
    setCurrentRide(idleRideSnapshot);
    await refreshRideHistory(rideService, setRideHistory, true);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} tintColor={palette.accentOrange} colors={[palette.accentOrange]} onRefresh={() => { void handleRefresh(); }}/>} style={styles.screen} contentContainerStyle={styles.content}>
        <RideHeader />

        {dailyChallenge ? <DailyChallengeHud challenge={dailyChallenge} evaluation={challengeEvaluation} /> : null}

        <AnimatedEntrance delay={80}>
          <RideModeCard
            speedKmh={currentRide.averageSpeedKmh}
            status={currentRide.status}
            permissionLabel={getPermissionLabel(permissionState, gpsActive)}
            gpsActive={gpsActive || currentRide.hasGpsSignal}
            gpsAccuracyMeters={currentMapPoint?.accuracy}
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

        <AnimatedEntrance delay={160}>
          <RideMap
            title={completedRide ? 'Completed Route' : 'Live Ride Map'}
            subtitle={completedRide ? 'Saved route overview' : getMapSubtitle(permissionState, gpsActive)}
            points={activeMapPoints}
            segments={completedRide?.ride.segments}
            currentPoint={currentMapPoint}
            completed={Boolean(completedRide)}
            distanceLabel={completedRide ? `${completedRide.summary.distance.toFixed(2)} km` : currentRidePreview.distance}
            durationLabel={completedRide ? formatDuration(completedRide.summary.duration) : currentRidePreview.time}
          />
        </AnimatedEntrance>

        <AnimatedEntrance delay={180}>
          <RideStatsGrid currentRide={currentRidePreview} insights={[]} speedKmh={currentRide.averageSpeedKmh} active={currentRide.status === 'active'} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={280}>
          {rideHistory.length > 0 ? <RecentRideList rides={rideHistory} onOpenRide={(id) => router.push(`/ride-details/${encodeURIComponent(id)}` as Href)} onViewAll={() => router.push('/ride-history' as Href)} /> : <EmptyRidesState />}
        </AnimatedEntrance>
      </ScrollView>
      {completedRide && summaryVisible ? <RideCompleteModal completedRide={completedRide} riderProgress={completionProgress ?? riderProgress} scoreComparison={scoreComparison} challengeResult={challengeResult} onDone={() => setSummaryVisible(false)} /> : null}
      {finishConfirmVisible ? <FinishRideModal onKeepRiding={() => setFinishConfirmVisible(false)} onFinish={() => { setFinishConfirmVisible(false); void finishRide(); }} /> : null}
    </SafeAreaView>
  );
}

async function refreshRideHistory(
  rideService: ReturnType<typeof createRideService>,
  setRideHistory: (rides: readonly Ride[]) => void,
  forceRefresh = false,
) {
  const result = await rideService.getRideHistory(forceRefresh);

  if (!result.ok) {
    setRideHistory([]);
    return;
  }

  setRideHistory(result.value.map(({ ride }) => ride));
}

function toCurrentRidePreview(snapshot: RideSessionSnapshot): CurrentRidePreview {
  return {
    distance: `${snapshot.distanceKm.toFixed(1)} km`,
    time: formatDuration(snapshot.elapsedSeconds),
    averageSpeed: `${Math.round(snapshot.averageSpeedKmh)} km/h`,
    maxSpeed: `${Math.round(snapshot.maximumSpeedKmh)} km/h`,
  };
}

function getPermissionLabel(permissionState: ForegroundLocationPermissionState, gpsActive: boolean) {
  if (gpsActive) {
    return 'Foreground GPS active';
  }

  if (permissionState === 'denied') {
    return 'Location access is off';
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
    return 'Enable location access to draw your route.';
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
    backgroundColor: 'rgba(39, 70, 89, 0.085)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(249, 115, 22, 0.022)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xl,
  },
});

import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { RIDER_XP, type CompletedRideResult, type RiderProgressSnapshot, type RideScoreComparison } from '@/src/services';
import { analyzeRideSegments, DEFAULT_FUEL_ECONOMY_KM_PER_LITER } from '@/src/features/ride-engine';
import { DailyChallengeResultCard, type DailyChallengeRideResult } from '@/src/features/daily-challenge';
import { palette, spacing, typography } from '@/src/theme';

import { createRidePersonality, createSmartRideInsights, getSegmentDurationSeconds } from '../rideInsights';
import { calculateRideScore } from '../rideScore';
import { RideScoreCard } from './RideScoreCard';

type Props = {
  readonly completedRide: CompletedRideResult;
  readonly riderProgress: RiderProgressSnapshot;
  readonly scoreComparison: RideScoreComparison | null;
  readonly challengeResult: DailyChallengeRideResult | null;
  readonly onDone: () => void;
};

export function RideCompleteModal({ completedRide, riderProgress, scoreComparison, challengeResult, onDone }: Props) {
  const { ride, summary } = completedRide;
  const segments = ride.segments ?? analyzeRideSegments(ride.route);
  const stoppedSeconds = getSegmentDurationSeconds(segments, 'stopped');
  const slowSeconds = getSegmentDurationSeconds(segments, 'slow');
  const efficiency = ride.fuelEfficiencyKmPerLiter ?? DEFAULT_FUEL_ECONOMY_KM_PER_LITER;
  const fuelUsed = ride.fuelConsumedLiters ?? summary.estimatedFuel ?? (ride.distanceKm / efficiency);
  const insightInput = { averageSpeedKmh: ride.averageSpeedKmh, maximumSpeedKmh: ride.maximumSpeedKmh, durationSeconds: ride.durationSeconds, stoppedSeconds, slowSeconds, route: ride.route };
  const personality = createRidePersonality(insightInput);
  const smartInsights = createSmartRideInsights(insightInput);
  const rideScore = calculateRideScore({
    route: ride.route,
    segments,
    durationSeconds: ride.durationSeconds,
    distanceKm: ride.distanceKm,
    fuelUsedLiters: fuelUsed,
    expectedEfficiencyKmPerLiter: efficiency,
  });

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible onRequestClose={onDone}>
      <ScrollView contentContainerStyle={styles.backdrop} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(380)} style={styles.panel}>
          <View pointerEvents="none" style={styles.glow} />
          <Animated.View entering={ZoomIn.delay(100).duration(300)} style={styles.iconRing}>
            <SymbolView name={{ ios: 'flag.checkered', android: 'sports_score', web: 'sports_score' }} size={26} tintColor={palette.accentOrange} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(130).duration(300)} style={styles.heading}>
            <Text style={styles.kicker}>RIDE SESSION // SAVED</Text>
            <Text style={styles.title}>Ride Complete</Text>
          </Animated.View>
          <View style={styles.stats}>
            <SummaryStat delay={180} label="DISTANCE" value={`${summary.distance.toFixed(1)} km`} />
            <SummaryStat delay={240} label="TIME" value={formatDuration(summary.duration)} />
            <SummaryStat delay={300} label="AVG SPEED" value={`${Math.round(summary.averageSpeed)} km/h`} />
            <SummaryStat delay={360} label="FUEL USED" value={`${fuelUsed.toFixed(2)} L`} />
          </View>
          <RideScoreCard score={rideScore} comparison={scoreComparison} revealDelay={420} compact />
          {challengeResult ? <DailyChallengeResultCard result={challengeResult} delay={820} /> : null}
          <Animated.View entering={FadeInDown.delay(900).duration(320)} style={styles.insight}>
            <Text style={styles.insightLabel}>RIDE INSIGHT</Text>
            <Text style={styles.insightText}>{personality}</Text>
            {smartInsights.slice(0, 2).map((insight) => <Text key={insight} style={styles.smartInsight}>• {insight}</Text>)}
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(980).duration(260)} style={styles.xpPopup}>
            <Text style={styles.xpValue}>+{RIDER_XP.rideCompleted} XP</Text>
            <View><Text style={styles.xpLabel}>RIDE COMPLETE</Text><Text style={styles.xpProgress}>LEVEL {riderProgress.progress.level} · {riderProgress.progress.xp}/100 XP</Text></View>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(1060).duration(280)}>
            <Pressable accessibilityRole="button" onPress={onDone} style={({ pressed }) => [styles.done, pressed && styles.donePressed]}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </Modal>
  );
}

function SummaryStat({ delay, label, value }: { readonly delay: number; readonly label: string; readonly value: string }) {
  return <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>{value}</Text></Animated.View>;
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${seconds % 60}s`;
}

const styles = StyleSheet.create({
  backdrop: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: 'rgba(0,3,7,.84)' },
  panel: { width: '100%', maxWidth: 430, overflow: 'hidden', gap: spacing.lg, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,118,23,.26)', borderRadius: 10, backgroundColor: 'rgba(7,12,18,.98)', shadowColor: palette.accentOrange, shadowOpacity: .16, shadowRadius: 28, elevation: 16 },
  glow: { position: 'absolute', top: -100, alignSelf: 'center', width: 260, height: 190, borderRadius: 130, backgroundColor: 'rgba(255,106,0,.08)' },
  iconRing: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderWidth: 1, borderColor: 'rgba(255,118,23,.48)', borderRadius: 29, backgroundColor: 'rgba(255,106,0,.1)', shadowColor: palette.accentOrange, shadowOpacity: .42, shadowRadius: 18, elevation: 6 },
  heading: { alignItems: 'center' },
  kicker: { ...typography.label, color: palette.accentOrange, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 5, color: palette.text, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -.6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { width: '48%', flexGrow: 1, minHeight: 78, justifyContent: 'center', padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', borderRadius: 6, backgroundColor: 'rgba(255,255,255,.035)' },
  statLabel: { fontSize: 8, lineHeight: 10, color: palette.textMuted, fontWeight: '900', letterSpacing: .8 },
  statValue: { marginTop: 7, color: palette.text, fontSize: 19, lineHeight: 23, fontWeight: '900' },
  insight: { padding: spacing.lg, borderLeftWidth: 2, borderLeftColor: palette.accentOrange, backgroundColor: 'rgba(255,106,0,.055)' },
  insightLabel: { fontSize: 8, lineHeight: 10, color: palette.accentOrange, fontWeight: '900', letterSpacing: 1 },
  insightText: { marginTop: 6, color: palette.text, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  smartInsight: { marginTop: 5, color: palette.textMuted, fontSize: 11, lineHeight: 16 },
  xpPopup: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,118,23,.3)', borderRadius: 16, backgroundColor: 'rgba(255,106,0,.075)', shadowColor: palette.accentOrange, shadowOpacity: .18, shadowRadius: 10, elevation: 3 },
  xpValue: { color: palette.accentOrange, fontSize: 13, lineHeight: 16, fontWeight: '900' },
  xpLabel: { color: palette.textMuted, fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: .8 },
  xpProgress: { marginTop: 2, color: palette.text, fontSize: 10, lineHeight: 13, fontWeight: '800' },
  done: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: palette.accentOrange, shadowColor: palette.accentOrange, shadowOpacity: .25, shadowRadius: 14, elevation: 5 },
  donePressed: { opacity: .84, transform: [{ scale: .985 }] },
  doneText: { ...typography.button, color: '#FFF', fontWeight: '900' },
});

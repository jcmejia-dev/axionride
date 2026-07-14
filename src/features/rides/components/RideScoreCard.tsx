import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GlassCard } from '@/src/components';
import { palette, spacing, typography } from '@/src/theme';
import type { RideScoreComparison } from '@/src/services';

import { createRideScoreSuggestion, type RideScore } from '../rideScore';

type Props = {
  readonly score: RideScore;
  readonly comparison?: RideScoreComparison | null;
  readonly revealDelay?: number;
  readonly compact?: boolean;
};

const METRICS: ReadonlyArray<{ readonly key: keyof Pick<RideScore, 'smoothness' | 'consistency' | 'trafficHandling' | 'efficiency'>; readonly label: string }> = [
  { key: 'smoothness', label: 'SMOOTHNESS' },
  { key: 'consistency', label: 'CONSISTENCY' },
  { key: 'trafficHandling', label: 'TRAFFIC HANDLING' },
  { key: 'efficiency', label: 'EFFICIENCY' },
];

export function RideScoreCard({ score, comparison, revealDelay = 0, compact = false }: Props) {
  return (
    <Animated.View entering={FadeInUp.delay(revealDelay).duration(280)}>
      <GlassCard style={[styles.card, compact && styles.compactCard]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>RIDE SCORE</Text>
            <View style={styles.scoreRow}>
              <Animated.Text entering={FadeInDown.delay(revealDelay + 60).duration(260)} style={[styles.score, compact && styles.compactScore]}>{score.total}</Animated.Text>
              <Text style={styles.maximum}>/100</Text>
            </View>
          </View>
          <Animated.View entering={ZoomIn.delay(revealDelay + 120).duration(260)} style={styles.gradeBadge}>
            <Text style={styles.gradeLabel}>GRADE</Text>
            <Text style={styles.grade}>{score.grade}</Text>
          </Animated.View>
        </View>
        {comparison ? <ScoreComparisonFeedback comparison={comparison} score={score} delay={revealDelay + 160} /> : null}
        <View style={styles.metrics}>
          {METRICS.map((metric, index) => (
            <ScoreMetric
              key={metric.key}
              delay={revealDelay + 180 + index * 80}
              label={metric.label}
              value={score[metric.key]}
            />
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function ScoreComparisonFeedback({ comparison, score, delay }: { readonly comparison: RideScoreComparison; readonly score: RideScore; readonly delay: number }) {
  if (comparison.isPersonalBest && comparison.previousBestScore !== null) {
    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(240)} style={styles.comparison}>
        <PersonalBestBadge />
        <Text style={styles.comparisonText}>
          Previous best {comparison.previousBestScore}/100
          {comparison.changeFromLast !== null && comparison.changeFromLast > 0 ? `  ·  +${comparison.changeFromLast} from last ride` : ''}
        </Text>
      </Animated.View>
    );
  }

  if (comparison.changeFromLast !== null && comparison.changeFromLast > 0) {
    return <Animated.View entering={FadeInDown.delay(delay).duration(240)} style={styles.comparison}><Text style={styles.improvement}>IMPROVEMENT +{comparison.changeFromLast}</Text><Text style={styles.comparisonText}>Compared with your last ride</Text></Animated.View>;
  }

  if (comparison.changeFromLast !== null && comparison.changeFromLast < 0) {
    return <Animated.View entering={FadeInDown.delay(delay).duration(240)} style={styles.comparison}><Text style={styles.decline}>CHANGE {comparison.changeFromLast}</Text><Text style={styles.comparisonText}>{createRideScoreSuggestion(score)}</Text></Animated.View>;
  }

  return null;
}

function PersonalBestBadge() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 620, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [.82, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.035]) }],
  }));
  return <Animated.View style={[styles.personalBestBadge, pulseStyle]}><Text style={styles.personalBestText}>NEW PERSONAL BEST</Text></Animated.View>;
}

function ScoreMetric({ delay, label, value }: { readonly delay: number; readonly label: string; readonly value: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(value / 100, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    }));
  }, [delay, progress, value]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(240)} style={styles.metric}>
      <View style={styles.metricCopy}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>
      <View style={styles.track}><Animated.View style={[styles.fill, fillStyle]} /></View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg, padding: spacing.lg, borderRadius: 8, borderColor: 'rgba(255,255,255,.1)', backgroundColor: 'rgba(9,14,20,.94)', shadowColor: palette.accentOrange, shadowOpacity: .12, shadowRadius: 18, elevation: 5 },
  compactCard: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  kicker: { ...typography.label, color: palette.accentOrange, fontWeight: '900', letterSpacing: 1.2 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 3 },
  score: { color: palette.text, fontSize: 52, lineHeight: 57, fontWeight: '900', letterSpacing: -2.5 },
  compactScore: { fontSize: 44, lineHeight: 49 },
  maximum: { marginBottom: 8, marginLeft: 4, color: palette.textMuted, fontSize: 12, lineHeight: 15, fontWeight: '800' },
  gradeBadge: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,118,23,.48)', borderRadius: 12, backgroundColor: 'rgba(255,106,0,.08)', shadowColor: palette.accentOrange, shadowOpacity: .28, shadowRadius: 14, elevation: 5 },
  gradeLabel: { fontSize: 7, lineHeight: 9, color: palette.textMuted, fontWeight: '900', letterSpacing: 1 },
  grade: { marginTop: 1, color: palette.accentOrange, fontSize: 34, lineHeight: 38, fontWeight: '900', fontStyle: 'italic' },
  comparison: { gap: 5, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,.09)' },
  personalBestBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,118,23,.52)', borderRadius: 12, backgroundColor: 'rgba(255,106,0,.1)', shadowColor: palette.accentOrange, shadowOpacity: .34, shadowRadius: 12, elevation: 5 },
  personalBestText: { color: palette.accentOrange, fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: 1 },
  comparisonText: { color: palette.textMuted, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  improvement: { color: '#68D391', fontSize: 10, lineHeight: 13, fontWeight: '900', letterSpacing: .8 },
  decline: { color: '#EABF45', fontSize: 10, lineHeight: 13, fontWeight: '900', letterSpacing: .8 },
  metrics: { gap: 10 },
  metric: { gap: 5 },
  metricCopy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLabel: { fontSize: 8, lineHeight: 10, color: palette.textMuted, fontWeight: '900', letterSpacing: .8 },
  metricValue: { color: palette.text, fontSize: 11, lineHeight: 14, fontWeight: '900' },
  track: { height: 3, overflow: 'hidden', borderRadius: 2, backgroundColor: 'rgba(255,255,255,.08)' },
  fill: { height: 3, borderRadius: 2, backgroundColor: palette.accentOrange },
});

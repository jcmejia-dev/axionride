import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components';
import { palette, spacing, typography } from '@/src/theme';

import type { DailyRideChallenge } from '../types';
import { ChallengeProgressBar } from './ChallengeProgressBar';

export function DailyChallengeCard({ challenge }: { readonly challenge: DailyRideChallenge }) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconFrame}><SymbolView name={challengeIcon(challenge.type)} size={20} tintColor={challenge.completed ? '#68D391' : palette.accentOrange} /></View>
      <View style={styles.copy}>
        <View style={styles.heading}><Text style={styles.kicker}>DAILY RIDE CHALLENGE</Text><Text style={[styles.progress, challenge.completed && styles.complete]}>{challenge.completed ? 'COMPLETE' : `${challenge.progress}%`}</Text></View>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.description}>{challenge.description}</Text>
        <ChallengeProgressBar progress={challenge.completed ? 100 : challenge.progress} />
      </View>
    </GlassCard>
  );
}

function challengeIcon(type: DailyRideChallenge['type']): ComponentProps<typeof SymbolView>['name'] {
  if (type === 'smooth_speed') return { ios: 'waveform.path.ecg', android: 'monitor_heart', web: 'monitor_heart' };
  if (type === 'no_stops') return { ios: 'arrow.forward.circle', android: 'arrow_circle_right', web: 'arrow_circle_right' };
  if (type === 'steady_above_20') return { ios: 'speedometer', android: 'speed', web: 'speed' };
  return { ios: 'road.lanes', android: 'route', web: 'route' };
}

const styles = StyleSheet.create({
  card: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: 8, borderColor: 'rgba(255,255,255,.09)', backgroundColor: 'rgba(8,13,19,.92)' },
  iconFrame: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,118,23,.3)', borderRadius: 8, backgroundColor: 'rgba(255,106,0,.07)' },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  kicker: { ...typography.label, color: palette.textMuted, fontWeight: '900', letterSpacing: 1 },
  progress: { color: palette.accentOrange, fontSize: 9, lineHeight: 11, fontWeight: '900' },
  complete: { color: '#68D391' },
  title: { color: palette.text, fontSize: 16, lineHeight: 20, fontWeight: '900' },
  description: { color: palette.textMuted, fontSize: 10, lineHeight: 14 },
});

import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { palette, spacing } from '@/src/theme';

import type { DailyChallengeEvaluation, DailyRideChallenge } from '../types';
import { ChallengeProgressBar } from './ChallengeProgressBar';

export function DailyChallengeHud({ challenge, evaluation }: { readonly challenge: DailyRideChallenge; readonly evaluation: DailyChallengeEvaluation | null }) {
  const progress = challenge.completed ? 100 : Math.max(challenge.progress, evaluation?.progress ?? 0);
  return (
    <Animated.View entering={FadeInDown.duration(240)} style={styles.hud}>
      <View style={styles.icon}><SymbolView name={{ ios: 'scope', android: 'my_location', web: 'my_location' }} size={15} tintColor={challenge.completed ? '#68D391' : palette.accentOrange} /></View>
      <View style={styles.copy}><Text style={styles.kicker}>DAILY TARGET</Text><Text numberOfLines={1} style={styles.title}>{challenge.title}</Text><ChallengeProgressBar progress={progress} /></View>
      <Text style={[styles.progress, challenge.completed && styles.complete]}>{challenge.completed ? 'DONE' : `${progress}%`}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hud: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', borderRadius: 7, backgroundColor: 'rgba(8,13,19,.92)' },
  icon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: 'rgba(255,106,0,.08)' },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  kicker: { color: palette.textMuted, fontSize: 7, lineHeight: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: palette.text, fontSize: 12, lineHeight: 15, fontWeight: '900' },
  progress: { minWidth: 34, color: palette.accentOrange, fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'right' },
  complete: { color: '#68D391' },
});

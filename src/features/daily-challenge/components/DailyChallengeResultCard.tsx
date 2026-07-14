import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { palette, spacing } from '@/src/theme';

import type { DailyChallengeRideResult } from '../types';

export function DailyChallengeResultCard({ result, delay = 0 }: { readonly result: DailyChallengeRideResult; readonly delay?: number }) {
  const completed = result.outcome === 'completed';
  const alreadyCompleted = result.outcome === 'already_completed';
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(280)} style={[styles.card, completed && styles.completedCard]}>
      <View style={[styles.icon, completed && styles.completedIcon]}><SymbolView name={{ ios: completed ? 'checkmark' : alreadyCompleted ? 'checkmark.circle' : 'xmark', android: completed || alreadyCompleted ? 'check' : 'close', web: completed || alreadyCompleted ? 'check' : 'close' }} size={17} tintColor={completed || alreadyCompleted ? '#68D391' : '#EABF45'} /></View>
      <View style={styles.copy}>
        <Text style={[styles.title, completed && styles.completedText]}>{completed ? 'CHALLENGE COMPLETE' : alreadyCompleted ? 'CHALLENGE ALREADY COMPLETE' : 'CHALLENGE FAILED'}</Text>
        <Text style={styles.name}>{result.challenge.title}</Text>
        <Text style={styles.reason}>{result.reason}</Text>
      </View>
      {result.bonusXp > 0 ? <Text style={styles.xp}>+{result.bonusXp} XP</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(234,191,69,.24)', borderRadius: 8, backgroundColor: 'rgba(234,191,69,.045)' },
  completedCard: { borderColor: 'rgba(104,211,145,.28)', backgroundColor: 'rgba(104,211,145,.045)' },
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(234,191,69,.1)' },
  completedIcon: { backgroundColor: 'rgba(104,211,145,.1)' },
  copy: { flex: 1, minWidth: 0 },
  title: { color: '#EABF45', fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: .9 },
  completedText: { color: '#68D391' },
  name: { marginTop: 3, color: palette.text, fontSize: 13, lineHeight: 16, fontWeight: '900' },
  reason: { marginTop: 2, color: palette.textMuted, fontSize: 9, lineHeight: 13 },
  xp: { color: palette.accentOrange, fontSize: 12, lineHeight: 15, fontWeight: '900' },
});

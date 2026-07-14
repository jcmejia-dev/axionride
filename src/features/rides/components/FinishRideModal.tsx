import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { palette, spacing, typography } from '@/src/theme';

type Props = {
  readonly onKeepRiding: () => void;
  readonly onFinish: () => void;
};

export function FinishRideModal({ onKeepRiding, onFinish }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(.95);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withTiming(1, { duration: 250 });
  }, [opacity, scale]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible onRequestClose={onKeepRiding}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.panel, panelStyle]}>
          <View pointerEvents="none" style={styles.glow} />
          <View style={styles.iconRing}>
            <SymbolView name={{ ios: 'flag.checkered', android: 'sports_score', web: 'sports_score' }} size={24} tintColor={palette.accentOrange} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.kicker}>ACTIVE RIDE // CONFIRM</Text>
            <Text style={styles.title}>Finish ride?</Text>
            <Text style={styles.message}>Your route and ride telemetry will be saved to this device.</Text>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onKeepRiding} style={({ pressed }) => [styles.button, styles.ghostButton, pressed && styles.pressed]}>
              <Text style={styles.ghostText}>Keep Riding</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onFinish} style={({ pressed }) => [styles.button, styles.finishButton, pressed && styles.pressed]}>
              <Text style={styles.finishText}>Finish Ride</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: 'rgba(0,3,7,.78)' },
  panel: { width: '100%', maxWidth: 420, overflow: 'hidden', gap: spacing.lg, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', borderRadius: 18, backgroundColor: 'rgba(7,12,18,.96)', shadowColor: palette.accentOrange, shadowOpacity: .22, shadowRadius: 26, elevation: 16 },
  glow: { position: 'absolute', top: -80, right: -50, width: 210, height: 160, borderRadius: 105, backgroundColor: 'rgba(255,106,0,.08)' },
  iconRing: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,118,23,.38)', borderRadius: 26, backgroundColor: 'rgba(255,106,0,.09)' },
  copy: { gap: 5 },
  kicker: { fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 1.1, color: palette.accentOrange },
  title: { color: palette.text, fontSize: 27, lineHeight: 33, fontWeight: '900' },
  message: { ...typography.body, color: palette.textMuted, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  button: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  ghostButton: { borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', backgroundColor: 'rgba(255,255,255,.035)' },
  finishButton: { backgroundColor: palette.accentOrange, shadowColor: palette.accentOrange, shadowOpacity: .24, shadowRadius: 12, elevation: 5 },
  ghostText: { ...typography.button, color: palette.text },
  finishText: { ...typography.button, color: '#FFF' },
  pressed: { opacity: .86, transform: [{ scale: .97 }] },
});

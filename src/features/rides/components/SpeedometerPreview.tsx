import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { palette, spacing, typography } from '@/src/theme';

type Status = 'idle' | 'active' | 'paused' | 'completed';
type Props = { readonly speedKmh: number; readonly status: Status; readonly permissionLabel: string; readonly gpsActive: boolean; readonly gpsAccuracyMeters?: number; readonly elapsedTime: string; readonly disabled?: boolean; readonly onStart: () => void; readonly onPause: () => void; readonly onResume: () => void; readonly onFinish: () => void; readonly onCancel: () => void };

const START_ANGLE = -130;
const SWEEP_ANGLE = 260;
const TICK_COUNT = 31;

export function SpeedometerPreview({ speedKmh, status, permissionLabel, gpsActive, gpsAccuracyMeters, elapsedTime, disabled = false, onStart, onPause, onResume, onFinish, onCancel }: Props) {
  const maximum = 120;
  const normalizedSpeed = Math.max(0, Math.min(speedKmh, maximum));
  const displayedSpeed = Math.round(normalizedSpeed);
  const animatedSpeed = useSharedValue(0);
  const needleVibration = useSharedValue(0);
  const livePulse = useSharedValue(1);
  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    if (normalizedSpeed > animatedSpeed.value) {
      const overshoot = Math.min(maximum, normalizedSpeed + Math.min(2, normalizedSpeed * 0.04));
      animatedSpeed.value = withSequence(
        withTiming(overshoot, { duration: 250, easing }),
        withTiming(normalizedSpeed, { duration: 100, easing }),
      );
      return;
    }
    animatedSpeed.value = withTiming(normalizedSpeed, { duration: 720, easing: Easing.out(Easing.quad) });
  }, [animatedSpeed, normalizedSpeed]);
  useEffect(() => {
    cancelAnimation(needleVibration);
    if (status === 'active' && normalizedSpeed >= 75) {
      needleVibration.value = withRepeat(
        withSequence(
          withTiming(-0.42, { duration: 55 }),
          withTiming(0.5, { duration: 65 }),
          withTiming(0, { duration: 50 }),
        ),
        -1,
      );
    } else {
      needleVibration.value = withTiming(0, { duration: 100 });
    }
    return () => cancelAnimation(needleVibration);
  }, [needleVibration, normalizedSpeed, status]);
  const needleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${START_ANGLE + interpolate(animatedSpeed.value, [0, maximum], [0, SWEEP_ANGLE]) + needleVibration.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: interpolate(animatedSpeed.value, [0, maximum], [.04, .58]), transform: [{ scale: interpolate(animatedSpeed.value, [0, maximum], [.94, 1.08]) }] }));
  useEffect(() => {
    cancelAnimation(livePulse);
    if (status === 'active') {
      livePulse.value = withRepeat(
        withSequence(withTiming(.35, { duration: 520 }), withTiming(1, { duration: 520 })),
        -1,
      );
    } else {
      livePulse.value = withTiming(1, { duration: 120 });
    }
    return () => cancelAnimation(livePulse);
  }, [livePulse, status]);
  const livePulseStyle = useAnimatedStyle(() => ({ opacity: livePulse.value, transform: [{ scale: .86 + livePulse.value * .14 }] }));
  const ticks = useMemo(() => Array.from({ length: TICK_COUNT }, (_, index) => ({ index, angle: START_ANGLE + (index / (TICK_COUNT - 1)) * SWEEP_ANGLE, value: (index / (TICK_COUNT - 1)) * maximum })), [maximum]);
  const labels = useMemo(() => Array.from({ length: 7 }, (_, index) => ({ value: (maximum / 6) * index, angle: START_ANGLE + (index / 6) * SWEEP_ANGLE })), [maximum]);
  const gpsSignal = getGpsSignal(gpsActive, gpsAccuracyMeters);
  const statusText = status === 'active' ? (gpsActive ? (gpsSignal.quality === 'WEAK' ? 'WEAK GPS' : 'TRACKING...') : 'SEARCHING GPS') : status === 'paused' ? 'RIDE PAUSED' : 'READY';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}><View><Text style={styles.kicker}>LIVE COCKPIT</Text><Text style={styles.heading}>{status === 'idle' ? 'RIDE SYSTEM READY' : 'RIDE IN PROGRESS'}</Text></View><View style={styles.statusBadges}>{status === 'active' ? <View style={styles.liveBadge}><Animated.View style={[styles.liveDot, livePulseStyle]} /><Text style={styles.liveText}>LIVE</Text></View> : null}<View style={styles.gps}><View style={[styles.gpsDot, gpsActive && styles.gpsActive, gpsSignal.quality === 'WEAK' && styles.gpsWeak]} /><Text style={styles.gpsText}>{gpsSignal.label}</Text></View></View></View>
      <View style={styles.gauge}>
        <Animated.View style={[styles.speedGlow, glowStyle]} />
        <View style={styles.outerRing} />
        {ticks.map((tick) => <GaugeTick key={tick.index} angle={tick.angle} major={tick.index % 5 === 0} active={tick.value <= normalizedSpeed && normalizedSpeed > 0} intensity={tick.index / (TICK_COUNT - 1)} />)}
        {labels.map((label) => <GaugeLabel key={label.value} angle={label.angle} value={Math.round(label.value)} />)}
        <Animated.View style={[styles.needlePivot, needleStyle]}><View style={styles.needle} /><View style={styles.needleTail} /></Animated.View>
        <View style={styles.hub}><View style={styles.hubCore} /></View>
        <View style={styles.readout}><View style={styles.speedLayer}><Animated.Text key={displayedSpeed} entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} adjustsFontSizeToFit numberOfLines={1} style={styles.speed}>{displayedSpeed}</Animated.Text></View><Text style={styles.unit}>KM/H</Text></View>
        <View style={styles.status}><View style={[styles.statusDot, status === 'paused' && styles.pausedDot]} /><Text style={styles.statusText}>{statusText}</Text></View>
      </View>
      <View style={styles.metrics}><Metric label="ELAPSED" value={elapsedTime} /><View style={styles.divider} /><Metric label="SCALE" value={`0—${maximum}`} /><View style={styles.divider} /><Metric label="SIGNAL" value={gpsActive ? 'ACTIVE' : 'WAITING'} /></View>
      <Text style={styles.permission}>{permissionLabel}</Text>
      {status === 'idle' ? <Button label="Start Ride" icon="near_me" primary disabled={disabled} onPress={onStart} /> : status === 'active' ? <View style={styles.actions}><Button label="Pause" icon="pause" disabled={disabled} onPress={onPause} /><Button label="Finish" icon="stop_circle" primary disabled={disabled} onPress={onFinish} /></View> : <View style={styles.actions}><Button label="Resume" icon="play_arrow" primary disabled={disabled} onPress={onResume} /><Button label="Cancel" icon="close" disabled={disabled} onPress={onCancel} /><Button label="Finish" icon="stop_circle" disabled={disabled} onPress={onFinish} /></View>}
    </View>
  );
}

function GaugeTick({ angle, major, active, intensity }: { readonly angle: number; readonly major: boolean; readonly active: boolean; readonly intensity: number }) {
  const radius = 108;
  const radians = (angle * Math.PI) / 180;
  const x = 126 + Math.sin(radians) * radius;
  const y = 126 - Math.cos(radians) * radius;
  return <View style={[styles.tick, major && styles.majorTick, { left: x - 1, top: y - (major ? 6 : 4), backgroundColor: active ? `rgba(255,118,23,${.48 + intensity * .48})` : 'rgba(218,226,232,.2)', transform: [{ rotate: `${angle}deg` }] }]} />;
}

function GaugeLabel({ angle, value }: { readonly angle: number; readonly value: number }) {
  const radius = 84;
  const radians = (angle * Math.PI) / 180;
  return <Text style={[styles.scaleLabel, { left: 126 + Math.sin(radians) * radius - 13, top: 126 - Math.cos(radians) * radius - 8 }]}>{value}</Text>;
}

function getGpsSignal(active: boolean, accuracyMeters: number | undefined) {
  if (!active) return { quality: 'OFF', label: 'STANDBY' } as const;
  if (typeof accuracyMeters !== 'number' || !Number.isFinite(accuracyMeters)) return { quality: 'ACQUIRING', label: 'GPS ACQUIRING' } as const;
  if (accuracyMeters <= 10) return { quality: 'STRONG', label: `STRONG · ${Math.round(accuracyMeters)}m` } as const;
  if (accuracyMeters <= 25) return { quality: 'GOOD', label: `GOOD · ${Math.round(accuracyMeters)}m` } as const;
  return { quality: 'WEAK', label: `WEAK · ${Math.round(accuracyMeters)}m` } as const;
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }
function Button({ label, icon, onPress, disabled = false, primary = false }: { readonly label: string; readonly icon: 'near_me' | 'pause' | 'stop_circle' | 'play_arrow' | 'close'; readonly onPress: () => void; readonly disabled?: boolean; readonly primary?: boolean }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, primary && styles.primaryButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}><SymbolView name={{ ios: icon === 'near_me' ? 'location.north' : icon === 'pause' ? 'pause' : icon === 'play_arrow' ? 'play' : icon === 'close' ? 'xmark' : 'stop.circle', android: icon, web: icon }} tintColor={primary ? '#fff' : palette.text} size={18} /><Text style={styles.buttonText}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.lg, padding: spacing.lg }, topRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: palette.accentOrange }, heading: { ...typography.subtitle, color: palette.text, marginTop: 3, fontWeight: '900' }, statusBadges: { alignItems: 'flex-end', gap: 5 }, liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,118,23,.3)', borderRadius: 4, backgroundColor: 'rgba(255,106,0,.08)' }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accentOrange }, liveText: { fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: 1, color: palette.accentOrange }, gps: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', borderRadius: 5, backgroundColor: 'rgba(255,255,255,.035)' }, gpsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.textMuted }, gpsActive: { backgroundColor: '#58D68D' }, gpsWeak: { backgroundColor: '#EABF45' }, gpsText: { fontSize: 8, fontWeight: '900', letterSpacing: .55, color: palette.textMuted },
  gauge: { width: 252, height: 252, alignItems: 'center', justifyContent: 'center', borderRadius: 126, backgroundColor: '#080C11', shadowColor: '#000', shadowOpacity: .48, shadowRadius: 26, elevation: 10 }, speedGlow: { position: 'absolute', inset: 22, borderRadius: 104, backgroundColor: 'rgba(255,106,0,.16)', shadowColor: palette.accentOrange, shadowOpacity: .35, shadowRadius: 30, elevation: 3 }, outerRing: { position: 'absolute', inset: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', borderRadius: 122 }, tick: { position: 'absolute', width: 2, height: 8, borderRadius: 1 }, majorTick: { height: 12, width: 2 }, scaleLabel: { position: 'absolute', width: 26, color: 'rgba(218,226,232,.5)', fontSize: 9, fontWeight: '800', textAlign: 'center' }, needlePivot: { position: 'absolute', top: 125, left: 125, width: 2, height: 2 }, needle: { position: 'absolute', bottom: 0, left: -1, width: 3, height: 76, borderRadius: 2, backgroundColor: palette.accentOrange, shadowColor: palette.accentOrange, shadowOpacity: .75, shadowRadius: 8, elevation: 4 }, needleTail: { position: 'absolute', top: 0, left: -1, width: 3, height: 20, borderRadius: 2, backgroundColor: 'rgba(255,118,23,.45)' }, hub: { position: 'absolute', top: 116, left: 116, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#596873', borderRadius: 10, backgroundColor: '#0A0E13' }, hubCore: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F4F6F7' }, readout: { position: 'absolute', top: 139, alignItems: 'center' }, speedLayer: { width: 118, height: 55, alignItems: 'center', justifyContent: 'center' }, speed: { position: 'absolute', color: palette.text, fontSize: 51, lineHeight: 55, fontWeight: '900', letterSpacing: -2 }, unit: { fontSize: 9, fontWeight: '900', letterSpacing: 1.8, color: palette.textMuted }, status: { position: 'absolute', bottom: 39, flexDirection: 'row', alignItems: 'center', gap: 6 }, statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accentOrange }, pausedDot: { backgroundColor: palette.warning }, statusText: { fontSize: 9, fontWeight: '900', letterSpacing: .7, color: '#AAB6BE' },
  metrics: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,.07)' }, metric: { flex: 1, alignItems: 'center' }, metricLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: palette.textMuted }, metricValue: { ...typography.caption, color: palette.text, marginTop: 4, fontWeight: '900' }, divider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,.08)' }, permission: { ...typography.caption, color: palette.textMuted, textAlign: 'center' }, actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm }, button: { minHeight: 48, minWidth: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', borderRadius: 6, backgroundColor: 'rgba(255,255,255,.045)' }, primaryButton: { backgroundColor: palette.accentOrange, borderColor: palette.accentOrange, shadowColor: palette.accentOrange, shadowOpacity: .2, shadowRadius: 14, elevation: 4 }, buttonText: { ...typography.button, color: '#fff' }, disabled: { opacity: .45 }, pressed: { opacity: .88, borderColor: 'rgba(255,118,23,.58)', shadowColor: palette.accentOrange, shadowOpacity: .3, shadowRadius: 12, elevation: 7, transform: [{ scale: .97 }] },
});

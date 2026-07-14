import { SymbolView } from 'expo-symbols';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard, Toast } from '@/src/components';
import { getRideName, type Ride } from '@/src/domain/ride';
import { analyzeRideSegments, DEFAULT_FUEL_ECONOMY_KM_PER_LITER } from '@/src/features/ride-engine';
import { RideMap } from '@/src/features/maps';
import { createRideService } from '@/src/services';
import { layout, palette, spacing, typography } from '@/src/theme';

import { createRidePersonality, createSmartRideInsights, formatInsightDuration, getSegmentDurationSeconds } from './rideInsights';
import { calculateRideScore } from './rideScore';
import { RideScoreCard } from './components/RideScoreCard';

export function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const service = useMemo(() => createRideService(), []);
  const [ride, setRide] = useState<Ride | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [replayReady, setReplayReady] = useState(false);
  const segments = useMemo(() => ride?.segments ?? analyzeRideSegments(ride?.route ?? []), [ride]);
  const fuelEfficiency = ride?.fuelEfficiencyKmPerLiter ?? DEFAULT_FUEL_ECONOMY_KM_PER_LITER;
  const fuelUsedLiters = ride?.fuelConsumedLiters ?? ((ride?.distanceKm ?? 0) / fuelEfficiency);
  const stoppedSeconds = getSegmentDurationSeconds(segments, 'stopped');
  const slowSeconds = getSegmentDurationSeconds(segments, 'slow');
  const insightInput = useMemo(() => ride ? { averageSpeedKmh: ride.averageSpeedKmh, maximumSpeedKmh: ride.maximumSpeedKmh, durationSeconds: ride.durationSeconds, stoppedSeconds, slowSeconds, route: ride.route } : null, [ride, slowSeconds, stoppedSeconds]);
  const personality = useMemo(() => insightInput ? createRidePersonality(insightInput) : '', [insightInput]);
  const smartInsights = useMemo(() => insightInput ? createSmartRideInsights(insightInput) : [], [insightInput]);
  const rideScore = useMemo(() => ride ? calculateRideScore({
    route: ride.route,
    segments,
    durationSeconds: ride.durationSeconds,
    distanceKm: ride.distanceKm,
    fuelUsedLiters,
    expectedEfficiencyKmPerLiter: fuelEfficiency,
  }) : null, [fuelEfficiency, fuelUsedLiters, ride, segments]);

  const load = useCallback(async () => {
    if (!id) return;
    const result = await service.getRideById(id);
    if (result.ok) { setReplayReady(false); setRide(result.value); setLoadError(null); }
    else setLoadError(result.error.message);
  }, [id, service]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function openEditor() {
    if (!ride) return;
    setDraftName(getRideName(ride));
    setEditing(true);
  }
  async function saveName() {
    if (!ride) return;
    setSaving(true);
    const result = await service.renameRide(ride.id, draftName);
    setSaving(false);
    if (!result.ok) { setMessage(result.error.message); return; }
    setRide(result.value);
    setEditing(false);
    setMessage('Ride renamed');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.glow} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header onBack={() => router.back()} />
        {!ride ? <GlassCard style={styles.loading}><Text style={styles.loadingText}>{loadError ? 'RIDE RECORD UNAVAILABLE' : 'LOADING RIDE RECORD...'}</Text>{loadError ? <Text style={styles.loadingDetail}>{loadError}</Text> : null}</GlassCard> : (
          <>
            <Animated.View entering={FadeInDown.duration(420)}>
              <View style={styles.nameRow}><View style={styles.nameCopy}><Text style={styles.kicker}>RIDE RECORD // {ride.status.toUpperCase()}</Text><Text style={styles.rideName}>{getRideName(ride)}</Text></View><Pressable accessibilityLabel="Edit ride name" accessibilityRole="button" onPress={openEditor} style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}><SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={18} tintColor={palette.text} /></Pressable></View>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(70).duration(420)}>
              <RideMap title="Route Replay" subtitle="Orange normal // yellow slow // red stopped" points={ride.route} segments={segments} currentPoint={null} completed replay onReplayReady={() => setReplayReady(true)} distanceLabel={`${ride.distanceKm.toFixed(2)} km`} durationLabel={formatDuration(ride.durationSeconds)} />
            </Animated.View>
            {replayReady ? <>
            <Animated.View entering={FadeInDown.duration(250)}>
              <Text style={styles.sectionTitle}>RIDE TELEMETRY</Text>
              <View style={styles.stats}>
                <TelemetryStat delay={0} label="DISTANCE" value={`${ride.distanceKm.toFixed(2)} km`} />
                <TelemetryStat delay={80} label="DURATION" value={formatDuration(ride.durationSeconds)} />
                <TelemetryStat delay={160} label="AVG SPEED" value={`${Math.round(ride.averageSpeedKmh)} km/h`} />
                <TelemetryStat delay={240} label="MAX SPEED" value={`${Math.round(ride.maximumSpeedKmh)} km/h`} />
                <TelemetryStat delay={320} label="FUEL USED" value={`${fuelUsedLiters.toFixed(2)} L`} />
                <TelemetryStat delay={400} label="EFFICIENCY" value={`${fuelEfficiency.toFixed(0)} km/L`} />
              </View>
            </Animated.View>
            {rideScore ? <RideScoreCard score={rideScore} revealDelay={520} /> : null}
            <Animated.View entering={FadeInUp.delay(1000).duration(250)}>
              <Text style={styles.sectionTitle}>RIDE INSIGHTS</Text>
              <GlassCard style={styles.insights}>
                <View style={styles.insightSummary}><Text style={styles.insightSummaryLabel}>RIDE PERSONALITY</Text><Text style={styles.insightSummaryText}>{personality}</Text></View>
                <InsightRow kind="stopped" value={`${formatInsightDuration(stoppedSeconds)} stopped`} detail={stoppedSeconds > 0 ? 'Possible traffic or waiting time' : 'No extended stops detected'} />
                <InsightRow kind="slow" value={`${formatInsightDuration(slowSeconds)} slow riding`} detail="Low-speed sections below 10 km/h" />
                <View style={styles.smartInsights}>{smartInsights.map((insight) => <View key={insight} style={styles.smartInsight}><View style={styles.smartInsightMark} /><Text style={styles.smartInsightText}>{insight}</Text></View>)}</View>
              </GlassCard>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(1180).duration(250)}>
              <Text style={styles.sectionTitle}>TIMELINE</Text>
              <GlassCard style={styles.timeline}><TimelineEvent label="START" value={formatDateTime(ride.startTime)} active /><TimelineLine /><TimelineEvent label="END" value={ride.endTime ? formatDateTime(ride.endTime) : 'Not recorded'} /></GlassCard>
            </Animated.View>
            </> : null}
          </>
        )}
      </ScrollView>
      <NameEditor visible={editing} value={draftName} saving={saving} onChange={setDraftName} onCancel={() => setEditing(false)} onSave={() => { void saveName(); }} />
      <Toast visible={message !== null} message={message ?? ''} variant={message === 'Ride renamed' ? 'success' : 'error'} presentation="hud" onHide={() => setMessage(null)} />
    </SafeAreaView>
  );
}

function Header({ onBack }: { readonly onBack: () => void }) { return <View style={styles.header}><Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.buttonPressed]}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={21} tintColor={palette.text} /></Pressable><View><Text style={styles.headerKicker}>AXIONRIDE // TELEMETRY</Text><Text style={styles.headerTitle}>Ride Detail</Text></View></View>; }
function Stat({ label, value }: { readonly label: string; readonly value: string }) { return <GlassCard style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>{value}</Text></GlassCard>; }
function TelemetryStat({ delay, label, value }: { readonly delay: number; readonly label: string; readonly value: string }) { return <Animated.View entering={FadeInDown.delay(delay).duration(360)} style={styles.statWrap}><Stat label={label} value={value} /></Animated.View>; }
function InsightRow({ kind, value, detail }: { readonly kind: 'slow' | 'stopped'; readonly value: string; readonly detail: string }) { return <View style={styles.insight}><View style={[styles.insightDot, styles[`${kind}Dot`]]} /><View style={styles.insightCopy}><Text style={styles.insightValue}>{value}</Text><Text style={styles.insightDetail}>{detail}</Text></View></View>; }
function TimelineEvent({ label, value, active = false }: { readonly label: string; readonly value: string; readonly active?: boolean }) { return <View style={styles.timelineEvent}><View style={[styles.timelineDot, active && styles.timelineDotActive]} /><View><Text style={styles.timelineLabel}>{label}</Text><Text style={styles.timelineValue}>{value}</Text></View></View>; }

function TimelineLine() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(1240, withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }));
  }, [progress]);
  const animatedStyle = useAnimatedStyle(() => ({ height: 24 * progress.value }));
  return <View style={styles.timelineLineSlot}><Animated.View style={[styles.timelineLine, animatedStyle]} /></View>;
}

function NameEditor({ visible, value, saving, onChange, onCancel, onSave }: { readonly visible: boolean; readonly value: string; readonly saving: boolean; readonly onChange: (value: string) => void; readonly onCancel: () => void; readonly onSave: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}><View style={styles.modal}><Text style={styles.modalKicker}>EDIT RIDE NAME</Text><TextInput autoFocus maxLength={120} selectTextOnFocus value={value} onChangeText={onChange} placeholder="Ride name" placeholderTextColor={palette.textMuted} style={styles.input} /><View style={styles.modalActions}><Pressable disabled={saving} onPress={onCancel} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable disabled={saving || !value.trim()} onPress={onSave} style={styles.primary}><Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save Name'}</Text></Pressable></View></View></KeyboardAvoidingView></Modal>;
}

function formatDuration(seconds: number) { const minutes = Math.floor(seconds / 60); const remaining = seconds % 60; const hours = Math.floor(minutes / 60); return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m ${remaining}s`; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070A0F' }, glow: { position: 'absolute', top: -160, right: -150, width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(255,118,23,.04)' }, content: { paddingHorizontal: 18, paddingTop: spacing.md, paddingBottom: layout.floatingTabBarContentInset, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', borderRadius: 6, backgroundColor: 'rgba(255,255,255,.035)' }, buttonPressed: { borderColor: 'rgba(255,118,23,.5)', backgroundColor: 'rgba(255,106,0,.08)', shadowColor: palette.accentOrange, shadowOpacity: .28, shadowRadius: 10, elevation: 6, transform: [{ scale: .96 }] }, headerKicker: { ...typography.label, color: palette.accentOrange, fontWeight: '900', letterSpacing: 1 }, headerTitle: { ...typography.heading, color: palette.text },
  nameRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, nameCopy: { flex: 1, minWidth: 0 }, kicker: { ...typography.label, color: palette.textMuted, letterSpacing: .8 }, rideName: { ...typography.heading, marginTop: 5, color: palette.text, fontWeight: '900' }, editButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', borderRadius: 6, backgroundColor: 'rgba(255,255,255,.04)' },
  sectionTitle: { ...typography.label, marginBottom: spacing.md, color: '#9EABB5', fontWeight: '900', letterSpacing: 1 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, statWrap: { width: '48%', flexGrow: 1 }, stat: { minHeight: 88, justifyContent: 'center', padding: spacing.md, borderRadius: 7, borderColor: 'rgba(255,255,255,.09)', backgroundColor: 'rgba(10,14,20,.92)' }, statLabel: { ...typography.label, color: palette.textMuted, letterSpacing: .7 }, statValue: { marginTop: 8, fontSize: 20, lineHeight: 24, fontWeight: '900', color: palette.text },
  insights: { gap: spacing.md, padding: spacing.lg, borderRadius: 7, borderColor: 'rgba(255,255,255,.09)', backgroundColor: 'rgba(10,14,20,.92)' }, insightSummary: { paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,.1)' }, insightSummaryLabel: { fontSize: 8, lineHeight: 10, fontWeight: '900', letterSpacing: 1, color: palette.accentOrange }, insightSummaryText: { marginTop: 5, fontSize: 16, lineHeight: 21, fontWeight: '900', color: palette.text }, insight: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, insightCopy: { flex: 1, minWidth: 0 }, insightDot: { width: 8, height: 8, borderRadius: 4 }, slowDot: { backgroundColor: '#EABF45' }, stoppedDot: { backgroundColor: '#FF4C4C' }, insightValue: { fontSize: 14, lineHeight: 18, fontWeight: '900', color: palette.text }, insightDetail: { marginTop: 2, fontSize: 10, lineHeight: 14, color: palette.textMuted }, smartInsights: { gap: 7, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,.1)' }, smartInsight: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, smartInsightMark: { width: 4, height: 4, marginTop: 7, borderRadius: 2, backgroundColor: palette.accentOrange }, smartInsightText: { flex: 1, color: '#B5C0C8', fontSize: 12, lineHeight: 17 },
  timeline: { padding: spacing.lg, borderRadius: 7, borderColor: 'rgba(255,255,255,.09)', backgroundColor: 'rgba(10,14,20,.92)' }, timelineEvent: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, timelineDot: { width: 11, height: 11, borderWidth: 2, borderColor: '#8796A1', borderRadius: 6, backgroundColor: '#0A0E14' }, timelineDotActive: { borderColor: palette.accentOrange }, timelineLineSlot: { width: 11, height: 24, alignItems: 'center' }, timelineLine: { width: 1, backgroundColor: 'rgba(255,255,255,.14)' }, timelineLabel: { ...typography.label, color: palette.textMuted }, timelineValue: { ...typography.body, marginTop: 3, color: palette.text, fontWeight: '800' },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(10,14,20,.9)' }, loadingText: { ...typography.label, color: palette.textMuted, letterSpacing: 1 }, loadingDetail: { ...typography.body, marginTop: spacing.sm, color: palette.textMuted, textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 18, backgroundColor: 'rgba(0,0,0,.7)' }, modal: { gap: spacing.lg, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', borderRadius: 10, backgroundColor: '#0B1016' }, modalKicker: { ...typography.label, color: palette.accentOrange, fontWeight: '900', letterSpacing: 1 }, input: { minHeight: 54, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', borderRadius: 6, backgroundColor: 'rgba(255,255,255,.04)', color: palette.text, fontSize: 17, fontWeight: '800' }, modalActions: { flexDirection: 'row', gap: spacing.sm }, secondary: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', borderRadius: 6 }, primary: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: palette.accentOrange }, secondaryText: { ...typography.button, color: palette.text }, primaryText: { ...typography.button, color: '#FFF' },
});

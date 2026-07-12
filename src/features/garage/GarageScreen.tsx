import { useFocusEffect, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaintenanceStatus, MaintenanceType, type Maintenance } from '@/src/domain/maintenance';
import type { Motorcycle } from '@/src/domain/motorcycle';
import { createMaintenanceService, createMotorcycleService, type MaintenanceListItem, type MotorcycleOverview } from '@/src/services';
import { layout, motion, premiumColors, spacing } from '@/src/theme';

import { EmptyGarage } from './components/EmptyGarage';
import { GarageActionCard } from './components/GarageActionCard';
import { GarageHeader } from './components/GarageHeader';
import { GarageErrorState, GarageLoadingState } from './components/GarageStateCard';
import { MotorcycleHeroCard } from './components/MotorcycleHeroCard';
import { SecondaryMotorcycleList } from './components/SecondaryMotorcycleList';
import type { GarageMaintenanceSummary } from './types';

const emptyOverview: MotorcycleOverview = { motorcycles: [], primaryMotorcycleId: null };

export function GarageScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const motorcycleService = useMemo(() => createMotorcycleService(), []);
  const maintenanceService = useMemo(() => createMaintenanceService(), []);
  const [overview, setOverview] = useState<MotorcycleOverview>(emptyOverview);
  const [upcoming, setUpcoming] = useState<readonly MaintenanceListItem[]>([]);
  const [history, setHistory] = useState<readonly MaintenanceListItem[]>([]);
  const [maintenanceAvailable, setMaintenanceAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const compact = width < 380;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const motorcycleResult = await motorcycleService.getOverview();
      if (!motorcycleResult.ok) { setError(motorcycleResult.error.message); return; }
      setOverview(motorcycleResult.value);
      const [upcomingResult, historyResult] = await Promise.all([
        maintenanceService.getUpcomingMaintenance(),
        maintenanceService.getMaintenanceHistory(),
      ]);
      setUpcoming(upcomingResult.ok ? upcomingResult.value : []);
      setHistory(historyResult.ok ? historyResult.value : []);
      setMaintenanceAvailable(upcomingResult.ok && historyResult.ok);
    } catch {
      setError('Local motorcycle data could not be loaded. Your records were not changed.');
    } finally {
      setLoading(false);
    }
  }, [maintenanceService, motorcycleService]);

  useFocusEffect(useCallback(() => {
    setOverview(emptyOverview);
    setUpcoming([]);
    setHistory([]);
    setMaintenanceAvailable(true);
    setLoading(true);
    void refresh();
  }, [refresh]));

  const primary = overview.motorcycles.find((motorcycle) => motorcycle.id === overview.primaryMotorcycleId) ?? overview.motorcycles[0] ?? null;
  const secondary = primary ? overview.motorcycles.filter((motorcycle) => motorcycle.id !== primary.id) : [];
  const maintenanceSummary = useMemo(() => createMaintenanceSummary(primary, upcoming, history, maintenanceAvailable), [history, maintenanceAvailable, primary, upcoming]);

  function addMotorcycle() { router.push('/motorcycle-management'); }
  function editMotorcycle(id: string) { router.push({ pathname: '/motorcycle-management', params: { id } }); }

  async function setPrimary(id: string) {
    const result = await motorcycleService.setPrimaryMotorcycle(id);
    if (!result.ok) Alert.alert('Primary motorcycle not changed', result.error.message);
    await refresh();
  }

  function confirmDelete(motorcycle: Motorcycle) {
    Alert.alert('Delete motorcycle?', `${motorcycle.nickname} will be removed from this local workspace.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void motorcycleService.deleteMotorcycle(motorcycle.id).then(async (result) => { if (!result.ok) Alert.alert('Motorcycle not deleted', result.error.message); await refresh(); }); } },
    ]);
  }

  function openMenu(motorcycle: Motorcycle) {
    const isPrimary = motorcycle.id === primary?.id;
    Alert.alert(motorcycle.nickname, isPrimary ? 'Primary motorcycle' : 'Motorcycle actions', [
      ...(!isPrimary ? [{ text: 'Make Primary', onPress: () => { void setPrimary(motorcycle.id); } }] : []),
      { text: 'Edit', onPress: () => editMotorcycle(motorcycle.id) },
      { text: 'Delete', style: 'destructive' as const, onPress: () => confirmDelete(motorcycle) },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.topGlow} />
      <View style={styles.sideGlow} />
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, compact ? styles.contentCompact : null]} showsVerticalScrollIndicator={false}>
        <GarageHeader onAdd={addMotorcycle} />

        {loading ? <GarageLoadingState /> : error ? <GarageErrorState message={error} onRetry={() => { setLoading(true); void refresh(); }} /> : overview.motorcycles.length === 0 ? <EmptyGarage onAdd={addMotorcycle} /> : primary ? (
          <>
            <AnimatedEntrance delay={60} reduceMotion={reduceMotion}>
              <MotorcycleHeroCard motorcycle={primary} maintenance={maintenanceSummary} compact={compact} onEdit={() => editMotorcycle(primary.id)} onMenu={() => openMenu(primary)} />
            </AnimatedEntrance>
            <AnimatedEntrance delay={130} reduceMotion={reduceMotion}>
              <GarageActionCard title="Maintenance Hub" subtitle="View history and upcoming tasks" icon="maintenance" accessibilityLabel="Open Maintenance Hub" onPress={() => router.push('/maintenance')} />
            </AnimatedEntrance>
            <AnimatedEntrance delay={200} reduceMotion={reduceMotion}>
              <SecondaryMotorcycleList motorcycles={secondary} onEdit={editMotorcycle} onMenu={openMenu} />
            </AnimatedEntrance>
            <AnimatedEntrance delay={270} reduceMotion={reduceMotion}>
              <GarageActionCard title="Protect your ride" subtitle="Insurance and documents • Coming later" icon="protect" accessibilityLabel="Protect your ride. Coming later." disabled />
            </AnimatedEntrance>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createMaintenanceSummary(primary: Motorcycle | null, upcoming: readonly MaintenanceListItem[], history: readonly MaintenanceListItem[], maintenanceAvailable: boolean): GarageMaintenanceSummary {
  if (!primary) return { statusLabel: 'Status not recorded', statusTone: 'neutral', nextMaintenanceLabel: 'Not scheduled', lastOilChangeLabel: 'No record', progressPercent: null };
  if (!maintenanceAvailable) return { statusLabel: 'Maintenance unavailable', statusTone: 'neutral', nextMaintenanceLabel: 'Unavailable', lastOilChangeLabel: 'Unavailable', progressPercent: null };
  const motorcycleUpcoming = upcoming.filter((item) => item.maintenance.motorcycleId === primary.id);
  const next = motorcycleUpcoming[0];
  const hasOverdue = motorcycleUpcoming.some((item) => item.maintenance.status === MaintenanceStatus.Overdue);
  const oilChange = history.find((item) => item.maintenance.motorcycleId === primary.id && item.maintenance.type === MaintenanceType.OilChange)?.maintenance;
  return {
    statusLabel: hasOverdue ? 'Service overdue' : 'No overdue service',
    statusTone: hasOverdue ? 'danger' : 'success',
    nextMaintenanceLabel: formatNextMaintenance(next),
    lastOilChangeLabel: formatLastOilChange(primary, oilChange),
    progressPercent: next ? Math.max(0, Math.min(100, Math.round(next.progress * 100))) : null,
  };
}

function formatNextMaintenance(item: MaintenanceListItem | undefined) {
  if (!item) return 'Not scheduled';
  if (item.remainingKm !== null) return item.remainingKm <= 0 ? 'Due now' : `in ${Math.round(item.remainingKm).toLocaleString()} km`;
  if (item.remainingDays !== null) return item.remainingDays <= 0 ? 'Due now' : `in ${Math.round(item.remainingDays)} days`;
  return 'Scheduled';
}

function formatLastOilChange(motorcycle: Motorcycle, record: Maintenance | undefined) {
  if (!record || record.lastServiceOdometerKm === undefined) return 'No record';
  return `${Math.max(0, Math.round(motorcycle.odometerKm - record.lastServiceOdometerKm)).toLocaleString()} km ago`;
}

function AnimatedEntrance({ children, delay, reduceMotion }: { readonly children: ReactNode; readonly delay: number; readonly reduceMotion: boolean }) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) { progress.setValue(1); return; }
    Animated.timing(progress, { toValue: 1, delay, duration: motion.duration.slow, useNativeDriver: true }).start();
  }, [delay, progress, reduceMotion]);
  return <Animated.View style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: premiumColors.background },
  topGlow: { position: 'absolute', top: -140, right: -140, width: 330, height: 330, borderRadius: 165, backgroundColor: 'rgba(45, 63, 82, 0.11)' },
  sideGlow: { position: 'absolute', top: 330, left: -180, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255, 106, 0, 0.035)' },
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: layout.floatingTabBarContentInset + spacing.xl, gap: spacing.xl },
  contentCompact: { paddingHorizontal: spacing.lg, gap: spacing.lg },
});

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createMaintenanceService, type CreateMaintenanceInput, type MaintenanceListItem } from '@/src/services';
import { layout, palette, spacing } from '@/src/theme';

import { MaintenanceCreateSheet } from './components/MaintenanceCreateSheet';
import { EmptyMaintenanceState } from './components/EmptyMaintenanceState';
import { MaintenanceHeader } from './components/MaintenanceHeader';
import { MaintenanceQuickActions } from './components/MaintenanceQuickActions';
import { MaintenanceStatusCard } from './components/MaintenanceStatusCard';
import { MaintenanceSummaryGrid } from './components/MaintenanceSummaryGrid';
import { MaintenanceTaskCard } from './components/MaintenanceTaskCard';
import { MaintenanceTimeline } from './components/MaintenanceTimeline';
import type { MaintenanceData, MaintenanceStatus } from './types';

export function MaintenanceScreen() {
  const maintenanceService = useMemo(() => createMaintenanceService(), []);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<readonly MaintenanceListItem[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<readonly MaintenanceListItem[]>([]);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const maintenanceData = useMemo(
    () => createMaintenanceData(upcomingMaintenance, maintenanceHistory),
    [upcomingMaintenance, maintenanceHistory],
  );
  const refreshMaintenance = useCallback(async () => {
    const [upcomingResult, historyResult] = await Promise.all([
      maintenanceService.getUpcomingMaintenance(),
      maintenanceService.getMaintenanceHistory(),
    ]);

    if (upcomingResult.ok) {
      setUpcomingMaintenance(upcomingResult.value);
    } else {
      Alert.alert('Maintenance unavailable', upcomingResult.error.message);
    }

    if (historyResult.ok) {
      setMaintenanceHistory(historyResult.value);
    } else {
      Alert.alert('Maintenance history unavailable', historyResult.error.message);
    }
  }, [maintenanceService]);

  useEffect(() => {
    void refreshMaintenance();
  }, [refreshMaintenance]);

  async function handleCreateMaintenance(input: CreateMaintenanceInput) {
    setSaving(true);
    const result = await maintenanceService.createMaintenance(input);
    setSaving(false);

    if (!result.ok) {
      Alert.alert('Maintenance not saved', result.error.message);
      return;
    }

    setCreateSheetVisible(false);
    await refreshMaintenance();
  }

  async function handleCompleteMaintenance(id: string) {
    const result = await maintenanceService.completeMaintenance({ id });

    if (!result.ok) {
      Alert.alert('Maintenance not completed', result.error.message);
      return;
    }

    await refreshMaintenance();
  }

  function handleLogService() {
    const firstMaintenance = upcomingMaintenance[0];

    if (!firstMaintenance) {
      setCreateSheetVisible(true);
      return;
    }

    Alert.alert('Complete service?', `Mark ${firstMaintenance.maintenance.title} as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => {
          void handleCompleteMaintenance(firstMaintenance.maintenance.id);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <MaintenanceHeader onAdd={() => setCreateSheetVisible(true)} />

        <AnimatedEntrance delay={80}>
          <MaintenanceStatusCard status={maintenanceData.overallStatus} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={180}>
          <MaintenanceSummaryGrid summary={maintenanceData.summary} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={280}>
          <View style={styles.section}>
            <View>
              <Text style={styles.sectionTitle}>Upcoming Maintenance</Text>
              <Text style={styles.sectionSubtitle}>Service tasks staged for this motorcycle</Text>
            </View>
            {maintenanceData.upcomingTasks.length > 0 ? (
              <View style={styles.taskStack}>
                {maintenanceData.upcomingTasks.map((task) => (
                  <MaintenanceTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => {
                      void handleCompleteMaintenance(task.id);
                    }}
                  />
                ))}
              </View>
            ) : (
              <EmptyMaintenanceState />
            )}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={380}>
          <MaintenanceTimeline items={maintenanceData.timeline} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={480}>
          <MaintenanceQuickActions
            onAddMaintenance={() => setCreateSheetVisible(true)}
            onLogService={handleLogService}
            onViewHistory={() => Alert.alert('Maintenance History', `${maintenanceHistory.length} completed service records.`)}
          />
        </AnimatedEntrance>
      </ScrollView>
      <MaintenanceCreateSheet
        visible={createSheetVisible}
        loading={saving}
        onClose={() => setCreateSheetVisible(false)}
        onCreate={(input) => {
          void handleCreateMaintenance(input);
        }}
      />
    </SafeAreaView>
  );
}

function createMaintenanceData(
  upcomingMaintenance: readonly MaintenanceListItem[],
  maintenanceHistory: readonly MaintenanceListItem[],
): MaintenanceData {
  const nextMaintenance = upcomingMaintenance[0];
  const completedCost = maintenanceHistory.reduce(
    (total, item) => total + (item.maintenance.cost ?? 0),
    0,
  );

  return {
    overallStatus: nextMaintenance
      ? {
          status: toDisplayStatus(nextMaintenance.statusLabel),
          nextService: nextMaintenance.maintenance.title,
          remainingDistance: formatRemaining(nextMaintenance),
          progress: nextMaintenance.progress,
        }
      : {
          status: 'Good',
          nextService: 'No service queued',
          remainingDistance: 'Add maintenance to begin tracking',
          progress: 0,
        },
    summary: [
      {
        label: 'Upcoming',
        value: String(upcomingMaintenance.length),
        detail: 'Active service tasks',
        accent: 'orange',
      },
      {
        label: 'Overdue',
        value: String(upcomingMaintenance.filter((item) => item.statusLabel === 'Overdue').length),
        detail: 'Needs attention',
        accent: 'danger',
      },
      {
        label: 'Completed',
        value: String(maintenanceHistory.length),
        detail: 'Logged services',
        accent: 'success',
      },
      {
        label: 'Total Cost',
        value: `PHP ${completedCost.toLocaleString()}`,
        detail: 'Completed spend',
        accent: 'warning',
      },
    ],
    upcomingTasks: upcomingMaintenance.map((item) => ({
      id: item.maintenance.id,
      title: item.maintenance.title,
      remainingDistance: formatRemaining(item),
      status: toDisplayStatus(item.statusLabel),
    })),
    timeline: maintenanceHistory.map((item) => ({
      id: item.maintenance.id,
      title: item.maintenance.title,
      description: item.maintenance.description ?? item.maintenance.notes ?? 'Service completed.',
      completedAt: formatDate(item.maintenance.updatedAt),
    })),
  };
}

function toDisplayStatus(statusLabel: string): MaintenanceStatus {
  if (statusLabel === 'Due Soon' || statusLabel === 'Overdue' || statusLabel === 'Completed') {
    return statusLabel;
  }

  if (statusLabel === 'Unknown') {
    return 'Unknown';
  }

  return 'Good';
}

function formatRemaining(item: MaintenanceListItem) {
  if (item.remainingKm !== null) {
    return `${Math.round(item.remainingKm).toLocaleString()} km remaining`;
  }

  if (item.remainingDays !== null) {
    return `${Math.round(item.remainingDays).toLocaleString()} days remaining`;
  }

  return 'Waiting for service baseline';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  taskStack: {
    gap: spacing.md,
  },
});

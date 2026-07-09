import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, palette, spacing } from '@/src/theme';

import { EmptyMaintenanceState } from './components/EmptyMaintenanceState';
import { MaintenanceHeader } from './components/MaintenanceHeader';
import { MaintenanceQuickActions } from './components/MaintenanceQuickActions';
import { MaintenanceStatusCard } from './components/MaintenanceStatusCard';
import { MaintenanceSummaryGrid } from './components/MaintenanceSummaryGrid';
import { MaintenanceTaskCard } from './components/MaintenanceTaskCard';
import { MaintenanceTimeline } from './components/MaintenanceTimeline';
import { mockMaintenance } from './data/mockMaintenance';

export function MaintenanceScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <MaintenanceHeader />

        <AnimatedEntrance delay={80}>
          <MaintenanceStatusCard status={mockMaintenance.overallStatus} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={180}>
          <MaintenanceSummaryGrid summary={mockMaintenance.summary} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={280}>
          <View style={styles.section}>
            <View>
              <Text style={styles.sectionTitle}>Upcoming Maintenance</Text>
              <Text style={styles.sectionSubtitle}>Service tasks staged for this motorcycle</Text>
            </View>
            {mockMaintenance.upcomingTasks.length > 0 ? (
              <View style={styles.taskStack}>
                {mockMaintenance.upcomingTasks.map((task) => (
                  <MaintenanceTaskCard key={task.id} task={task} />
                ))}
              </View>
            ) : (
              <EmptyMaintenanceState />
            )}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={380}>
          <MaintenanceTimeline items={mockMaintenance.timeline} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={480}>
          <MaintenanceQuickActions />
        </AnimatedEntrance>
      </ScrollView>
    </SafeAreaView>
  );
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

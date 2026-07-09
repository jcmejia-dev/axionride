import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components';
import { createStatisticsService, type StatisticsDashboardSummary } from '@/src/services';
import { layout, palette, spacing } from '@/src/theme';

import { CurrentMotorcycleCard } from './components/CurrentMotorcycleCard';
import { DashboardHeader } from './components/DashboardHeader';
import { MonthlyStatsGrid } from './components/MonthlyStatsGrid';
import { NextMaintenanceCard } from './components/NextMaintenanceCard';
import { QuickActions } from './components/QuickActions';
import { RecentRideCard } from './components/RecentRideCard';
import { SearchSheet } from './components/SearchSheet';
import { StatisticsSummary } from './components/StatisticsSummary';
import { WeatherRideCard } from './components/WeatherRideCard';
import { mockDashboardData } from './data/mockDashboardData';

export function DashboardScreen() {
  const greeting = getGreeting(new Date());
  const statisticsService = useMemo(() => createStatisticsService(), []);
  const [statisticsSummary, setStatisticsSummary] = useState<StatisticsDashboardSummary | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);
  const loadStatistics = useCallback(async () => {
    const result = await statisticsService.getDashboardStatistics();

    if (result.ok) {
      setStatisticsSummary(result.value);
    }

    setStatisticsLoading(false);
  }, [statisticsService]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <DashboardHeader greeting={greeting} onOpenSearch={() => setSearchVisible(true)} />

        <View style={styles.stack}>
          <AnimatedEntrance delay={80}>
            {mockDashboardData.motorcycle ? (
              <CurrentMotorcycleCard motorcycle={mockDashboardData.motorcycle} />
            ) : (
              <EmptyState title="No motorcycle selected" description="Your current motorcycle will appear here once one is available." />
            )}
          </AnimatedEntrance>

          <AnimatedEntrance delay={180}>
            {mockDashboardData.weather ? (
              <WeatherRideCard weather={mockDashboardData.weather} />
            ) : (
              <EmptyState title="No ride conditions" description="Weather and ride condition summaries will appear here later." />
            )}
          </AnimatedEntrance>

          <AnimatedEntrance delay={280}>
            <QuickActions actions={mockDashboardData.quickActions} />
          </AnimatedEntrance>

          <AnimatedEntrance delay={380}>
            <StatisticsSummary summary={statisticsSummary} loading={statisticsLoading} />
          </AnimatedEntrance>

          <AnimatedEntrance delay={480}>
            {mockDashboardData.maintenance ? (
              <NextMaintenanceCard maintenance={mockDashboardData.maintenance} />
            ) : (
              <EmptyState title="No maintenance due" description="Upcoming service reminders will appear here." />
            )}
          </AnimatedEntrance>

          <AnimatedEntrance delay={580}>
            <MonthlyStatsGrid stats={mockDashboardData.monthlyStats} />
          </AnimatedEntrance>

          <AnimatedEntrance delay={680}>
            {mockDashboardData.recentRide ? (
              <RecentRideCard ride={mockDashboardData.recentRide} />
            ) : (
              <EmptyState title="No recent ride" description="Recent ride summaries will appear here once ride tracking is available." />
            )}
          </AnimatedEntrance>
        </View>
      </ScrollView>
      <SearchSheet visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </SafeAreaView>
  );
}

type AnimatedEntranceProps = {
  children: ReactNode;
  delay: number;
  style?: ViewStyle;
};

function AnimatedEntrance({ children, delay, style }: AnimatedEntranceProps) {
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
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [28, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  }

  if (hour < 18) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
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
  stack: {
    gap: spacing.xxl,
  },
});

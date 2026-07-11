import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { createStatisticsService, type StatisticsDashboardSummary } from '@/src/services';
import { layout, premiumColors, spacing } from '@/src/theme';

import { DashboardMetricStrip } from './components/DashboardMetricStrip';
import { DashboardTopHeader } from './components/DashboardTopHeader';
import { MonthlyStatsCard } from './components/MonthlyStatsCard';
import { MotorcycleHeroSection } from './components/MotorcycleHeroSection';
import { RecentRideCard } from './components/RecentRideCard';
import { SearchSheet } from './components/SearchSheet';
import { WeatherRideCard } from './components/WeatherRideCard';
import { mockDashboardData } from './data/mockDashboardData';

export function DashboardScreen() {
  const greeting = getGreeting(new Date());
  const router = useRouter();
  const { width } = useWindowDimensions();
  const statisticsService = useMemo(() => createStatisticsService(), []);
  const [statisticsSummary, setStatisticsSummary] = useState<StatisticsDashboardSummary | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);
  const stackCards = width < 430;

  const loadStatistics = useCallback(async () => {
    setStatisticsLoading(true);
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
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DashboardTopHeader greeting={greeting} riderName="Rider" onOpenSettings={() => setSearchVisible(true)} />

        <View style={styles.stack}>
          <AnimatedEntrance delay={80}>
            <MotorcycleHeroSection
              loading={statisticsLoading}
              motorcycle={statisticsSummary?.motorcycles.defaultMotorcycle ?? null}
              onPress={() => router.push('/garage')}
            />
          </AnimatedEntrance>

          {mockDashboardData.weather ? (
            <AnimatedEntrance delay={170}>
              <WeatherRideCard weather={mockDashboardData.weather} />
            </AnimatedEntrance>
          ) : null}

          <AnimatedEntrance delay={230}>
            <DashboardMetricStrip loading={statisticsLoading} summary={statisticsSummary} />
          </AnimatedEntrance>

          <AnimatedEntrance delay={310} style={[styles.cardGrid, stackCards ? styles.cardGridStacked : null]}>
            <RecentRideCard loading={statisticsLoading} ride={statisticsSummary?.recentRide ?? null} onPress={() => router.push('/rides')} />
            <MonthlyStatsCard loading={statisticsLoading} summary={statisticsSummary} />
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
  style?: StyleProp<ViewStyle>;
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
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: premiumColors.background,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -140,
    right: -140,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 110,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(255, 106, 0, 0.08)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: spacing.sm,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: 26,
  },
  stack: {
    gap: 18,
  },
  cardGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  cardGridStacked: {
    flexDirection: 'column',
  },
});

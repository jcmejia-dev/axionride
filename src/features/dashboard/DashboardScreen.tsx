import { useFocusEffect, useRouter, type Href } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth, useRiderProgress } from "@/src/providers";
import { DailyChallengeCard, type DailyRideChallenge } from "@/src/features/daily-challenge";
import { AchievementsShowcaseModal } from "@/src/features/rider-progress";
import {
  createDailyChallengeService,
  createStatisticsService,
  createWeatherService,
  type CurrentWeather,
  type StatisticsDashboardSummary,
} from "@/src/services";
import { layout, premiumColors, spacing } from "@/src/theme";

import { DashboardMetricStrip } from "./components/DashboardMetricStrip";
import { DashboardBackdrop } from "./components/DashboardBackdrop";
import { DashboardLoadingCards } from "./components/DashboardLoadingCards";
import { DashboardTopHeader } from "./components/DashboardTopHeader";
import { MonthlyStatsCard } from "./components/MonthlyStatsCard";
import { MotorcycleHeroSection } from "./components/MotorcycleHeroSection";
import { NearbyServicesCard } from "./components/NearbyServicesCard";
import { RecentRideCard } from "./components/RecentRideCard";
import { SearchSheet } from "./components/SearchSheet";
import { WeatherRideCard } from "./components/WeatherRideCard";
import type { DashboardWeather, WeatherCondition } from "./types";

type DashboardSnapshot = {
  readonly statistics: StatisticsDashboardSummary | null;
  readonly weather: DashboardWeather | null;
};

const dashboardSnapshotCache = new Map<string, DashboardSnapshot>();

export function DashboardScreen() {
  const greeting = getGreeting(new Date());
  const { user } = useAuth();
  const { snapshot: riderProgress, recordStatsViewed } = useRiderProgress();
  const riderName =
    typeof user?.user_metadata.display_name === "string" &&
    user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : (user?.email?.split("@")[0] ?? "Rider");
  const router = useRouter();
  const { width } = useWindowDimensions();
  const statisticsService = useMemo(() => createStatisticsService(), []);
  const weatherService = useMemo(() => createWeatherService(), []);
  const dailyChallengeService = useMemo(() => createDailyChallengeService(), []);
  const cacheKey = user?.id ?? "anonymous";
  const cachedSnapshot = dashboardSnapshotCache.get(cacheKey);
  const [statisticsSummary, setStatisticsSummary] =
    useState<StatisticsDashboardSummary | null>(() => cachedSnapshot?.statistics ?? null);
  const [statisticsLoading, setStatisticsLoading] = useState(() => !cachedSnapshot?.statistics);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<DashboardWeather | null>(() => cachedSnapshot?.weather ?? null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [achievementsVisible, setAchievementsVisible] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyRideChallenge | null>(null);
  const loadRequestId = useRef(0);
  const stackCards = width < 430;

  const loadDashboard = useCallback(async (showRefreshIndicator = false) => {
    const requestId = ++loadRequestId.current;
    if (!dashboardSnapshotCache.get(cacheKey)?.statistics) setStatisticsLoading(true);
    if (showRefreshIndicator) setRefreshing(true);

    const statisticsPromise = statisticsService.getDashboardStatistics().then((result) => {
      if (requestId !== loadRequestId.current) return;
      if (result.ok) {
        setStatisticsSummary(result.value);
        updateDashboardCache(cacheKey, { statistics: result.value });
      }
      setStatisticsLoading(false);
      setRefreshing(false);
    });
    const weatherPromise = weatherService.getCurrentWeather().then((result) => {
      if (requestId !== loadRequestId.current || !result.ok) return;
      const nextWeather = toDashboardWeather(result.value);
      setWeather(nextWeather);
      updateDashboardCache(cacheKey, { weather: nextWeather });
    });
    const progressPromise = recordStatsViewed();
    const challengePromise = dailyChallengeService.getTodayChallenge().then((result) => {
      if (requestId !== loadRequestId.current || !result.ok) return;
      setDailyChallenge(result.value);
    });

    await Promise.allSettled([statisticsPromise, weatherPromise, progressPromise, challengePromise]);
    if (requestId === loadRequestId.current) {
      setStatisticsLoading(false);
      setRefreshing(false);
    }
  }, [cacheKey, dailyChallengeService, recordStatsViewed, statisticsService, weatherService]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <DashboardBackdrop />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={premiumColors.primary}
            colors={[premiumColors.primary]}
            onRefresh={() => {
              void loadDashboard(true);
            }}
          />
        }
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DashboardTopHeader
          greeting={greeting}
          riderName={riderName}
          riderProgress={riderProgress}
          onOpenAchievements={() => setAchievementsVisible(true)}
          onOpenSearch={() => setSearchVisible(true)}
        />

        <View style={styles.stack}>
          {dailyChallenge ? <AnimatedEntrance delay={50}><DailyChallengeCard challenge={dailyChallenge} /></AnimatedEntrance> : null}
          {statisticsLoading && !statisticsSummary ? (
            <DashboardLoadingCards stacked={stackCards} />
          ) : (
            <>
          <AnimatedEntrance delay={80}>
            <MotorcycleHeroSection
              loading={statisticsLoading}
              motorcycle={
                statisticsSummary?.motorcycles.defaultMotorcycle ?? null
              }
              onPress={() => router.push("/garage")}
            />
          </AnimatedEntrance>

          <AnimatedEntrance delay={170}>
            <DashboardMetricStrip
              loading={statisticsLoading}
              summary={statisticsSummary}
            />
          </AnimatedEntrance>

          {weather ? (
            <AnimatedEntrance delay={210}>
              <WeatherRideCard weather={weather} />
            </AnimatedEntrance>
          ) : null}

          <AnimatedEntrance
            delay={250}
            style={[
              styles.cardGrid,
              stackCards ? styles.cardGridStacked : null,
            ]}
          >
            <RecentRideCard
              loading={statisticsLoading}
              ride={statisticsSummary?.recentRide ?? null}
              onPress={() => router.push("/ride-history" as Href)}
            />
            <MonthlyStatsCard
              loading={statisticsLoading}
              summary={statisticsSummary}
            />
          </AnimatedEntrance>

            </>
          )}

          <AnimatedEntrance delay={290}>
            <NearbyServicesCard
              onPress={() => router.push("/nearby-services" as Href)}
            />
          </AnimatedEntrance>
        </View>
      </ScrollView>
      <SearchSheet
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
      <AchievementsShowcaseModal
        onClose={() => setAchievementsVisible(false)}
        snapshot={riderProgress}
        visible={achievementsVisible}
      />
    </SafeAreaView>
  );
}

function toDashboardWeather(weather: CurrentWeather): DashboardWeather {
  return {
    condition: toCondition(weather.weatherCode, weather.temperatureCelsius, weather.windKmh),
    temperature: `${Math.round(weather.temperatureCelsius)}°C`,
    rideCondition: "Current local conditions",
    wind: `${Math.round(weather.windKmh)} km/h`,
    rainChance: `${weather.precipitationMm.toFixed(1)} mm`,
    humidityPercent: weather.humidityPercent === null ? null : Math.round(weather.humidityPercent),
  };
}
function toCondition(code: number, temperature: number, windKmh: number): WeatherCondition {
  if (code >= 95) return "Stormy";
  if (code >= 51) return "Rainy";
  if (windKmh >= 25) return "Windy";
  if (code >= 2) return "Cloudy";
  if (temperature >= 34) return "Hot";
  return "Sunny";
}

function updateDashboardCache(cacheKey: string, patch: Partial<DashboardSnapshot>) {
  const current = dashboardSnapshotCache.get(cacheKey) ?? { statistics: null, weather: null };
  dashboardSnapshotCache.set(cacheKey, { ...current, ...patch });
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
      ]}
    >
      {children}
    </Animated.View>
  );
}

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#04080D",
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: spacing.sm,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: 24,
  },
  stack: {
    gap: 20,
  },
  cardGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
  },
  cardGridStacked: {
    flexDirection: "column",
  },
});

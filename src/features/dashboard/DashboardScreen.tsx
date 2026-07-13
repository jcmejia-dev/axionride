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

import { useAuth } from "@/src/providers";
import {
  createStatisticsService,
  createWeatherService,
  type CurrentWeather,
  type StatisticsDashboardSummary,
} from "@/src/services";
import { layout, premiumColors, spacing } from "@/src/theme";

import { DashboardMetricStrip } from "./components/DashboardMetricStrip";
import { DashboardTopHeader } from "./components/DashboardTopHeader";
import { MonthlyStatsCard } from "./components/MonthlyStatsCard";
import { MotorcycleHeroSection } from "./components/MotorcycleHeroSection";
import { NearbyServicesCard } from "./components/NearbyServicesCard";
import { RecentRideCard } from "./components/RecentRideCard";
import { SearchSheet } from "./components/SearchSheet";
import { WeatherRideCard } from "./components/WeatherRideCard";
import type { DashboardWeather, WeatherCondition } from "./types";

export function DashboardScreen() {
  const greeting = getGreeting(new Date());
  const { user } = useAuth();
  const riderName =
    typeof user?.user_metadata.display_name === "string" &&
    user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : (user?.email?.split("@")[0] ?? "Rider");
  const router = useRouter();
  const { width } = useWindowDimensions();
  const statisticsService = useMemo(() => createStatisticsService(), []);
  const weatherService = useMemo(() => createWeatherService(), []);
  const [statisticsSummary, setStatisticsSummary] =
    useState<StatisticsDashboardSummary | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [weather, setWeather] = useState<DashboardWeather | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const stackCards = width < 430;

  const loadStatistics = useCallback(async () => {
    setStatisticsLoading(true);
    const result = await statisticsService.getDashboardStatistics();
    const weatherResult = await weatherService.getCurrentWeather();

    if (result.ok) {
      setStatisticsSummary(result.value);
    }
    setWeather(
      weatherResult.ok ? toDashboardWeather(weatherResult.value) : null,
    );

    setStatisticsLoading(false);
  }, [statisticsService, weatherService]);

  useFocusEffect(
    useCallback(() => {
      void loadStatistics();
    }, [loadStatistics]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={statisticsLoading}
            tintColor={premiumColors.primary}
            colors={[premiumColors.primary]}
            onRefresh={() => {
              void loadStatistics();
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
          onOpenSettings={() => setSearchVisible(true)}
        />

        <View style={styles.stack}>
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
              onPress={() => router.push("/rides")}
            />
            <MonthlyStatsCard
              loading={statisticsLoading}
              summary={statisticsSummary}
            />
          </AnimatedEntrance>

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
    </SafeAreaView>
  );
}

function toDashboardWeather(weather: CurrentWeather): DashboardWeather {
  return {
    condition: toCondition(weather.weatherCode, weather.temperatureCelsius),
    temperature: `${Math.round(weather.temperatureCelsius)}°C`,
    rideCondition: "Current local conditions",
    wind: `${Math.round(weather.windKmh)} km/h`,
    rainChance: `${weather.precipitationMm.toFixed(1)} mm`,
  };
}
function toCondition(code: number, temperature: number): WeatherCondition {
  if (code >= 95) return "Stormy";
  if (code >= 51) return "Rainy";
  if (code >= 2) return "Cloudy";
  if (temperature >= 34) return "Hot";
  return "Sunny";
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
    backgroundColor: premiumColors.background,
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -140,
    right: -140,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: 110,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(255, 106, 0, 0.08)",
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
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
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  cardGridStacked: {
    flexDirection: "column",
  },
});

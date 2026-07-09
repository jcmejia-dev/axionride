import type { ComponentProps } from 'react';
import type { SymbolView } from 'expo-symbols';

type DashboardSymbolName = ComponentProps<typeof SymbolView>['name'];

export type DashboardMotorcycle = {
  name: string;
  status: string;
  displacement: string;
  odometer: string;
  lastUpdated: string;
};

export type DashboardMaintenance = {
  task: string;
  remainingDistance: string;
  status: string;
  progress: number;
};

export type DashboardStat = {
  label: string;
  value: string;
  detail?: string;
  accent: 'orange' | 'cyan' | 'success' | 'warning';
};

export type DashboardRide = {
  when: string;
  distance: string;
  duration: string;
  averageSpeed: string;
};

export type WeatherCondition = 'Sunny' | 'Rainy' | 'Cloudy' | 'Stormy' | 'Hot';

export type DashboardWeather = {
  condition: WeatherCondition;
  temperature: string;
  rideCondition: string;
  wind: string;
  rainChance: string;
};

export type DashboardQuickAction = {
  label: string;
  icon: DashboardSymbolName;
};

export type DashboardData = {
  motorcycle: DashboardMotorcycle | null;
  maintenance: DashboardMaintenance | null;
  weather: DashboardWeather | null;
  monthlyStats: DashboardStat[];
  recentRide: DashboardRide | null;
  quickActions: DashboardQuickAction[];
};

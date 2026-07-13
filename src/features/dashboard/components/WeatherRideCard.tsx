import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/premium';
import { iconSizes, premiumColors, radius, spacing, typography } from '@/src/theme';

import type { DashboardWeather } from '../types';
import { getWeatherRideMessage } from '../weatherMessage';
import { WeatherAnimation } from './WeatherAnimation';

type WeatherRideCardProps = {
  readonly weather: DashboardWeather;
};

export function WeatherRideCard({ weather }: WeatherRideCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View pointerEvents="none" style={[styles.backgroundTint, getWeatherTint(weather.condition)]} />
      <WeatherAnimation type={weather.condition} />
      <View pointerEvents="none" style={[styles.glow, getGlowTint(weather.condition)]} />
      <View style={styles.iconShell}>
        <SymbolView name={getConditionIcon(weather.condition)} tintColor={premiumColors.primaryBright} size={iconSizes.lg} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Ride Conditions</Text>
        <Text numberOfLines={1} style={styles.title}>
          {weather.temperature} - {weather.condition}
        </Text>
        <Text numberOfLines={2} style={styles.message}>
          {getWeatherRideMessage(weather.condition)}
        </Text>
        <HumidityChip humidity={weather.humidityPercent} />
      </View>
      <View style={styles.chips}>
        <WeatherChip label="Wind" value={weather.wind} />
        <WeatherChip label="Rain" value={weather.rainChance} />
      </View>
    </GlassCard>
  );
}

function HumidityChip({ humidity }: { readonly humidity: number | null }) {
  if (humidity === null) return null;

  const label = humidity > 80 ? 'Very humid' : humidity >= 60 ? 'Humid' : 'Comfortable';

  return (
    <View style={styles.humidityChip}>
      <SymbolView
        name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        tintColor={premiumColors.blue}
        size={12}
      />
      <Text style={styles.humidityText}>{label}</Text>
    </View>
  );
}

function getWeatherTint(condition: DashboardWeather['condition']) {
  if (condition === 'Rainy' || condition === 'Stormy') return styles.backgroundRain;
  if (condition === 'Windy') return styles.backgroundWind;
  return styles.backgroundWarm;
}

function getGlowTint(condition: DashboardWeather['condition']) {
  if (condition === 'Rainy' || condition === 'Stormy') return styles.glowRain;
  if (condition === 'Windy') return styles.glowWind;
  return styles.glowWarm;
}

type WeatherChipProps = {
  readonly label: string;
  readonly value: string;
};

function WeatherChip({ label, value }: WeatherChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.chipValue}>
        {value}
      </Text>
    </View>
  );
}

function getConditionIcon(condition: DashboardWeather['condition']) {
  switch (condition) {
    case 'Sunny':
    case 'Hot':
      return { ios: 'sun.max.fill', android: 'sunny', web: 'sunny' } as const;
    case 'Rainy':
      return { ios: 'cloud.rain.fill', android: 'rainy', web: 'rainy' } as const;
    case 'Windy':
      return { ios: 'wind', android: 'air', web: 'air' } as const;
    case 'Cloudy':
      return { ios: 'cloud.fill', android: 'cloud', web: 'cloud' } as const;
    case 'Stormy':
      return { ios: 'cloud.bolt.rain.fill', android: 'thunderstorm', web: 'thunderstorm' } as const;
  }
}

const styles = StyleSheet.create({
  card: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 16,
    borderColor: 'rgba(255, 106, 0, 0.24)',
    backgroundColor: 'rgba(17, 21, 28, 0.82)',
  },
  backgroundTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backgroundWarm: { backgroundColor: 'rgba(255, 106, 0, 0.025)' },
  backgroundRain: { backgroundColor: 'rgba(45, 117, 181, 0.055)' },
  backgroundWind: { backgroundColor: 'rgba(218, 229, 239, 0.025)' },
  glow: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  glowWarm: { backgroundColor: 'rgba(255, 106, 0, 0.09)' },
  glowRain: { backgroundColor: 'rgba(59, 130, 246, 0.07)' },
  glowWind: { backgroundColor: 'rgba(226, 232, 240, 0.055)' },
  humidityChip: {
    alignSelf: 'flex-start',
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.24)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  humidityText: {
    ...typography.label,
    color: premiumColors.textPrimary,
    fontSize: 10,
    textTransform: 'none',
  },
  iconShell: {
    zIndex: 1,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: premiumColors.borderOrange,
    borderRadius: 29,
    backgroundColor: premiumColors.primaryMuted,
  },
  copy: {
    zIndex: 1,
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.label,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.subtitle,
    marginTop: 3,
    color: premiumColors.textPrimary,
  },
  message: {
    ...typography.caption,
    marginTop: 3,
    color: premiumColors.textSecondary,
  },
  chips: {
    zIndex: 1,
    width: 78,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipLabel: {
    ...typography.label,
    color: premiumColors.textTertiary,
    textTransform: 'uppercase',
  },
  chipValue: {
    ...typography.caption,
    marginTop: 1,
    color: premiumColors.textPrimary,
    fontWeight: '800',
  },
});

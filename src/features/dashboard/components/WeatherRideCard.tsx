import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Caption, GlassCard, Label } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { DashboardWeather } from '../types';
import { getWeatherRideMessage } from '../weatherMessage';

type WeatherRideCardProps = {
  weather: DashboardWeather;
};

export function WeatherRideCard({ weather }: WeatherRideCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.halo} />
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Ride Conditions</Text>
          <Text style={styles.sectionSubtitle}>Mock weather preview</Text>
        </View>
        <View style={styles.iconShell}>
          <SymbolView name={getConditionIcon(weather.condition)} tintColor={palette.text} size={24} />
        </View>
      </View>

      <View style={styles.forecastRow}>
        <View>
          <Label style={styles.conditionLabel}>{weather.condition}</Label>
          <Text style={styles.temperature}>{weather.temperature}</Text>
        </View>
        <View style={styles.ridePill}>
          <Caption style={styles.ridePillText}>{weather.rideCondition}</Caption>
        </View>
      </View>

      <Body style={styles.message}>{getWeatherRideMessage(weather.condition)}</Body>

      <View style={styles.chips}>
        <WeatherChip label="Wind" value={weather.wind} />
        <WeatherChip label="Rain" value={weather.rainChance} />
      </View>
    </GlassCard>
  );
}

type WeatherChipProps = {
  label: string;
  value: string;
};

function WeatherChip({ label, value }: WeatherChipProps) {
  return (
    <View style={styles.chip}>
      <Caption style={styles.chipLabel}>{label}</Caption>
      <Body style={styles.chipValue}>{value}</Body>
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
    case 'Cloudy':
      return { ios: 'cloud.fill', android: 'cloud', web: 'cloud' } as const;
    case 'Stormy':
      return { ios: 'cloud.bolt.rain.fill', android: 'thunderstorm', web: 'thunderstorm' } as const;
  }
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(245, 245, 245, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.3,
    shadowRadius: 26,
    elevation: 7,
  },
  halo: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
  iconShell: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  conditionLabel: {
    color: 'rgba(248, 250, 252, 0.6)',
  },
  temperature: {
    ...typography.display,
    marginTop: spacing.xs,
    color: palette.text,
  },
  ridePill: {
    flexShrink: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ridePillText: {
    color: palette.text,
    textAlign: 'right',
  },
  message: {
    color: palette.text,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chip: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(7, 10, 15, 0.36)',
  },
  chipLabel: {
    color: 'rgba(248, 250, 252, 0.58)',
  },
  chipValue: {
    marginTop: spacing.xs,
    color: palette.text,
    fontWeight: '800',
  },
});

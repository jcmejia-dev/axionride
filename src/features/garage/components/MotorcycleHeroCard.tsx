import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Motorcycle } from '@/src/domain/motorcycle';
import { Badge, GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { GarageMotorcycleStatus } from '../types';
import { MotorcycleSpecs } from './MotorcycleSpecs';

type MotorcycleHeroCardProps = {
  motorcycle: Motorcycle;
  status?: GarageMotorcycleStatus;
  width: number;
  primary: boolean;
  onPress: () => void;
  onSetPrimary: () => void;
};

export function MotorcycleHeroCard({ motorcycle, status, width, primary, onPress, onSetPrimary }: MotorcycleHeroCardProps) {
  return (
    <Pressable accessibilityLabel={`${motorcycle.nickname}. Tap to edit. Long press to make primary.`} onPress={onPress} onLongPress={onSetPrimary} style={({ pressed }) => [styles.pressable, { width }, pressed ? styles.pressed : null]}>
      <GlassCard style={styles.card}>
        <View style={styles.lightBeam} />
        <View style={styles.topRow}>
          <View>
            <Text style={styles.nickname}>{motorcycle.nickname}</Text>
            <Text style={styles.model}>
              {motorcycle.brand} {motorcycle.model}
            </Text>
            <Text style={styles.year}>{motorcycle.year}</Text>
          </View>
          <Badge variant={primary ? 'success' : 'neutral'}>
            {primary ? 'Primary' : 'Hold for Primary'}
          </Badge>
        </View>

        <MotorcycleSilhouette />

        <View style={styles.metrics}>
          <HeroMetric label="Mileage" value={`${motorcycle.odometerKm.toLocaleString()} km`} />
          <HeroMetric label="Engine" value={`${motorcycle.engineCc}cc`} />
          <HeroMetric label="Fuel" value={motorcycle.fuelType} />
          <HeroMetric label="Oil" value={status?.oilStatus ?? 'Not set'} />
          <HeroMetric label="Last Ride" value={status?.lastRide ?? 'No rides'} wide />
        </View>

        <MotorcycleSpecs motorcycle={motorcycle} />
      </GlassCard>
    </Pressable>
  );
}

type HeroMetricProps = {
  label: string;
  value: string;
  wide?: boolean;
};

function HeroMetric({ label, value, wide = false }: HeroMetricProps) {
  return (
    <View style={[styles.metric, wide ? styles.wideMetric : null]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

function MotorcycleSilhouette() {
  return (
    <View style={styles.visual}>
      <View style={styles.visualGlow} />
      <View style={styles.wheelLeft} />
      <View style={styles.wheelRight} />
      <View style={styles.bodyLine} />
      <View style={styles.seatLine} />
      <View style={styles.handleLine} />
      <View style={styles.engineBlock}>
        <SymbolView
          name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
          tintColor={palette.accentOrange}
          size={18}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexShrink: 0,
  },
  card: {
    minHeight: 620,
    gap: spacing.xl,
    overflow: 'hidden',
    backgroundColor: '#08090B',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.46,
    shadowRadius: 34,
    elevation: 10,
  },
  lightBeam: {
    position: 'absolute',
    top: -110,
    right: -42,
    width: 190,
    height: 420,
    transform: [{ rotate: '17deg' }],
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  nickname: {
    ...typography.heading,
    color: palette.text,
    fontSize: 34,
    lineHeight: 39,
  },
  model: {
    ...typography.body,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.72)',
    fontWeight: '700',
  },
  year: {
    ...typography.label,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.48)',
  },
  visual: {
    height: 146,
    justifyContent: 'flex-end',
  },
  visualGlow: {
    position: 'absolute',
    right: 40,
    bottom: 10,
    width: 170,
    height: 90,
    borderRadius: 85,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  wheelLeft: {
    position: 'absolute',
    bottom: 8,
    left: 28,
    width: 68,
    height: 68,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.64)',
    borderRadius: 34,
  },
  wheelRight: {
    position: 'absolute',
    right: 28,
    bottom: 8,
    width: 68,
    height: 68,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.64)',
    borderRadius: 34,
  },
  bodyLine: {
    position: 'absolute',
    right: 78,
    bottom: 54,
    left: 82,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(249, 115, 22, 0.74)',
  },
  seatLine: {
    position: 'absolute',
    left: 130,
    bottom: 78,
    width: 86,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  handleLine: {
    position: 'absolute',
    right: 46,
    bottom: 82,
    width: 54,
    height: 4,
    transform: [{ rotate: '-25deg' }],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  engineBlock: {
    position: 'absolute',
    right: 126,
    bottom: 36,
    width: 44,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 0,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
  },
  wideMetric: {
    flexBasis: '100%',
  },
  metricLabel: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.54)',
    textTransform: 'uppercase',
  },
  metricValue: {
    ...typography.subtitle,
    marginTop: spacing.xs,
    color: palette.text,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});

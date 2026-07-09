import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Body, Caption, GlassCard, Label, Subtitle } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { DashboardMotorcycle } from '../types';

type CurrentMotorcycleCardProps = {
  motorcycle: DashboardMotorcycle;
};

export function CurrentMotorcycleCard({ motorcycle }: CurrentMotorcycleCardProps) {
  return (
    <Pressable onPress={() => undefined} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <GlassCard style={styles.card}>
        <View style={styles.lightBeam} />
        <View style={styles.topRow}>
          <View style={styles.iconShell}>
            <SymbolView
              name={{ ios: 'motorcycle.fill', android: 'two_wheeler', web: 'two_wheeler' }}
              tintColor={palette.text}
              size={38}
            />
          </View>
          <Badge variant="success">{motorcycle.status}</Badge>
        </View>

        <View style={styles.copy}>
          <Label style={styles.kicker}>Current motorcycle</Label>
          <Subtitle style={styles.name}>{motorcycle.name}</Subtitle>
          <Body style={styles.updated}>{motorcycle.lastUpdated}</Body>
        </View>

        <View style={styles.motorcycleSilhouette}>
          <View style={styles.wheelLeft} />
          <View style={styles.wheelRight} />
          <View style={styles.bodyLine} />
          <View style={styles.seatLine} />
          <View style={styles.handleLine} />
        </View>

        <View style={styles.metrics}>
          <FloatingMetric label="Engine" value={motorcycle.displacement} />
          <FloatingMetric label="Odometer" value={motorcycle.odometer} wide />
        </View>
      </GlassCard>
    </Pressable>
  );
}

type FloatingMetricProps = {
  label: string;
  value: string;
  wide?: boolean;
};

function FloatingMetric({ label, value, wide = false }: FloatingMetricProps) {
  return (
    <View style={[styles.metric, wide ? styles.metricWide : null]}>
      <Caption style={styles.metricLabel}>{label}</Caption>
      <Body style={styles.metricValue}>{value}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 318,
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
    top: -90,
    right: -30,
    width: 170,
    height: 360,
    transform: [{ rotate: '18deg' }],
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  iconShell: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  copy: {
    gap: spacing.xs,
  },
  kicker: {
    color: 'rgba(255, 255, 255, 0.58)',
  },
  name: {
    ...typography.heading,
    color: palette.text,
    fontSize: 36,
    lineHeight: 40,
  },
  updated: {
    color: 'rgba(248, 250, 252, 0.68)',
  },
  motorcycleSilhouette: {
    height: 74,
    marginTop: spacing.xs,
  },
  wheelLeft: {
    position: 'absolute',
    bottom: 0,
    left: 22,
    width: 52,
    height: 52,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 26,
  },
  wheelRight: {
    position: 'absolute',
    right: 28,
    bottom: 0,
    width: 52,
    height: 52,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 26,
  },
  bodyLine: {
    position: 'absolute',
    right: 68,
    bottom: 34,
    left: 62,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(249, 115, 22, 0.72)',
  },
  seatLine: {
    position: 'absolute',
    left: 122,
    bottom: 52,
    width: 72,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  handleLine: {
    position: 'absolute',
    right: 46,
    bottom: 54,
    width: 46,
    height: 3,
    transform: [{ rotate: '-24deg' }],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    flex: 1,
    minWidth: 118,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    gap: spacing.xs,
  },
  metricWide: {
    flexGrow: 1.4,
  },
  metricLabel: {
    color: 'rgba(248, 250, 252, 0.62)',
  },
  metricValue: {
    color: palette.text,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});

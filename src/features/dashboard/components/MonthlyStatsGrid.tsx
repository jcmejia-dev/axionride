import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { EmptyState, Label } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { DashboardStat } from '../types';

type MonthlyStatsGridProps = {
  stats: DashboardStat[];
};

export function MonthlyStatsGrid({ stats }: MonthlyStatsGridProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Monthly Stats</Text>
        <Text style={styles.sectionSubtitle}>Riding snapshot</Text>
      </View>
      {stats.length > 0 ? (
        <View style={styles.grid}>
          {stats.map((stat) => (
            <AnimatedStatChip
              key={stat.label}
              stat={stat}
              index={stats.indexOf(stat)}
            />
          ))}
        </View>
      ) : (
        <EmptyState title="No monthly stats yet" description="Ride activity will appear here once tracking data is available." />
      )}
    </View>
  );
}

type AnimatedStatChipProps = {
  stat: DashboardStat;
  index: number;
};

function AnimatedStatChip({ stat, index }: AnimatedStatChipProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay: 160 + index * 90,
      friction: 7,
      tension: 54,
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  const accentColor = statAccentColors[stat.accent];

  return (
    <Animated.View
      style={[
        styles.statChip,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}>
      <View style={[styles.statDot, { backgroundColor: accentColor }]} />
      <Label style={styles.statLabel}>{stat.label}</Label>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>
        {stat.value}
      </Text>
      {stat.detail ? <Text style={styles.statDetail}>{stat.detail}</Text> : null}
    </Animated.View>
  );
}

const statAccentColors = {
  orange: palette.accentOrange,
  cyan: '#E5E7EB',
  success: '#FFFFFF',
  warning: palette.warning,
};

const styles = StyleSheet.create({
  section: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statChip: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 0,
    minHeight: 124,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    marginBottom: spacing.lg,
    borderRadius: 4,
  },
  statLabel: {
    color: 'rgba(248, 250, 252, 0.56)',
  },
  statValue: {
    ...typography.subheading,
    marginTop: spacing.sm,
    color: palette.text,
    fontSize: 24,
    lineHeight: 29,
  },
  statDetail: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
});

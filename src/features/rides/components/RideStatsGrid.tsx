import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/src/theme';

import type { CurrentRidePreview, RideInsight } from '../types';

type RideStatsGridProps = {
  currentRide: CurrentRidePreview;
  insights: readonly RideInsight[];
};

export function RideStatsGrid({ currentRide, insights }: RideStatsGridProps) {
  const currentStats = [
    { label: 'Distance', value: currentRide.distance, detail: 'Current ride', accent: 'orange' as const },
    { label: 'Time', value: currentRide.time, detail: 'Elapsed', accent: 'cyan' as const },
    { label: 'Avg Speed', value: currentRide.averageSpeed, detail: 'Live preview', accent: 'success' as const },
    { label: 'Max Speed', value: currentRide.maxSpeed, detail: 'Session max', accent: 'warning' as const },
  ];

  return (
    <View style={styles.section}>
      <SectionTitle title="Ride Metrics" subtitle="Live statistics from foreground GPS" />
      <View style={styles.grid}>
        {currentStats.map((stat, index) => (
          <RideStatCard key={stat.label} stat={stat} index={index} />
        ))}
      </View>

      {insights.length > 0 ? <><SectionTitle title="Ride Insights" subtitle="Your riding snapshot" /><View style={styles.grid}>{insights.map((stat,index)=><RideStatCard key={stat.label} stat={stat} index={index+currentStats.length}/>)}</View></> : null}
    </View>
  );
}

type RideStat = {
  label: string;
  value: string;
  detail: string;
  accent: RideInsight['accent'];
};

type RideStatCardProps = {
  stat: RideStat;
  index: number;
};

function RideStatCard({ stat, index }: RideStatCardProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay: 120 + index * 55,
      friction: 8,
      tension: 54,
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={[styles.dot, { backgroundColor: accentColors[stat.accent] }]} />
      <Text style={styles.label}>{stat.label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.value}>
        {stat.value}
      </Text>
      <Text style={styles.detail}>{stat.detail}</Text>
    </Animated.View>
  );
}

type SectionTitleProps = {
  title: string;
  subtitle: string;
};

function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

const accentColors = {
  orange: palette.accentOrange,
  cyan: palette.accentBlue,
  success: palette.success,
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
    gap: 0,
    marginBottom: spacing.md,
    overflow:'hidden',
    borderWidth:1,
    borderColor:'rgba(255,255,255,.1)',
    borderRadius:radius.xl,
    backgroundColor:'rgba(17,21,28,.88)',
  },
  card: {
    flex:1,
    minWidth: 0,
    minHeight: 112,
    alignItems:'center',
    paddingHorizontal: spacing.xs,
    paddingVertical:spacing.md,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 6,
  },
  dot: {
    width: 8,
    height: 8,
    marginBottom: spacing.sm,
    borderRadius: 4,
  },
  label: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.56)',
    textTransform: 'uppercase',
  },
  value: {
    ...typography.subheading,
    marginTop: spacing.sm,
    color: palette.text,
    fontSize: 15,
    lineHeight: 29,
  },
  detail: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
    textAlign:'center',
  },
});

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/src/theme';

import type { MaintenanceSummaryItem } from '../types';

type MaintenanceSummaryGridProps = {
  summary: readonly MaintenanceSummaryItem[];
};

export function MaintenanceSummaryGrid({ summary }: MaintenanceSummaryGridProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>Maintenance Summary</Text>
        <Text style={styles.sectionSubtitle}>Service health at a glance</Text>
      </View>
      <View style={styles.grid}>
        {summary.map((item, index) => (
          <SummaryCard key={item.label} item={item} index={index} />
        ))}
      </View>
    </View>
  );
}

type SummaryCardProps = {
  item: MaintenanceSummaryItem;
  index: number;
};

function SummaryCard({ item, index }: SummaryCardProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const accentColor = accentColors[item.accent];

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay: 120 + index * 80,
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
      <View style={[styles.dot, { backgroundColor: accentColor }]} />
      <Text style={styles.label}>{item.label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.value}>
        {item.value}
      </Text>
      <Text style={styles.detail}>{item.detail}</Text>
    </Animated.View>
  );
}

const accentColors = {
  orange: palette.accentOrange,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
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
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 0,
    minHeight: 124,
    padding: spacing.lg,
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
  dot: {
    width: 8,
    height: 8,
    marginBottom: spacing.lg,
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
    fontSize: 24,
    lineHeight: 29,
  },
  detail: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
  },
});

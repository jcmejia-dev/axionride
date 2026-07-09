import { useEffect, useRef } from 'react';
import { SymbolView } from 'expo-symbols';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Badge, GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { MaintenanceOverallStatus } from '../types';

type MaintenanceStatusCardProps = {
  status: MaintenanceOverallStatus;
};

export function MaintenanceStatusCard({ status }: MaintenanceStatusCardProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.max(0, Math.min(status.progress, 1));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clampedProgress,
      duration: 900,
      delay: 220,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <GlassCard style={styles.card}>
      <View style={styles.glow} />
      <View style={styles.header}>
        <View style={styles.iconShell}>
          <SymbolView name={{ ios: 'wrench.adjustable.fill', android: 'build', web: 'build' }} tintColor={palette.text} size={28} />
        </View>
        <Badge variant="warning">{status.status}</Badge>
      </View>

      <View>
        <Text style={styles.kicker}>Next service</Text>
        <Text style={styles.title}>{status.nextService}</Text>
        <Text style={styles.subtitle}>{status.remainingDistance}</Text>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Service window</Text>
        <Text style={styles.progressPercent}>{Math.round(clampedProgress * 100)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl,
    overflow: 'hidden',
    backgroundColor: '#08090B',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.42,
    shadowRadius: 34,
    elevation: 10,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  iconShell: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  kicker: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.58)',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.heading,
    marginTop: spacing.xs,
    color: palette.text,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.68)',
    fontWeight: '700',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressLabel: {
    ...typography.caption,
    color: 'rgba(248, 250, 252, 0.58)',
  },
  progressPercent: {
    ...typography.caption,
    color: palette.warning,
    fontWeight: '800',
  },
  progressTrack: {
    height: 12,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(245, 158, 11, 0.92)',
  },
});

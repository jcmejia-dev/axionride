import { useEffect, useRef } from 'react';
import { SymbolView } from 'expo-symbols';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Badge, Body, Caption, GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import type { DashboardMaintenance } from '../types';

type NextMaintenanceCardProps = {
  maintenance: DashboardMaintenance;
};

export function NextMaintenanceCard({ maintenance }: NextMaintenanceCardProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.max(0, Math.min(maintenance.progress, 1));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clampedProgress,
      duration: 900,
      delay: 260,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <GlassCard style={styles.card}>
      <View style={styles.panelGlow} />
      <View style={styles.sectionHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionTitle}>Next Maintenance</Text>
          <Text style={styles.sectionSubtitle}>{maintenance.task}</Text>
        </View>
        <Badge variant="warning">{maintenance.status}</Badge>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.serviceIcon}>
          <SymbolView
            name={{ ios: 'oilcan.fill', android: 'build', web: 'build' }}
            tintColor={palette.warning}
            size={24}
          />
        </View>
        <View style={styles.remainingCopy}>
          <Body style={styles.remaining}>{maintenance.remainingDistance}</Body>
          <Caption style={styles.caption}>Plan service before your next long ride.</Caption>
        </View>
      </View>

      <View style={styles.progressHeader}>
        <Caption style={styles.caption}>Service window</Caption>
        <Caption style={styles.progressPercent}>{Math.round(clampedProgress * 100)}%</Caption>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 15, 13, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 26,
    elevation: 8,
  },
  panelGlow: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: {
    flex: 1,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  remainingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  remaining: {
    ...typography.subheading,
    color: palette.text,
    fontWeight: '800',
  },
  caption: {
    color: 'rgba(248, 250, 252, 0.62)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressPercent: {
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

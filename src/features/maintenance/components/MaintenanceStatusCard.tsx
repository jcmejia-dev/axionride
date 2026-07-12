import { useEffect, useRef } from 'react';
import { SymbolView } from 'expo-symbols';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components';
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
      <View style={styles.statusHeading}><SymbolView name={{ ios: 'wrench.adjustable.fill', android: 'build', web: 'build' }} tintColor={palette.accentOrange} size={25}/><Text style={styles.headingText}>Next Maintenance</Text></View>
      <View style={styles.bodyRow}><View style={styles.copy}><Text style={styles.title}>{status.nextService}</Text><Text style={styles.subtitle}>{status.remainingDistance}</Text><Text style={styles.estimate}>{status.status}</Text></View><View style={styles.progressCircle}><View style={styles.progressCircleInner}><Text style={styles.circlePercent}>{Math.round(clampedProgress*100)}%</Text></View></View></View>
      <View style={styles.progressTrack}><Animated.View style={[styles.progressFill,{width:progressWidth}]}/>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    overflow: 'hidden',
    backgroundColor: '#08090B',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.42,
    shadowRadius: 34,
    elevation: 10,
  },
  statusHeading:{flexDirection:'row',alignItems:'center',gap:spacing.md},headingText:{...typography.subtitle,color:palette.text,fontWeight:'900'},bodyRow:{flexDirection:'row',alignItems:'center',gap:spacing.lg},copy:{flex:1,minWidth:0},estimate:{...typography.caption,color:palette.textMuted,marginTop:6},progressCircle:{width:92,height:92,alignItems:'center',justifyContent:'center',borderWidth:7,borderLeftColor:palette.accentOrange,borderTopColor:palette.accentOrange,borderRightColor:'rgba(255,106,0,.25)',borderBottomColor:'rgba(255,255,255,.08)',borderRadius:46,transform:[{rotate:'-35deg'}]},progressCircleInner:{transform:[{rotate:'35deg'}]},circlePercent:{fontSize:22,fontWeight:'900',color:palette.text},
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

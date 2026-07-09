import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, palette, spacing } from '@/src/theme';

import { EmptyRidesState } from './components/EmptyRidesState';
import { RecentRideList } from './components/RecentRideList';
import { RideHeader } from './components/RideHeader';
import { RideModeCard } from './components/RideModeCard';
import { RideQuickActions } from './components/RideQuickActions';
import { RideStatsGrid } from './components/RideStatsGrid';
import { mockRides } from './data/mockRides';

export function RideScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <RideHeader />

        <AnimatedEntrance delay={80}>
          <RideModeCard />
        </AnimatedEntrance>

        <AnimatedEntrance delay={180}>
          <RideStatsGrid currentRide={mockRides.currentRide} insights={mockRides.insights} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={280}>
          {mockRides.recentRides.length > 0 ? <RecentRideList rides={mockRides.recentRides} /> : <EmptyRidesState />}
        </AnimatedEntrance>

        <AnimatedEntrance delay={380}>
          <RideQuickActions />
        </AnimatedEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}

type AnimatedEntranceProps = {
  children: ReactNode;
  delay: number;
};

function AnimatedEntrance({ children, delay }: AnimatedEntranceProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay,
      friction: 8,
      tension: 48,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            }),
          },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -130,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xxl,
  },
});

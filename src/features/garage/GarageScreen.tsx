import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, palette, spacing } from '@/src/theme';
import { createMotorcycleService, type MotorcycleOverview } from '@/src/services';

import { EmptyGarage } from './components/EmptyGarage';
import { GarageHeader } from './components/GarageHeader';
import { GarageQuickActions } from './components/GarageQuickActions';
import { MotorcycleCarousel } from './components/MotorcycleCarousel';

export function GarageScreen() {
  const router = useRouter();
  const motorcycleService = useMemo(() => createMotorcycleService(), []);
  const [overview, setOverview] = useState<MotorcycleOverview>({ motorcycles: [], primaryMotorcycleId: null });
  const refresh = useCallback(async () => {
    const result = await motorcycleService.getOverview();
    if (result.ok) setOverview(result.value); else Alert.alert('Garage unavailable', result.error.message);
  }, [motorcycleService]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  async function setPrimary(id: string) {
    const result = await motorcycleService.setPrimaryMotorcycle(id);
    if (!result.ok) Alert.alert('Primary motorcycle not changed', result.error.message);
    await refresh();
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <GarageHeader motorcycleCount={overview.motorcycles.length} />

        <AnimatedEntrance delay={80}>
          {overview.motorcycles.length > 0 ? <MotorcycleCarousel motorcycles={overview.motorcycles} primaryMotorcycleId={overview.primaryMotorcycleId} onEdit={(id) => router.push({ pathname: '/motorcycle-management', params: { id } })} onSetPrimary={(id) => { void setPrimary(id); }} /> : <EmptyGarage />}
        </AnimatedEntrance>

        <AnimatedEntrance delay={220}>
          <GarageQuickActions />
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
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.98, 1],
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
    right: -110,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 100,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
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

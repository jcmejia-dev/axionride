import { SymbolView } from 'expo-symbols';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Ride } from '@/src/domain/ride';
import { createRideService } from '@/src/services';
import { layout, palette, spacing, typography } from '@/src/theme';

import { RideHistoryCard } from './components/RideHistoryCard';
import { groupRideHistory } from './rideHistory';

export function RideHistoryScreen() {
  const router = useRouter();
  const service = useMemo(() => createRideService(), []);
  const [rides, setRides] = useState<readonly Ride[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const sections = useMemo(() => groupRideHistory(rides), [rides]);

  const load = useCallback(async (force = false) => {
    const result = await service.getRideHistory(force);
    if (result.ok) setRides(result.value.map((item) => item.ride));
  }, [service]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const openRide = useCallback((id: string) => {
    router.push(`/ride-details/${encodeURIComponent(id)}` as Href);
  }, [router]);
  const renderRide = useCallback(({ item }: { readonly item: Ride }) => (
    <RideHistoryCard ride={item} elevated={scrolling} onPress={() => openRide(item.id)} />
  ), [openRide, scrolling]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.glow} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderRide}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        ListHeaderComponent={<Header onBack={() => router.back()} count={rides.length} />}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>NO RIDES RECORDED</Text><Text style={styles.emptyCopy}>Completed rides will be organized here automatically.</Text></View>}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.itemGap} />}
        SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        onScrollBeginDrag={() => setScrolling(true)}
        onScrollEndDrag={() => setScrolling(false)}
        onMomentumScrollBegin={() => setScrolling(true)}
        onMomentumScrollEnd={() => setScrolling(false)}
        scrollEventThrottle={32}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={palette.accentOrange} colors={[palette.accentOrange]} onRefresh={() => { setRefreshing(true); void load(true).finally(() => setRefreshing(false)); }} />}
      />
    </SafeAreaView>
  );
}

function Header({ onBack, count }: { readonly onBack: () => void; readonly count: number }) {
  return <View style={styles.header}><Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={styles.back}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={21} tintColor={palette.text} /></Pressable><View><Text style={styles.kicker}>RIDE ARCHIVE // {count}</Text><Text style={styles.title}>Ride History</Text><Text style={styles.subtitle}>Your completed journeys, organized by date.</Text></View></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070A0F' },
  glow: { position: 'absolute', top: -160, right: -140, width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(255,118,23,.035)' },
  content: { paddingHorizontal: 18, paddingBottom: layout.floatingTabBarContentInset, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', borderRadius: 6, backgroundColor: 'rgba(255,255,255,.035)' },
  kicker: { ...typography.label, color: palette.accentOrange, fontWeight: '900', letterSpacing: 1 },
  title: { ...typography.heading, marginTop: 3, color: palette.text },
  subtitle: { ...typography.caption, marginTop: 4, color: palette.textMuted },
  sectionHeader: { ...typography.label, marginBottom: spacing.sm, color: '#9BA9B3', fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  itemGap: { height: spacing.sm },
  sectionGap: { height: spacing.xl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 90 },
  emptyTitle: { ...typography.subtitle, color: palette.text, fontWeight: '900' },
  emptyCopy: { ...typography.body, marginTop: spacing.sm, color: palette.textMuted, textAlign: 'center' },
});

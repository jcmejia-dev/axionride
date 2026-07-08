import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, EmptyState, GlassCard, SecondaryButton, SectionHeader, StatCard, Title } from '@/src/components';
import { layout, palette, spacing } from '@/src/theme';

export function RideScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Title>Rides</Title>
          <Body muted>Track rides later with route history, speed insights, and summaries.</Body>
        </View>

        <View style={styles.stats}>
          <StatCard label="Distance" value="0 km" detail="No rides yet" accent="cyan" />
          <StatCard label="Rides" value="0" detail="Ready when you are" accent="orange" />
        </View>

        <GlassCard style={styles.card}>
          <SectionHeader title="Ride History" subtitle="Placeholder until ride tracking is added" />
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: 'road.lanes', android: 'route', web: 'route' }}
                tintColor={palette.accentBlue}
                size={34}
              />
            }
            title="No rides recorded"
            description="Completed rides will appear here after ride tracking is implemented."
          />
        </GlassCard>

        <SecondaryButton title="Start Ride" onPress={() => undefined} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  screen: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    gap: spacing.lg,
  },
});

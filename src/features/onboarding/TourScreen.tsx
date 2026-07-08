import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, GlassCard, PrimaryButton, SectionHeader, Title } from '@/src/components';
import { palette, spacing } from '@/src/theme';

const tourCards = [
  {
    title: 'Garage',
    description: 'Build a clean profile for each motorcycle you own.',
    icon: { ios: 'motorcycle.fill', android: 'two_wheeler', web: 'two_wheeler' },
  },
  {
    title: 'Ride Tracking',
    description: 'Capture ride context later when GPS features are introduced.',
    icon: { ios: 'road.lanes', android: 'route', web: 'route' },
  },
  {
    title: 'Maintenance',
    description: 'Keep service records, reminders, and ownership history close.',
    icon: { ios: 'checklist.checked', android: 'checklist', web: 'checklist' },
  },
  {
    title: 'Insights',
    description: 'Turn records into useful ownership and performance summaries.',
    icon: { ios: 'chart.line.uptrend.xyaxis', android: 'monitoring', web: 'monitoring' },
  },
] as const;

export function TourScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Title>Feature Tour</Title>
          <Body muted>AxionRide starts simple and grows into a complete motorcycle companion.</Body>
        </View>

        <View style={styles.grid}>
          {tourCards.map((card) => (
            <GlassCard key={card.title} style={styles.card}>
              <View style={styles.iconWrap}>
                <SymbolView name={card.icon} tintColor={palette.accentBlue} size={24} />
              </View>
              <SectionHeader title={card.title} subtitle={card.description} />
            </GlassCard>
          ))}
        </View>

        <PrimaryButton title="Continue" onPress={() => router.push('/first-motorcycle')} />
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
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
  },
  grid: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
  },
});

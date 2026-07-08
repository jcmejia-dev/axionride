import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxionRideLogo, Body, GlassCard, PrimaryButton, SectionHeader, Title } from '@/src/components';
import { palette, spacing } from '@/src/theme';

const highlights = [
  {
    title: 'Track motorcycles',
    description: 'Keep your future garage organized by bike.',
    icon: { ios: 'motorcycle.fill', android: 'two_wheeler', web: 'two_wheeler' },
  },
  {
    title: 'Track rides',
    description: 'Prepare for ride history, route summaries, and ride context.',
    icon: { ios: 'road.lanes', android: 'route', web: 'route' },
  },
  {
    title: 'Monitor maintenance',
    description: 'Plan service records and reminders before problems grow.',
    icon: { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' },
  },
  {
    title: 'View stats',
    description: 'See ownership and ride insights as the app grows.',
    icon: { ios: 'chart.bar.xaxis', android: 'bar_chart', web: 'bar_chart' },
  },
] as const;

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <AxionRideLogo compact />

        <View style={styles.hero}>
          <Title>Welcome to AxionRide</Title>
          <Body muted>Ride smarter with a motorcycle companion built for ownership, rides, maintenance, and stats.</Body>
        </View>

        <GlassCard style={styles.card}>
          <SectionHeader title="Built for riders" subtitle="A focused workspace for your motorcycle life" />
          <View style={styles.list}>
            {highlights.map((item) => (
              <View key={item.title} style={styles.row}>
                <View style={styles.iconWrap}>
                  <SymbolView name={item.icon} tintColor={palette.accentOrange} size={22} />
                </View>
                <View style={styles.rowCopy}>
                  <Body>{item.title}</Body>
                  <Body muted>{item.description}</Body>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <PrimaryButton title="Start Feature Tour" onPress={() => router.push('/tour')} />
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});

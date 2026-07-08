import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Body,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  Title,
} from '@/src/components';
import { layout, palette, semanticColors, spacing } from '@/src/theme';

const dashboardCards = [
  {
    title: 'Next Maintenance',
    description: 'No maintenance scheduled.',
    icon: { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' },
  },
  {
    title: 'Garage',
    description: 'No motorcycles added yet.',
    icon: { ios: 'motorcycle.fill', android: 'two_wheeler', web: 'two_wheeler' },
  },
  {
    title: 'Recent Ride',
    description: 'No rides recorded.',
    icon: { ios: 'road.lanes', android: 'route', web: 'route' },
  },
] as const;

export function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Title>Good to see you.</Title>
          <Body muted>Ride Smarter.</Body>
        </View>

        <View style={styles.grid}>
          {dashboardCards.map((card) => (
            <GlassCard key={card.title} style={styles.card}>
              <View style={styles.cardIcon}>
                <SymbolView name={card.icon} tintColor={palette.accentOrange} size={24} />
              </View>
              <Title style={styles.cardTitle}>{card.title}</Title>
              <Body muted>{card.description}</Body>
            </GlassCard>
          ))}
        </View>

        <SectionHeader title="Quick Actions" subtitle="Placeholder actions for future workflows" />
        <View style={styles.actions}>
          <PrimaryButton title="Add Motorcycle" onPress={() => undefined} />
          <SecondaryButton title="Start Ride" onPress={() => undefined} />
          <SecondaryButton title="View Garage" onPress={() => undefined} />
        </View>
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
  grid: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: semanticColors.dark.accentSoft,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  actions: {
    gap: spacing.md,
  },
});

import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, EmptyState, GlassCard, PrimaryButton, SectionHeader, Title } from '@/src/components';
import { layout, palette, semanticColors, spacing } from '@/src/theme';

export function GarageScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Title>Garage</Title>
          <Body muted>Build your motorcycle roster and keep every machine organized.</Body>
        </View>

        <GlassCard style={styles.summaryCard}>
          <SectionHeader title="Motorcycles" subtitle="No saved motorcycles yet" />
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: 'motorcycle.fill', android: 'two_wheeler', web: 'two_wheeler' }}
                tintColor={palette.accentOrange}
                size={34}
              />
            }
            title="No motorcycles added"
            description="Your garage will show motorcycle profiles, odometer notes, and ownership details."
          />
        </GlassCard>

        <PrimaryButton title="Add Motorcycle" onPress={() => undefined} />
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
  summaryCard: {
    gap: spacing.lg,
    backgroundColor: semanticColors.dark.surface,
  },
});

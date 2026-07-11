import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, EmptyState, GlassCard, GhostButton, PrimaryButton, SectionHeader, Title } from '@/src/components';
import { palette, spacing } from '@/src/theme';
import { useAuth } from '@/src/providers';

export function FirstMotorcycleScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();

  async function continueToAuthentication() {
    await completeOnboarding();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Title>Add First Motorcycle</Title>
          <Body muted>Motorcycle setup will be built later. For now, continue into the dashboard shell.</Body>
        </View>

        <GlassCard style={styles.card}>
          <SectionHeader title="Garage setup" subtitle="Placeholder step" />
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: 'motorcycle.fill', android: 'two_wheeler', web: 'two_wheeler' }}
                tintColor={palette.accentOrange}
                size={36}
              />
            }
            title="Motorcycle setup is coming later"
            description="This onboarding step will eventually collect motorcycle details. No forms or saved state are included yet."
          />
        </GlassCard>

        <View style={styles.actions}>
          <PrimaryButton title="Continue to Sign In" onPress={() => { void continueToAuthentication(); }} />
          <GhostButton title="Skip for now" onPress={() => { void continueToAuthentication(); }} />
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
  actions: {
    gap: spacing.md,
  },
});

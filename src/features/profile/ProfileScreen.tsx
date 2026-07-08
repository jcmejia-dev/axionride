import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, EmptyState, GlassCard, GhostButton, SectionHeader, Title } from '@/src/components';
import { layout, palette, spacing } from '@/src/theme';

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Title>Profile</Title>
          <Body muted>Preferences, account settings, and data controls will live here.</Body>
        </View>

        <GlassCard style={styles.card}>
          <SectionHeader title="Rider Profile" subtitle="No account connected" />
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }}
                tintColor={palette.accentBlue}
                size={36}
              />
            }
            title="Profile setup pending"
            description="Authentication and sync controls will be added in a later branch."
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <SectionHeader title="Settings" subtitle="Placeholder app preferences" />
          <GhostButton title="Customize Later" onPress={() => undefined} />
        </GlassCard>
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
  card: {
    gap: spacing.lg,
  },
});

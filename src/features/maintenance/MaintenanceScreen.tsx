import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Body,
  EmptyState,
  GlassCard,
  PrimaryButton,
  SectionHeader,
  StatCard,
  Title,
} from '@/src/components';
import { layout, palette, spacing } from '@/src/theme';

export function MaintenanceScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Title>Maintenance</Title>
          <Body muted>Plan services, reminders, and ownership records in one place.</Body>
        </View>

        <View style={styles.stats}>
          <StatCard label="Due Soon" value="0" detail="No reminders" accent="success" />
          <StatCard label="Records" value="0" detail="No service history" accent="warning" />
        </View>

        <GlassCard style={styles.card}>
          <SectionHeader title="Service Timeline" subtitle="Placeholder maintenance history" />
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: 'checklist.checked', android: 'checklist', web: 'checklist' }}
                tintColor={palette.accentOrange}
                size={34}
              />
            }
            title="No maintenance scheduled"
            description="Future service reminders and completed work will appear here."
          />
        </GlassCard>

        <PrimaryButton title="Add Maintenance" onPress={() => undefined} />
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

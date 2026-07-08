import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

const cards = [
  {
    title: 'Garage',
    description: 'Manage motorcycles',
    icon: { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' },
  },
  {
    title: 'Maintenance',
    description: 'Track services and reminders',
    icon: { ios: 'checklist.checked', android: 'checklist', web: 'checklist' },
  },
  {
    title: 'Ride Tracking',
    description: 'Coming Soon',
    icon: { ios: 'map.fill', android: 'map', web: 'map' },
  },
  {
    title: 'Settings',
    description: 'Customize the application',
    icon: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  },
] as const;

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <SymbolView
            name={{ ios: 'bolt.fill', android: 'electric_bolt', web: 'electric_bolt' }}
            tintColor={palette.accentOrange}
            size={34}
          />
        </View>
        <View>
          <Text style={styles.appName}>AxionRide</Text>
          <Text style={styles.tagline}>Ride Smarter.</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Your intelligent motorcycle companion for maintenance, rides, navigation and performance.
      </Text>

      <View style={styles.cardGrid}>
        {cards.map((card) => (
          <View key={card.title} style={styles.card}>
            <View style={styles.cardIcon}>
              <SymbolView name={card.icon} tintColor={palette.accentBlue} size={24} />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription}>{card.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
    gap: spacing.xl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceStrong,
    borderWidth: 1,
    borderColor: palette.border,
  },
  appName: {
    ...typography.heading,
    color: palette.text,
  },
  tagline: {
    ...typography.subheading,
    color: palette.accentOrange,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.body,
    color: palette.textMuted,
    maxWidth: 420,
  },
  cardGrid: {
    gap: spacing.lg,
  },
  card: {
    padding: spacing.xl,
    borderRadius: 22,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.subheading,
    color: palette.text,
  },
  cardDescription: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: spacing.xs,
  },
});

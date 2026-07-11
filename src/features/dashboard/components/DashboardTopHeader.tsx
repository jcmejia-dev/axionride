import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/src/components/premium';
import { iconSizes, premiumColors, spacing, typography } from '@/src/theme';

type DashboardTopHeaderProps = {
  readonly greeting: string;
  readonly riderName: string;
  readonly onOpenSettings: () => void;
};

export function DashboardTopHeader({ greeting, riderName, onOpenSettings }: DashboardTopHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.logoSpacer} />
        <View accessibilityRole="image" accessibilityLabel="AxionRide" style={styles.wordmark}>
          <Text style={styles.wordmarkAxion}>AXION</Text>
          <Text style={styles.wordmarkRide}>RIDE</Text>
        </View>
        <IconButton
          accessibilityLabel="Open dashboard search"
          icon={
            <SymbolView
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              size={iconSizes.md}
              tintColor={premiumColors.textPrimary}
            />
          }
          onPress={onOpenSettings}
          size="large"
          style={styles.settingsButton}
        />
      </View>

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.greeting}>
          {greeting}, <Text style={styles.name}>{riderName}</Text>
        </Text>
        <Text style={styles.subtitle}>Ride safe. Ride smart.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  logoRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSpacer: {
    width: 56,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkAxion: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: premiumColors.textPrimary,
  },
  wordmarkRide: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: premiumColors.primaryBright,
  },
  settingsButton: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  copy: {
    gap: 3,
  },
  greeting: {
    ...typography.title,
    color: premiumColors.textPrimary,
  },
  name: {
    color: premiumColors.primaryBright,
  },
  subtitle: {
    ...typography.body,
    fontWeight: '700',
    color: premiumColors.textSecondary,
  },
});

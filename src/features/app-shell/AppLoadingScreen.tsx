import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

export function AppLoadingScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.logoMark}>
        <SymbolView
          name={{ ios: 'bolt.fill', android: 'electric_bolt', web: 'electric_bolt' }}
          tintColor={palette.accentOrange}
          size={36}
        />
      </View>

      <Text style={styles.appName}>AxionRide</Text>
      <Text style={styles.tagline}>Ride Smarter.</Text>
      <Text style={styles.status}>Preparing your ride companion...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: palette.darkBackground,
  },
  logoMark: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceStrong,
    marginBottom: spacing.xl,
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
  status: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { AxionRideLogo } from '@/src/components';
import { palette, spacing, typography } from '@/src/theme';

export function AppLoadingScreen() {
  return (
    <View style={styles.screen}>
      <AxionRideLogo />
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
  status: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});

import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

export default function GarageScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.panel}>
        <View style={styles.iconWrap}>
          <SymbolView
            name={{ ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' }}
            tintColor={palette.accentOrange}
            size={30}
          />
        </View>
        <Text style={styles.title}>Garage</Text>
        <Text style={styles.caption}>Manage motorcycles</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: palette.darkBackground,
  },
  panel: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: palette.text,
  },
  caption: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: spacing.sm,
  },
});

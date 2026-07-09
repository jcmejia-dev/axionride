import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Body, Label, Title } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

type DashboardHeaderProps = {
  greeting: string;
  readonly onOpenSearch?: () => void;
};

export function DashboardHeader({ greeting, onOpenSearch }: DashboardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Label style={styles.eyebrow}>AxionRide Command</Label>
        <Title style={styles.greeting}>{greeting}</Title>
        <Body style={styles.subtitle}>Ride Smarter.</Body>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Open search"
          accessibilityRole="button"
          onPress={onOpenSearch}
          style={({ pressed }) => [styles.settingsButton, pressed ? styles.pressed : null]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor={palette.text}
            size={21}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          onPress={() => undefined}
          style={({ pressed }) => [styles.settingsButton, pressed ? styles.pressed : null]}>
          <SymbolView
            name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
            tintColor={palette.text}
            size={21}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  eyebrow: {
    color: 'rgba(248, 250, 252, 0.62)',
    letterSpacing: 0.8,
  },
  greeting: {
    ...typography.display,
    color: palette.text,
  },
  subtitle: {
    color: 'rgba(248, 250, 252, 0.68)',
  },
  settingsButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 7,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
});

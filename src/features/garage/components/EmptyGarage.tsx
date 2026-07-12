import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

export function EmptyGarage({ onAdd }: { readonly onAdd: () => void }) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView
          name={{ ios: 'motorcycle.fill', android: 'two_wheeler', web: 'two_wheeler' }}
          tintColor={palette.text}
          size={36}
        />
      </View>
      <Text style={styles.title}>No motorcycles yet</Text>
      <Text style={styles.description}>Add your first motorcycle to begin tracking rides and maintenance.</Text>
      <Pressable accessibilityRole="button" onPress={onAdd} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}><Text style={styles.buttonText}>Add Motorcycle</Text></Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  iconShell: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    ...typography.title,
    color: palette.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    maxWidth: 290,
    color: 'rgba(248, 250, 252, 0.66)',
    textAlign: 'center',
  },
  button: { minHeight: 52, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', marginTop: spacing.sm, borderRadius: radius.lg, backgroundColor: palette.accentOrange },
  buttonText: { ...typography.button, color: '#FFFFFF' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});

import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AxionRide</Text>
      <Text style={styles.subtitle}>Ride Smarter.</Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: palette.darkBackground,
  },
  title: {
    ...typography.heading,
    color: palette.text,
  },
  subtitle: {
    ...typography.subheading,
    color: palette.accentOrange,
    marginTop: spacing.sm,
  },
});

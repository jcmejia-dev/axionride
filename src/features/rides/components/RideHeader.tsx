import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

export function RideHeader() {
  return <View style={styles.container}><View style={styles.rail} /><View><Text style={styles.kicker}>AXIONRIDE // COCKPIT</Text><Text style={styles.title}>Rides</Text><Text style={styles.subtitle}>Live telemetry and local ride records</Text></View></View>;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, rail: { width: 2, height: 48, backgroundColor: palette.accentOrange }, kicker: { ...typography.label, color: palette.accentOrange, fontWeight: '900', letterSpacing: 1 }, title: { ...typography.heading, marginTop: 1, color: palette.text }, subtitle: { ...typography.caption, marginTop: 2, color: palette.textMuted },
});

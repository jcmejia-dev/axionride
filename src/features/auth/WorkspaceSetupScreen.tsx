import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxionRideLogo, Body, GlassCard, PrimaryButton, SecondaryButton, Title, Toast } from '@/src/components';
import { useAuth } from '@/src/providers';
import { palette, spacing } from '@/src/theme';

export function WorkspaceSetupScreen() {
  const { attachAnonymousData, startFreshWorkspace, submitting } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  async function choose(action: typeof attachAnonymousData) { const result = await action(); if (!result.ok) setMessage(result.error.message); }
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}><AxionRideLogo compact /><GlassCard style={styles.card}><Title>Use your local ride data?</Title><Body muted>AxionRide found anonymous data on this device. Choose explicitly whether this account should use it. Nothing will be uploaded or deleted.</Body><View style={styles.actions}><PrimaryButton title="Attach Existing Data" loading={submitting} disabled={submitting} onPress={() => { void choose(attachAnonymousData); }} /><SecondaryButton title="Start Fresh" disabled={submitting} onPress={() => { void choose(startFreshWorkspace); }} /></View></GlassCard></ScrollView><Toast visible={message !== null} message={message ?? ''} variant="error" onHide={() => setMessage(null)} /></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: palette.darkBackground }, content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl }, card: { gap: spacing.lg }, actions: { gap: spacing.md } });

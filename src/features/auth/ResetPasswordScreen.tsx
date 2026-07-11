import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { AppTextInput, AxionRideLogo, Body, GlassCard, PrimaryButton, Title, Toast } from '@/src/components';
import { useAuth } from '@/src/providers';
import { palette, spacing } from '@/src/theme';

export function ResetPasswordScreen() {
  const { updatePassword, submitting } = useAuth();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  async function submit() {
    if (password.length < 8) { setMessage({ text: 'Use at least 8 characters.', success: false }); return; }
    const result = await updatePassword(password);
    setMessage(result.ok ? { text: 'Password updated. You can continue to AxionRide.', success: true } : { text: result.error.message, success: false });
  }
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}><AxionRideLogo compact /><GlassCard style={styles.card}><Title>Choose a new password</Title><Body muted>Your recovery link was verified. Enter a new password for your account.</Body><AppTextInput label="New Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" autoCapitalize="none" /><PrimaryButton title="Update Password" loading={submitting} disabled={submitting} onPress={() => { void submit(); }} /></GlassCard></ScrollView><Toast visible={message !== null} message={message?.text ?? ''} variant={message?.success ? 'success' : 'error'} onHide={() => setMessage(null)} /></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: palette.darkBackground }, content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl }, card: { gap: spacing.lg } });

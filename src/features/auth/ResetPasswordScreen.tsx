import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { AppTextInput, AxionRideLogo, Body, GlassCard, PrimaryButton, Title, Toast } from '@/src/components';
import { useAuth } from '@/src/providers';
import { palette, spacing } from '@/src/theme';

import { secondsUntil } from './recoverySecurity';

export function ResetPasswordScreen() {
  const { expirePasswordRecovery, recoveryExpiresAt, updatePassword, submitting } = useAuth();
  const [password, setPassword] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(() => secondsUntil(recoveryExpiresAt));
  const expirationHandled = useRef(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  useEffect(() => {
    const updateTimer = () => {
      const remaining = secondsUntil(recoveryExpiresAt);
      setRemainingSeconds(remaining);
      if (remaining === 0 && recoveryExpiresAt !== null && !expirationHandled.current) {
        expirationHandled.current = true;
        setMessage({ text: 'This password recovery session has expired. Request a new reset link.', success: false });
        void expirePasswordRecovery();
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expirePasswordRecovery, recoveryExpiresAt]);
  async function submit() {
    if (remainingSeconds <= 0) { setMessage({ text: 'This password recovery session has expired. Request a new reset link.', success: false }); return; }
    if (password.length < 8) { setMessage({ text: 'Use at least 8 characters.', success: false }); return; }
    const result = await updatePassword(password);
    setMessage(result.ok ? { text: 'Password updated. You can continue to AxionRide.', success: true } : { text: result.error.message, success: false });
  }
  const timerLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}><AxionRideLogo compact /><GlassCard style={styles.card}><Title>Choose a new password</Title><Body muted>Your recovery link was verified. Enter a new password for your account.</Body><Text accessibilityLiveRegion="polite" style={styles.timer}>Recovery session expires in {timerLabel}</Text><AppTextInput label="New Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" autoCapitalize="none" editable={remainingSeconds > 0} /><PrimaryButton title={remainingSeconds > 0 ? 'Update Password' : 'Recovery Expired'} loading={submitting} disabled={submitting || remainingSeconds <= 0} onPress={() => { void submit(); }} /></GlassCard></ScrollView><Toast visible={message !== null} message={message?.text ?? ''} variant={message?.success ? 'success' : 'error'} onHide={() => setMessage(null)} /></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: palette.darkBackground }, content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl }, card: { gap: spacing.lg }, timer: { color: palette.accentOrange, fontSize: 14, fontWeight: '800' } });

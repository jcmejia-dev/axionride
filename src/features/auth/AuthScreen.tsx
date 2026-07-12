import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AppTextInput,
  AxionRideLogo,
  Body,
  Caption,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  Title,
  Toast,
  type ToastVariant,
} from '@/src/components';
import { palette, semanticColors, spacing } from '@/src/theme';
import { useAuth } from '@/src/providers';

import { PASSWORD_RESET_RESEND_COOLDOWN_SECONDS, secondsUntil } from './recoverySecurity';

type AuthScreenMode = 'login' | 'register' | 'forgot-password';

type AuthScreenProps = {
  mode: AuthScreenMode;
};

type AuthScreenContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  secondaryHref: '/login' | '/register' | '/forgot-password';
  secondaryLabel: string;
  fields: Array<{
    name: AuthFieldName;
    label: string;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address';
    textContentType?: 'emailAddress' | 'password' | 'newPassword';
  }>;
};

type AuthFieldName = 'name' | 'email' | 'password';
type AuthValues = Record<AuthFieldName, string>;
type AuthErrors = Partial<Record<AuthFieldName, string>>;
type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
};

const authContent: Record<AuthScreenMode, AuthScreenContent> = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Sign in to AxionRide',
    description: 'Access your future garage, maintenance records, and ride companion workspace.',
    primaryAction: 'Sign In',
    secondaryHref: '/register',
    secondaryLabel: 'Create account',
    fields: [
      {
        name: 'email',
        label: 'Email',
        placeholder: 'rider@example.com',
        keyboardType: 'email-address',
        textContentType: 'emailAddress',
      },
      {
        name: 'password',
        label: 'Password',
        placeholder: 'Enter password',
        secureTextEntry: true,
        textContentType: 'password',
      },
    ],
  },
  register: {
    eyebrow: 'Start your garage',
    title: 'Create your account',
    description: 'Prepare a secure AxionRide profile for future sync and ownership records.',
    primaryAction: 'Create Account',
    secondaryHref: '/login',
    secondaryLabel: 'Already have an account',
    fields: [
      {
        name: 'name',
        label: 'Name',
        placeholder: 'Rider name',
      },
      {
        name: 'email',
        label: 'Email',
        placeholder: 'rider@example.com',
        keyboardType: 'email-address',
        textContentType: 'emailAddress',
      },
      {
        name: 'password',
        label: 'Password',
        placeholder: 'Create password',
        secureTextEntry: true,
        textContentType: 'newPassword',
      },
    ],
  },
  'forgot-password': {
    eyebrow: 'Account recovery',
    title: 'Reset your password',
    description: 'Enter your email and AxionRide will send secure recovery instructions.',
    primaryAction: 'Send Reset Link',
    secondaryHref: '/login',
    secondaryLabel: 'Return to sign in',
    fields: [
      {
        name: 'email',
        label: 'Email',
        placeholder: 'rider@example.com',
        keyboardType: 'email-address',
        textContentType: 'emailAddress',
      },
    ],
  },
};

export function AuthScreen({ mode }: AuthScreenProps) {
  const { login, register, requestPasswordReset, submitting } = useAuth();
  const content = authContent[mode];
  const [values, setValues] = useState<AuthValues>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [resetCooldownEndsAt, setResetCooldownEndsAt] = useState<number | null>(null);
  const [resetCooldownSeconds, setResetCooldownSeconds] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const passwordStrength = useMemo(() => getPasswordStrength(values.password), [values.password]);

  useEffect(() => {
    if (resetCooldownEndsAt === null) return;
    const updateCooldown = () => {
      const remaining = secondsUntil(resetCooldownEndsAt);
      setResetCooldownSeconds(remaining);
      if (remaining === 0) setResetCooldownEndsAt(null);
    };
    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    return () => clearInterval(timer);
  }, [resetCooldownEndsAt]);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'info',
  });

  function showToast(message: string, variant: ToastVariant) {
    setToast({ visible: true, message, variant });
  }

  function updateValue(name: AuthFieldName, value: string) {
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
  }

  function validateRequired(fields: AuthFieldName[], message: string) {
    const nextErrors: AuthErrors = {};

    fields.forEach((field) => {
      if (!values[field].trim()) {
        nextErrors[field] = 'Required';
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast(message, 'warning');
      return false;
    }

    return true;
  }

  async function handlePrimaryAction() {
    if (mode === 'login') {
      if (!validateRequired(['email', 'password'], 'Please enter your email and password.')) {
        return;
      }

      const result = await login(values.email, values.password);
      if (!result.ok) showToast(result.error.message, result.error.offline ? 'warning' : 'error');
      return;
    }

    if (mode === 'register') {
      if (!validateRequired(['name', 'email', 'password'], 'Please complete all required fields.')) {
        return;
      }

      if (values.password.length < 8) { setErrors({ password: 'Use at least 8 characters' }); showToast('Use a password with at least 8 characters.', 'warning'); return; }
      const result = await register(values.name, values.email, values.password);
      if (!result.ok) { showToast(result.error.message, result.error.offline ? 'warning' : 'error'); return; }
      showToast(result.value.requiresEmailConfirmation ? 'Check your email to confirm your AxionRide account.' : 'Account created.', 'success');
      return;
    }

    if (!validateRequired(['email'], 'Please enter your email.')) {
      return;
    }

    if (resetCooldownSeconds > 0) {
      showToast(`You can send another reset link in ${resetCooldownSeconds} seconds.`, 'info');
      return;
    }

    const result = await requestPasswordReset(values.email);
    if (result.ok) setResetCooldownEndsAt(Date.now() + PASSWORD_RESET_RESEND_COOLDOWN_SECONDS * 1000);
    showToast(result.ok ? 'If an account exists for that email, recovery instructions have been sent.' : result.error.message, result.ok ? 'success' : result.error.offline ? 'warning' : 'error');
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        contentContainerStyle={styles.content}>
        <View style={styles.ambientTop} />
        <View style={styles.ambientBottom} />
        <AxionRideLogo variant="symbol" style={styles.logo} imageStyle={styles.logoImage} />

        <GlassCard style={styles.card}>
          {mode === 'login' ? (
            <Text style={styles.welcome}>Welcome back, <Text style={styles.rider}>Rider.</Text></Text>
          ) : <Title style={styles.title}>{content.title}</Title>}
          <Body muted style={styles.description}>
            {mode === 'login' ? 'Log in to continue your journey.' : content.description}
          </Body>

          <View style={styles.fields}>
            {content.fields.map((field) => (
              <AppTextInput
                key={field.label}
                label={field.label}
                placeholder={field.placeholder}
                value={values[field.name]}
                error={errors[field.name]}
                keyboardType={field.keyboardType}
                secureTextEntry={field.secureTextEntry}
                showPasswordToggle={field.name === 'password'}
                passwordVisible={passwordVisible}
                onTogglePasswordVisibility={() => setPasswordVisible((visible) => !visible)}
                textContentType={field.textContentType}
                autoCapitalize="none"
                onChangeText={(value) => updateValue(field.name, value)}
                onFocus={() => {
                  if (field.name === 'password') {
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
                  }
                }}
                leadingIcon={mode === 'login' ? (
                  <SymbolView
                    name={field.name === 'email'
                      ? { ios: 'envelope.fill', android: 'mail', web: 'mail' }
                      : { ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    tintColor={palette.accentOrange}
                    size={21}
                  />
                ) : undefined}
              />
            ))}
            {mode === 'register' ? <PasswordStrengthMeter strength={passwordStrength} /> : null}
          </View>

          {mode === 'login' ? (
            <Link href="/forgot-password" style={styles.forgot}>Forgot password?</Link>
          ) : null}

          <PrimaryButton
            title={mode === 'login' ? 'Log In' : mode === 'forgot-password' && resetCooldownSeconds > 0 ? `Resend in ${resetCooldownSeconds}s` : content.primaryAction}
            loading={submitting}
            disabled={submitting || (mode === 'forgot-password' && resetCooldownSeconds > 0)}
            onPress={() => { void handlePrimaryAction(); }}
          />

          {mode === 'forgot-password' && resetCooldownSeconds > 0 ? (
            <Text accessibilityLiveRegion="polite" style={styles.cooldownText}>Reset link sent. You can request another link in {resetCooldownSeconds} seconds.</Text>
          ) : null}

          {mode === 'login' ? (
            <View style={styles.signupRow}>
              <Text style={styles.signupCopy}>Don’t have an account? </Text>
              <Link href="/register" style={styles.signupLink}>Sign up</Link>
            </View>
          ) : (
            <>
              <View style={styles.dividerRow}><View style={styles.divider}/><Caption style={styles.or}>OR</Caption><View style={styles.divider}/></View>
              <Link href={content.secondaryHref} asChild><SecondaryButton title={content.secondaryLabel} /></Link>
            </>
          )}
        </GlassCard>
      </ScrollView>
      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((currentToast) => ({ ...currentToast, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

type PasswordStrength = { readonly score: number; readonly label: string; readonly color: string; readonly hint: string };

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: 'Not entered', color: 'rgba(154,163,178,.28)', hint: 'Use 8+ characters with a number and symbol.' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { score: 1, label: 'Weak', color: palette.danger, hint: 'Add length, numbers, and a symbol.' };
  if (score <= 3) return { score: 2, label: 'Good', color: palette.warning, hint: 'A longer password will be stronger.' };
  return { score: 3, label: 'Strong', color: palette.success, hint: 'Your password has a strong mix.' };
}

function PasswordStrengthMeter({ strength }: { readonly strength: PasswordStrength }) {
  return (
    <View accessible accessibilityRole="summary" accessibilityLabel={`Password strength: ${strength.label}. ${strength.hint}`} style={styles.strength}>
      <View style={styles.strengthHeader}><Text style={styles.strengthTitle}>Password strength</Text><Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text></View>
      <View style={styles.strengthBars}>{[1, 2, 3].map((step) => <View key={step} style={[styles.strengthBar, step <= strength.score && { backgroundColor: strength.color }]} />)}</View>
      <Text style={styles.strengthHint}>{strength.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 42,
    paddingBottom: 72,
    gap: spacing.lg,
  },
  ambientTop:{position:'absolute',top:-100,right:-120,width:300,height:300,borderRadius:150,backgroundColor:'rgba(255,106,0,.07)'},
  ambientBottom:{position:'absolute',bottom:-120,left:-140,width:320,height:320,borderRadius:160,backgroundColor:'rgba(255,106,0,.035)'},
  logo:{alignSelf:'center',marginBottom:12},
  logoImage:{width:260,height:150,marginBottom:0},
  card: {
    gap: spacing.lg,
    padding:0,
    borderWidth:0,
    backgroundColor:'transparent',
  },
  welcome:{color:semanticColors.dark.text,fontSize:34,lineHeight:40,fontWeight:'900',letterSpacing:-1},
  rider:{color:palette.accentOrange},
  title: {
    color: semanticColors.dark.text,
  },
  description: {
    marginTop: -spacing.sm,
    fontSize:16,
  },
  fields: {
    gap: spacing.lg,
  },
  strength:{gap:8,marginTop:-spacing.sm},
  strengthHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.md},
  strengthTitle:{color:palette.textMuted,fontSize:12,fontWeight:'800',textTransform:'uppercase',letterSpacing:.5},
  strengthLabel:{fontSize:12,fontWeight:'900'},
  strengthBars:{flexDirection:'row',gap:7},
  strengthBar:{flex:1,height:4,borderRadius:2,backgroundColor:'rgba(154,163,178,.18)'},
  strengthHint:{color:'rgba(154,163,178,.72)',fontSize:12,lineHeight:17},
  forgot:{alignSelf:'flex-end',marginTop:-spacing.sm,color:palette.accentOrange,fontSize:14,fontWeight:'800'},
  signupRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',marginTop:spacing.sm},
  signupCopy:{color:palette.textMuted,fontSize:15,fontWeight:'600'},
  signupLink:{color:palette.accentOrange,fontSize:15,fontWeight:'900'},
  cooldownText:{color:palette.textMuted,fontSize:13,lineHeight:19,textAlign:'center'},
  divider: {
    flex:1,
    height: 1,
    backgroundColor: semanticColors.dark.border,
  },
  dividerRow:{flexDirection:'row',alignItems:'center',gap:spacing.lg},
  or:{color:'rgba(248,250,252,.52)',fontWeight:'800'},
});

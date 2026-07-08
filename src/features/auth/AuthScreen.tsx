import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppTextInput,
  AxionRideLogo,
  Body,
  Caption,
  GlassCard,
  GhostButton,
  PrimaryButton,
  SecondaryButton,
  Title,
  Toast,
  type ToastVariant,
} from '@/src/components';
import { palette, semanticColors, spacing } from '@/src/theme';

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
    description: 'Enter your email and AxionRide will later send secure recovery instructions.',
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

/** UI-only authentication screen shell. It does not submit, validate, or connect to a backend yet. */
export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const content = authContent[mode];
  const loginTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [values, setValues] = useState<AuthValues>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'info',
  });

  useEffect(() => {
    return () => {
      if (loginTimer.current) {
        clearTimeout(loginTimer.current);
      }
      if (navigationTimer.current) {
        clearTimeout(navigationTimer.current);
      }
    };
  }, []);

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

  function handlePrimaryAction() {
    if (mode === 'login') {
      if (!validateRequired(['email', 'password'], 'Please enter your email and password.')) {
        return;
      }

      setIsSubmitting(true);
      loginTimer.current = setTimeout(() => {
        setIsSubmitting(false);
        showToast('Welcome back!', 'success');
        navigationTimer.current = setTimeout(() => {
          router.replace('/');
        }, 650);
      }, 1000);
      return;
    }

    if (mode === 'register') {
      if (!validateRequired(['name', 'email', 'password'], 'Please complete all required fields.')) {
        return;
      }

      showToast('Registration is coming soon.', 'info');
      return;
    }

    if (!validateRequired(['email'], 'Please enter your email.')) {
      return;
    }

    showToast('Password recovery will be available after backend integration.', 'info');
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        contentContainerStyle={styles.content}>
        <AxionRideLogo compact />

        <GlassCard style={styles.card}>
          <Caption style={styles.eyebrow}>{content.eyebrow}</Caption>
          <Title style={styles.title}>{content.title}</Title>
          <Body muted style={styles.description}>
            {content.description}
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
              />
            ))}
          </View>

          <PrimaryButton
            title={content.primaryAction}
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handlePrimaryAction}
          />

          {mode === 'login' ? (
            <Link href="/forgot-password" asChild>
              <GhostButton title="Forgot password" />
            </Link>
          ) : null}

          <View style={styles.divider} />

          <Link href={content.secondaryHref} asChild>
            <SecondaryButton title={content.secondaryLabel} />
          </Link>
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
    padding: spacing.xl,
    gap: spacing.xl,
  },
  card: {
    gap: spacing.lg,
  },
  eyebrow: {
    color: palette.accentBlue,
    textTransform: 'uppercase',
  },
  title: {
    color: semanticColors.dark.text,
  },
  description: {
    marginTop: -spacing.sm,
  },
  fields: {
    gap: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: semanticColors.dark.border,
  },
});

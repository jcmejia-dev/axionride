import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/src/components/useColorScheme';
import { AppLoadingScreen, useAppBootstrap } from '@/src/features/app-shell';
import { AuthProvider, useAuth } from '@/src/providers';
import { getAuthRedirect } from '@/src/navigation/AuthRoutePolicy';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isReady } = useAppBootstrap(loaded);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (!isReady) {
    return <AppLoadingScreen />;
  }

  return <AuthProvider><RootLayoutNav /></AuthProvider>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const auth = useAuth();

  if (!auth.initialized) return <AppLoadingScreen />;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthRouteGuard />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="motorcycle-management" options={{ title: 'Motorcycle Management' }} />
        <Stack.Screen name="workspace-setup" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'AxionRide' }} />
      </Stack>
    </ThemeProvider>
  );
}

function AuthRouteGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { initialized, session, onboardingCompleted, workspaceDecisionRequired, recoveryMode } = useAuth();

  useEffect(() => {
    if (!initialized) return;
    const redirect = getAuthRedirect({ firstSegment: segments[0] as string | undefined, signedIn: Boolean(session), onboardingCompleted, workspaceDecisionRequired, recoveryMode });
    if (redirect) router.replace(redirect as Href);
  }, [initialized, onboardingCompleted, recoveryMode, router, segments, session, workspaceDecisionRequired]);

  return null;
}

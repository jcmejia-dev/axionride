import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="tour" />
      <Stack.Screen name="first-motorcycle" />
    </Stack>
  );
}

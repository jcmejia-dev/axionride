import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { useColorScheme } from '@/src/components/useColorScheme';
import { useClientOnlyValue } from '@/src/components/useClientOnlyValue';
import { colorScheme as themeColors, palette } from '@/src/theme';

export default function TabLayout() {
  const colorSchemeName = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors[colorSchemeName].tint,
        tabBarInactiveTintColor: themeColors[colorSchemeName].tabIconDefault,
        tabBarStyle: {
          backgroundColor: palette.darkPrimary,
          borderTopColor: palette.border,
        },
        headerStyle: {
          backgroundColor: palette.darkBackground,
        },
        headerTintColor: palette.text,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'house.fill',
                android: 'home',
                web: 'home',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Garage',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'wrench.and.screwdriver.fill',
                android: 'build',
                web: 'build',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}

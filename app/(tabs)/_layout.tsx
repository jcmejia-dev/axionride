import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/src/components/useColorScheme';
import { colorScheme as themeColors, premiumColors, radius, spacing, typography } from '@/src/theme';

export default function TabLayout() {
  const colorSchemeName = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors[colorSchemeName].tint,
        tabBarInactiveTintColor: themeColors[colorSchemeName].tabIconDefault,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 78 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ],
        tabBarItemStyle: styles.tabItem,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'gauge.with.dots.needle.67percent',
                android: 'dashboard',
                web: 'dashboard',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="garage"
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
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Rides',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'road.lanes',
                android: 'route',
                web: 'route',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: 'Maintenance',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'checklist.checked',
                android: 'checklist',
                web: 'checklist',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'person.crop.circle.fill',
                android: 'person',
                web: 'person',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.sm,
    left: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderWidth: 1,
    borderColor: premiumColors.borderStrong,
    borderRadius: radius.xl + 4,
    backgroundColor: 'rgba(11, 15, 21, 0.98)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  tabItem: {
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
});

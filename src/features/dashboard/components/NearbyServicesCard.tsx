import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette, radius, spacing, typography } from "@/src/theme";

type NearbyServicesCardProps = {
  readonly onPress: () => void;
};

export function NearbyServicesCard({ onPress }: NearbyServicesCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Find nearby motorcycle services"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.iconShell}>
        <SymbolView
          name={{
            ios: "fuelpump.fill",
            android: "local_gas_station",
            web: "local_gas_station",
          }}
          tintColor={palette.accentOrange}
          size={22}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Nearby Services</Text>
        <Text style={styles.subtitle}>
          Fuel, repair shops, and more near you
        </Text>
      </View>
      <SymbolView
        name={{
          ios: "chevron.right",
          android: "chevron_right",
          web: "chevron_right",
        }}
        tintColor={palette.textMuted}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: radius.xl,
    backgroundColor: "rgba(17, 21, 28, 0.88)",
  },
  iconShell: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(255, 177, 32, 0.09)",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.subtitle,
    color: palette.text,
    fontWeight: "900",
  },
  subtitle: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});

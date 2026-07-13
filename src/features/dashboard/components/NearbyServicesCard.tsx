import { SymbolView } from "expo-symbols";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { elevation, palette, spacing, typography } from "@/src/theme";

const HUD_FONT = Platform.select({ android: 'sans-serif-condensed', default: undefined });

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
          tintColor="#7F919E"
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
    ...elevation.soft,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(98, 124, 143, 0.25)",
    borderRadius: 8,
    backgroundColor: "rgba(4, 10, 16, 0.94)",
  },
  iconShell: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: 'rgba(113, 137, 153, 0.25)',
    borderRadius: 4,
    backgroundColor: "rgba(105, 128, 145, 0.06)",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.subtitle,
    fontFamily: HUD_FONT,
    fontStyle: 'italic',
    letterSpacing: 0.4,
    color: palette.text,
    fontWeight: "900",
  },
  subtitle: {
    ...typography.caption,
    fontFamily: HUD_FONT,
    color: palette.textMuted,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});

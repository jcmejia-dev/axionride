import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { PulsingRiderMarker } from "@/src/features/map/components/PulsingRiderMarker";
import { palette, radius, spacing, typography } from "@/src/theme";

type ActiveTripScreenProps = {
  readonly tripId: string;
  readonly onFinish: () => void;
};

export function ActiveTripScreen({ tripId, onFinish }: ActiveTripScreenProps) {
  const [traveledDistance, setTraveledDistance] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  useEffect(() => {
    // Simulate trip data updates
    const interval = setInterval(() => {
      setTraveledDistance((prev) => prev + 0.1);
      setRemainingDistance((prev) => Math.max(0, prev - 0.1));
      setCurrentSpeed(Math.random() * 60);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStop = () => {
    Alert.alert("Finish trip?", "Are you sure you want to end this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        onPress: onFinish,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ACTIVE TRIP</Text>
        <Text style={styles.tripId}>Trip ID: {tripId}</Text>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <PulsingRiderMarker size={48} />
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>
            Start and destination markers would appear here
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TRAVELED</Text>
          <Text style={styles.statValue}>
            {(traveledDistance / 1000).toFixed(1)} km
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>REMAINING</Text>
          <Text style={styles.statValue}>
            {(remainingDistance / 1000).toFixed(1)} km
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TIME LEFT</Text>
          <Text style={styles.statValue}>
            {Math.floor(estimatedTime / 60)} min
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>SPEED</Text>
          <Text style={styles.statValue}>{currentSpeed.toFixed(0)} km/h</Text>
        </View>
      </View>

      <Pressable onPress={handleStop} style={styles.stopButton}>
        <SymbolView name="stop.fill" tintColor="#fff" size={24} />
        <Text style={styles.stopButtonText}>Finish Trip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  header: {
    padding: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: palette.text,
    letterSpacing: 1.2,
  },
  tripId: {
    ...typography.caption,
    color: palette.textMuted,
  },
  mapContainer: {
    flex: 1,
    margin: spacing.xl,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(17,21,28,.88)",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  mapText: {
    ...typography.subtitle,
    color: palette.text,
    fontWeight: "800",
  },
  mapSubtext: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(17,21,28,.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.label,
    color: palette.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
  statValue: {
    ...typography.subtitle,
    color: palette.text,
    fontWeight: "800",
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    margin: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.danger,
  },
  stopButtonText: {
    ...typography.button,
    color: "#fff",
    fontWeight: "800",
  },
});

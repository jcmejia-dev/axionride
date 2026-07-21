import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { FuelSummary } from "@/src/domain/fuel";
import { createFuelService, type CreateFuelLogInput } from "@/src/services";
import { layout, palette, radius, spacing, typography } from "@/src/theme";

type FuelSectionProps = {
  readonly motorcycleId: string;
  readonly motorcycleNickname: string;
};

export function FuelSection({
  motorcycleId,
  motorcycleNickname,
}: FuelSectionProps) {
  const router = useRouter();
  const fuelService = useMemo(() => createFuelService(), []);
  const [summary, setSummary] = useState<FuelSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    const result = await fuelService.getFuelSummary(motorcycleId);
    if (result.ok) {
      setSummary(result.value);
    }
    setLoading(false);
  };

  const handleCreateFuel = async (input: CreateFuelLogInput) => {
    const result = await fuelService.createFuelLog(input);
    if (result.ok) {
      setCreateSheetVisible(false);
      await loadSummary();
    } else {
      Alert.alert("Fuel log not saved", result.error.message);
    }
  };

  const handleDeleteFuel = async (id: string) => {
    Alert.alert("Delete fuel log?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await fuelService.deleteFuelLog(id);
          if (result.ok) {
            await loadSummary();
          } else {
            Alert.alert("Delete failed", result.error.message);
          }
        },
      },
    ]);
  };

  const handleCorrectFuel = () => {
    if (Platform.OS === "ios" && typeof (Alert as any).prompt === "function") {
      (Alert as any).prompt(
        "Correct estimated fuel",
        "Enter the current fuel level in liters:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: async (value: string | undefined) => {
              const liters = parseFloat(value || "0");
              if (isNaN(liters) || liters < 0) {
                Alert.alert("Invalid value", "Please enter a valid number.");
                return;
              }
              const result = await fuelService.correctEstimatedFuel(
                motorcycleId,
                liters,
              );
              if (result.ok) {
                await loadSummary();
              } else {
                Alert.alert("Update failed", result.error.message);
              }
            },
          },
        ],
        "plain-text",
      );
    } else {
      Alert.alert(
        "Correction unavailable",
        "Fuel correction is only supported on iOS.",
      );
    }
  };

  const handleResetFuel = async () => {
    Alert.alert(
      "Reset estimated fuel?",
      "This will recalculate from your fuel logs.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            const result = await fuelService.resetEstimatedFuel(motorcycleId);
            if (result.ok) {
              await loadSummary();
            } else {
              Alert.alert("Reset failed", result.error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>FUEL</Text>
          <Text style={styles.subtitle}>{motorcycleNickname}</Text>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Loading fuel data...</Text>
          </View>
        ) : summary ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>
                    ESTIMATED FUEL REMAINING
                  </Text>
                  <Text style={styles.summaryValue}>
                    {summary.estimatedFuelRemaining !== null
                      ? `${summary.estimatedFuelRemaining.toFixed(1)} L`
                      : "—"}
                  </Text>
                  <Pressable
                    onPress={handleCorrectFuel}
                    style={styles.smallButton}
                  >
                    <Text style={styles.smallButtonText}>Correct</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleResetFuel}
                    style={styles.smallButton}
                  >
                    <Text style={styles.smallButtonText}>Reset</Text>
                  </Pressable>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>LAST REFILL</Text>
                  <Text style={styles.summaryValue}>
                    {summary.lastRefill
                      ? `${summary.lastRefill.liters.toFixed(1)} L @ ₱${summary.lastRefill.pricePerLiter.toFixed(2)}`
                      : "No records"}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>AVERAGE KM/L</Text>
                  <Text style={styles.summaryValue}>
                    {summary.averageKmPerLiter !== null
                      ? summary.averageKmPerLiter.toFixed(1)
                      : "—"}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>COST PER KM</Text>
                  <Text style={styles.summaryValue}>
                    {summary.averageCostPerKm !== null
                      ? `₱${summary.averageCostPerKm.toFixed(2)}`
                      : "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>MONTHLY SPENDING</Text>
                  <Text style={styles.summaryValue}>
                    ₱{summary.monthlySpent.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
                  <Text style={styles.summaryValue}>
                    ₱{summary.totalSpent.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.warningBox}>
              <SymbolView
                name="exclamationmark.triangle"
                tintColor={palette.accentOrange}
                size={16}
              />
              <Text style={styles.warningText}>
                Estimate depends on complete fuel and ride records.
              </Text>
            </View>

            <Pressable
              onPress={() => setCreateSheetVisible(true)}
              style={styles.addButton}
            >
              <SymbolView name="plus" tintColor="#fff" size={20} />
              <Text style={styles.addButtonText}>Add Fuel</Text>
            </Pressable>

            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Fuel History</Text>
              {summary.fuelLogs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No fuel logs yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add your first refuel to start tracking
                  </Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {summary.fuelLogs.map((log) => (
                    <View key={log.id} style={styles.historyItem}>
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyDate}>
                          {new Date(log.recordedAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.historyDetails}>
                          {log.liters.toFixed(1)} L @ ₱
                          {log.pricePerLiter.toFixed(2)}/L
                        </Text>
                        <Text style={styles.historyOdometer}>
                          {(log.odometerKm / 1000).toFixed(1)} km
                        </Text>
                        <Text style={styles.historyCost}>
                          ₱{log.totalCost.toFixed(2)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleDeleteFuel(log.id)}
                        style={styles.deleteButton}
                      >
                        <SymbolView
                          name="trash"
                          tintColor={palette.danger}
                          size={18}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>No fuel data available</Text>
          </View>
        )}
      </ScrollView>

      {createSheetVisible && (
        <FuelCreateSheet
          visible={createSheetVisible}
          motorcycleId={motorcycleId}
          onCreate={handleCreateFuel}
          onClose={() => setCreateSheetVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

function FuelCreateSheet({
  visible,
  motorcycleId,
  onCreate,
  onClose,
}: {
  readonly visible: boolean;
  readonly motorcycleId: string;
  readonly onCreate: (input: CreateFuelLogInput) => void;
  readonly onClose: () => void;
}) {
  const [odometerKm, setOdometerKm] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [liters, setLiters] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [fillType, setFillType] = useState<"full_tank" | "partial_refill">(
    "full_tank",
  );
  const [stationName, setStationName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const calculateMissing = () => {
    const price = parseFloat(pricePerLiter);
    const litersVal = parseFloat(liters);
    const total = parseFloat(totalCost);

    if (price && litersVal && !total) {
      setTotalCost((price * litersVal).toFixed(2));
    } else if (price && total && !litersVal) {
      setLiters((total / price).toFixed(2));
    } else if (litersVal && total && !price) {
      setPricePerLiter((total / litersVal).toFixed(2));
    }
  };

  const handleSubmit = async () => {
    const odometer = parseFloat(odometerKm);
    if (isNaN(odometer) || odometer < 0) {
      Alert.alert("Invalid input", "Please enter a valid odometer reading.");
      return;
    }

    const price = pricePerLiter ? parseFloat(pricePerLiter) : undefined;
    const litersVal = liters ? parseFloat(liters) : undefined;
    const total = totalCost ? parseFloat(totalCost) : undefined;

    if (litersVal && litersVal <= 0) {
      Alert.alert("Invalid input", "Liters must be greater than zero.");
      return;
    }

    setLoading(true);
    await onCreate({
      motorcycleId,
      recordedAt: new Date().toISOString(),
      odometerKm: odometer,
      pricePerLiter: price,
      liters: litersVal,
      totalCost: total,
      fillType,
      stationName: stationName || undefined,
      notes: notes || undefined,
    });
    setLoading(false);
  };

  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheetContent}>
        <Text style={styles.sheetTitle}>Add Fuel</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Odometer (km)</Text>
          <TextInput
            style={styles.input}
            value={odometerKm}
            onChangeText={setOdometerKm}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Price per Liter (₱)</Text>
          <TextInput
            style={styles.input}
            value={pricePerLiter}
            onChangeText={(text) => {
              setPricePerLiter(text);
              calculateMissing();
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Liters</Text>
          <TextInput
            style={styles.input}
            value={liters}
            onChangeText={(text) => {
              setLiters(text);
              calculateMissing();
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Total Cost (₱)</Text>
          <TextInput
            style={styles.input}
            value={totalCost}
            onChangeText={(text) => {
              setTotalCost(text);
              calculateMissing();
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fill Type</Text>
          <View style={styles.segmentedControl}>
            <Pressable
              style={[
                styles.segment,
                fillType === "full_tank" && styles.selectedSegment,
              ]}
              onPress={() => setFillType("full_tank")}
            >
              <Text
                style={[
                  styles.segmentText,
                  fillType === "full_tank" && styles.selectedSegmentText,
                ]}
              >
                Full Tank
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segment,
                fillType === "partial_refill" && styles.selectedSegment,
              ]}
              onPress={() => setFillType("partial_refill")}
            >
              <Text
                style={[
                  styles.segmentText,
                  fillType === "partial_refill" && styles.selectedSegmentText,
                ]}
              >
                Partial
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Station Name (optional)</Text>
          <TextInput
            style={styles.input}
            value={stationName}
            onChangeText={setStationName}
            placeholder="Shell, Petron, etc."
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes"
          />
        </View>

        <View style={styles.sheetActions}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: palette.text,
    letterSpacing: 1.2,
  },
  subtitle: {
    ...typography.caption,
    color: palette.textMuted,
  },
  summaryCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: "rgba(17,21,28,.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.label,
    color: palette.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
  summaryValue: {
    ...typography.subtitle,
    color: palette.text,
    fontWeight: "800",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,118,23,.08)",
    borderWidth: 1,
    borderColor: "rgba(255,118,23,.2)",
  },
  warningText: {
    ...typography.caption,
    color: palette.textMuted,
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.accentOrange,
  },
  addButtonText: {
    ...typography.button,
    color: "#fff",
    fontWeight: "800",
  },
  historySection: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
    fontWeight: "800",
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(17,21,28,.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
  },
  historyItemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  historyDate: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  historyDetails: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  historyOdometer: {
    ...typography.caption,
    color: palette.textMuted,
  },
  historyCost: {
    ...typography.subtitle,
    color: palette.accentOrange,
    fontWeight: "800",
  },
  deleteButton: {
    padding: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.subtitle,
    color: palette.textMuted,
  },
  emptySubtext: {
    ...typography.caption,
    color: palette.textMuted,
  },
  stateContainer: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xxl,
  },
  stateText: {
    ...typography.body,
    color: palette.textMuted,
  },
  smallButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,.08)",
    marginTop: spacing.xs,
  },
  smallButtonText: {
    ...typography.caption,
    color: palette.text,
    fontWeight: "700",
  },
  sheetOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,.6)",
  },
  sheetContent: {
    backgroundColor: palette.darkBackground,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    maxHeight: "90%",
  },
  sheetTitle: {
    ...typography.subtitle,
    color: palette.text,
    fontWeight: "900",
  },
  formGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: palette.textMuted,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  input: {
    ...typography.body,
    color: palette.text,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
  },
  segmentedControl: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    alignItems: "center",
  },
  selectedSegment: {
    backgroundColor: "rgba(255,106,0,.12)",
    borderColor: palette.accentOrange,
  },
  segmentText: {
    ...typography.body,
    color: palette.textMuted,
    fontWeight: "700",
  },
  selectedSegmentText: {
    color: palette.accentOrange,
  },
  sheetActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,.08)",
    alignItems: "center",
  },
  cancelButtonText: {
    ...typography.button,
    color: palette.text,
  },
  submitButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.accentOrange,
    alignItems: "center",
  },
  submitButtonText: {
    ...typography.button,
    color: "#fff",
  },
});

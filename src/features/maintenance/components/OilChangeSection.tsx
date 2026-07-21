import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createOilChangeService } from "@/src/services";
import { palette, radius, spacing, typography } from "@/src/theme";

type OilChangeSectionProps = {
  readonly motorcycleId: string;
  readonly motorcycleNickname: string;
};

export function OilChangeSection({
  motorcycleId,
  motorcycleNickname,
}: OilChangeSectionProps) {
  const oilChangeService = useMemo(() => createOilChangeService(), []);
  const [history, setHistory] = useState<readonly any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    const result = await oilChangeService.getOilChangeHistory(motorcycleId);
    if (result.ok) {
      setHistory(result.value);
    }
    setLoading(false);
  };

  const handleCreate = async (input: any) => {
    const result = await oilChangeService.createOilChange(input);
    if (result.ok) {
      setCreateSheetVisible(false);
      await loadHistory();
    } else {
      Alert.alert("Oil change not saved", result.error.message);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete oil change record?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await oilChangeService.deleteOilChange(id);
          if (result.ok) {
            await loadHistory();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>OIL CHANGES</Text>
          <Text style={styles.subtitle}>{motorcycleNickname}</Text>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Loading oil change history...</Text>
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => setCreateSheetVisible(true)}
              style={styles.addButton}
            >
              <SymbolView name="plus" tintColor="#fff" size={20} />
              <Text style={styles.addButtonText}>Add Oil Change</Text>
            </Pressable>

            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Oil Change History</Text>
              {history.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No oil change records yet
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Add your first oil change to start tracking
                  </Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {history.map((record) => (
                    <View key={record.id} style={styles.historyItem}>
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyDate}>
                          {new Date(record.performedAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.historyDetails}>
                          {record.oilBrand || "Unknown brand"} -{" "}
                          {record.oilViscosity || "N/A"}
                        </Text>
                        <Text style={styles.historyOdometer}>
                          {(record.odometerKm / 1000).toFixed(1)} km
                        </Text>
                        {record.nextDueOdometerKm && (
                          <Text style={styles.nextDue}>
                            Next due:{" "}
                            {(record.nextDueOdometerKm / 1000).toFixed(1)} km
                          </Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => handleDelete(record.id)}
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
        )}
      </ScrollView>

      {createSheetVisible && (
        <OilChangeCreateSheet
          visible={createSheetVisible}
          motorcycleId={motorcycleId}
          onCreate={handleCreate}
          onClose={() => setCreateSheetVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

function OilChangeCreateSheet({
  visible,
  motorcycleId,
  onCreate,
  onClose,
}: {
  readonly visible: boolean;
  readonly motorcycleId: string;
  readonly onCreate: (input: any) => void;
  readonly onClose: () => void;
}) {
  const [odometerKm, setOdometerKm] = useState("");
  const [oilBrand, setOilBrand] = useState("");
  const [oilViscosity, setOilViscosity] = useState("");
  const [oilLiters, setOilLiters] = useState("");
  const [price, setPrice] = useState("");
  const [serviceShop, setServiceShop] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const odometer = parseFloat(odometerKm);
    if (isNaN(odometer) || odometer < 0) {
      Alert.alert("Invalid input", "Please enter a valid odometer reading.");
      return;
    }

    setLoading(true);
    await onCreate({
      motorcycleId,
      performedAt: new Date().toISOString(),
      odometerKm: odometer,
      oilBrand: oilBrand || undefined,
      oilViscosity: oilViscosity || undefined,
      oilLiters: oilLiters ? parseFloat(oilLiters) : undefined,
      price: price ? parseFloat(price) : undefined,
      serviceShop: serviceShop || undefined,
      notes: notes || undefined,
    });
    setLoading(false);
  };

  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheetContent}>
        <Text style={styles.sheetTitle}>Add Oil Change</Text>

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
          <Text style={styles.label}>Oil Brand</Text>
          <TextInput
            style={styles.input}
            value={oilBrand}
            onChangeText={setOilBrand}
            placeholder="Motul, Castrol, etc."
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Viscosity/Type</Text>
          <TextInput
            style={styles.input}
            value={oilViscosity}
            onChangeText={setOilViscosity}
            placeholder="10W-40, 5W-30, etc."
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Liters</Text>
          <TextInput
            style={styles.input}
            value={oilLiters}
            onChangeText={setOilLiters}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Price (₱)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Service Shop</Text>
          <TextInput
            style={styles.input}
            value={serviceShop}
            onChangeText={setServiceShop}
            placeholder="Shop name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
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
    paddingBottom: 100,
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
  nextDue: {
    ...typography.caption,
    color: palette.accentOrange,
    fontWeight: "700",
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

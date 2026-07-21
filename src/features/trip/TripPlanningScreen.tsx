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

import { createTripService } from "@/src/services";
import { palette, radius, spacing, typography } from "@/src/theme";

type TripPlanningScreenProps = {
  readonly motorcycleId: string;
};

export function TripPlanningScreen({ motorcycleId }: TripPlanningScreenProps) {
  const tripService = useMemo(() => createTripService(), []);
  const [trips, setTrips] = useState<readonly any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const loadTrips = async () => {
    setLoading(true);
    const result = await tripService.getTripHistory(motorcycleId);
    if (result.ok) {
      setTrips(result.value);
    }
    setLoading(false);
  };

  const handleCreate = async (input: any) => {
    const result = await tripService.createTrip(input);
    if (result.ok) {
      setCreateSheetVisible(false);
      await loadTrips();
    } else {
      Alert.alert("Trip not saved", result.error.message);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete trip?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await tripService.deleteTrip(id);
          if (result.ok) {
            await loadTrips();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>TRIP PLANNING</Text>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Loading trips...</Text>
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => setCreateSheetVisible(true)}
              style={styles.addButton}
            >
              <SymbolView name="plus" tintColor="#fff" size={20} />
              <Text style={styles.addButtonText}>Plan New Trip</Text>
            </Pressable>

            <View style={styles.tripList}>
              {trips.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No planned trips yet</Text>
                  <Text style={styles.emptySubtext}>
                    Plan your first adventure
                  </Text>
                </View>
              ) : (
                trips.map((trip) => (
                  <View key={trip.id} style={styles.tripItem}>
                    <View style={styles.tripContent}>
                      <Text style={styles.tripTitle}>{trip.title}</Text>
                      <Text style={styles.tripStatus}>{trip.status}</Text>
                      {trip.notes && (
                        <Text style={styles.tripNotes}>{trip.notes}</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(trip.id)}
                      style={styles.deleteButton}
                    >
                      <SymbolView
                        name="trash"
                        tintColor={palette.danger}
                        size={18}
                      />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {createSheetVisible && (
        <TripCreateSheet
          visible={createSheetVisible}
          motorcycleId={motorcycleId}
          onCreate={handleCreate}
          onClose={() => setCreateSheetVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

function TripCreateSheet({
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
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Invalid input", "Please enter a trip title.");
      return;
    }

    setLoading(true);
    await onCreate({
      motorcycleId,
      title,
      notes: notes || undefined,
      startLatitude: 0,
      startLongitude: 0,
      destinationLatitude: 0,
      destinationLongitude: 0,
      status: "draft",
    });
    setLoading(false);
  };

  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheetContent}>
        <Text style={styles.sheetTitle}>Plan New Trip</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Trip Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Weekend ride to..."
            placeholderTextColor={palette.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes"
            placeholderTextColor={palette.textMuted}
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
  tripList: {
    gap: spacing.sm,
  },
  tripItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(17,21,28,.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
  },
  tripContent: {
    flex: 1,
    gap: spacing.xs,
  },
  tripTitle: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  tripStatus: {
    ...typography.caption,
    color: palette.accentOrange,
    fontWeight: "700",
  },
  tripNotes: {
    ...typography.caption,
    color: palette.textMuted,
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

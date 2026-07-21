import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppTextInput, GhostButton, PrimaryButton } from "@/src/components";
import { MaintenanceType } from "@/src/domain/maintenance";
import type { CreateMaintenanceInput } from "@/src/services";
import { palette, radius, spacing, typography } from "@/src/theme";

type MaintenanceCreateSheetProps = {
  readonly visible: boolean;
  readonly loading?: boolean;
  readonly onClose: () => void;
  readonly onCreate: (input: CreateMaintenanceInput) => void;
};

const maintenanceTypes = [
  { value: MaintenanceType.OilChange, label: "Oil change", icon: "oil_barrel" },
  { value: MaintenanceType.ChainService, label: "Chain", icon: "settings" },
  { value: MaintenanceType.BrakeInspection, label: "Brakes", icon: "speed" },
] as const;

export function MaintenanceCreateSheet({
  visible,
  loading = false,
  onClose,
  onCreate,
}: MaintenanceCreateSheetProps) {
  const [title, setTitle] = useState("Oil change");
  const [type, setType] = useState<MaintenanceType>(MaintenanceType.OilChange);
  const [intervalKm, setIntervalKm] = useState("1500");
  const [cost, setCost] = useState("");

  useEffect(() => {
    if (!visible) return;
    setTitle("Oil change");
    setType(MaintenanceType.OilChange);
    setIntervalKm("1500");
    setCost("");
  }, [visible]);

  const trimmedTitle = title.trim();
  const parsedInterval = parseOptionalNumber(intervalKm);
  const parsedCost = parseOptionalNumber(cost);
  const titleError = !trimmedTitle ? "Give this service a title." : undefined;
  const intervalError =
    intervalKm.trim() && (parsedInterval === undefined || parsedInterval <= 0)
      ? "Enter a distance greater than zero."
      : undefined;
  const costError =
    cost.trim() && (parsedCost === undefined || parsedCost < 0)
      ? "Enter a valid non-negative cost."
      : undefined;
  const formInvalid = Boolean(titleError || intervalError || costError);

  function handleCreate() {
    if (formInvalid) return;
    onCreate({
      title: trimmedTitle,
      type,
      intervalKm: parsedInterval,
      cost: parsedCost,
    });
  }

  function selectType(nextType: MaintenanceType, label: string) {
    setType(nextType);
    setTitle(label);
  }

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="Close maintenance form"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <SymbolView
                name={{ ios: "wrench.and.screwdriver.fill", android: "build", web: "build" }}
                size={22}
                tintColor={palette.accentOrange}
              />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>SERVICE COMMAND</Text>
              <Text accessibilityRole="header" style={styles.title}>Schedule maintenance</Text>
              <Text style={styles.subtitle}>Set a service interval and AxionRide will track it.</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={18} tintColor={palette.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.typeGroup}>
              <Text style={styles.fieldLabel}>SERVICE TYPE</Text>
              <View style={styles.typeRow}>
                {maintenanceTypes.map((item) => {
                  const selected = type === item.value;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={item.value}
                      onPress={() => selectType(item.value, item.label)}
                      style={({ pressed }) => [
                        styles.typeCard,
                        selected && styles.selectedTypeCard,
                        pressed && styles.pressed,
                      ]}
                    >
                      <SymbolView
                        name={{ ios: selected ? "checkmark.circle.fill" : "circle", android: item.icon, web: item.icon }}
                        size={20}
                        tintColor={selected ? palette.accentOrange : palette.textMuted}
                      />
                      <Text style={[styles.typeCardText, selected && styles.selectedTypeText]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <AppTextInput
              error={titleError}
              label="Title"
              onChangeText={setTitle}
              placeholder="Oil change"
              returnKeyType="next"
              value={title}
            />

            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <AppTextInput
                  error={intervalError}
                  helperText="Distance before due"
                  keyboardType="decimal-pad"
                  label="Interval (km)"
                  onChangeText={setIntervalKm}
                  placeholder="1500"
                  value={intervalKm}
                />
              </View>
              <View style={styles.inputColumn}>
                <AppTextInput
                  error={costError}
                  helperText="Optional"
                  keyboardType="decimal-pad"
                  label="Cost (PHP)"
                  onChangeText={setCost}
                  placeholder="0.00"
                  value={cost}
                />
              </View>
            </View>

            <View style={styles.trackingNote}>
              <SymbolView name={{ ios: "location.fill", android: "route", web: "route" }} size={17} tintColor={palette.accentBlue} />
              <Text style={styles.trackingText}>Completed rides automatically advance distance-based maintenance.</Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <GhostButton disabled={loading} onPress={onClose} style={styles.actionButton} title="Cancel" />
            <PrimaryButton disabled={formInvalid} loading={loading} onPress={handleCreate} style={styles.actionButton} title="Create schedule" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function parseOptionalNumber(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;
  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.76)" },
  sheet: {
    maxHeight: "91%",
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,118,23,.24)",
    backgroundColor: "#080C11",
  },
  handle: { alignSelf: "center", width: 44, height: 4, marginTop: 10, borderRadius: 2, backgroundColor: "rgba(255,255,255,.18)" },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,118,23,.28)", borderRadius: 15, backgroundColor: "rgba(255,118,23,.1)" },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { ...typography.label, color: palette.accentOrange, fontSize: 9, letterSpacing: 1.1 },
  title: { ...typography.subheading, marginTop: 3, color: palette.text },
  subtitle: { ...typography.caption, marginTop: 3, color: palette.textMuted },
  closeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "rgba(255,255,255,.06)" },
  form: { gap: 18, paddingHorizontal: 20, paddingBottom: 18 },
  typeGroup: { gap: 9 },
  fieldLabel: { ...typography.label, color: palette.textMuted, fontSize: 10, letterSpacing: .7 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeCard: { flex: 1, minHeight: 70, alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 6, borderWidth: 1, borderColor: "rgba(255,255,255,.1)", borderRadius: 16, backgroundColor: "rgba(255,255,255,.035)" },
  selectedTypeCard: { borderColor: "rgba(255,118,23,.52)", backgroundColor: "rgba(255,118,23,.09)" },
  typeCardText: { ...typography.caption, color: palette.textMuted, fontSize: 11, fontWeight: "800", textAlign: "center" },
  selectedTypeText: { color: palette.text },
  inputRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  inputColumn: { flex: 1, minWidth: 0 },
  trackingNote: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: "rgba(24,196,255,.07)" },
  trackingText: { ...typography.caption, flex: 1, color: "rgba(248,250,252,.68)" },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === "android" ? 24 : 30, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.08)", backgroundColor: "#080C11" },
  actionButton: { flex: 1, paddingHorizontal: 12 },
  pressed: { opacity: .78, transform: [{ scale: .98 }] },
});

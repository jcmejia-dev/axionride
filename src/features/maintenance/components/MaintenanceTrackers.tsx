import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
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
import type { FuelSummary } from "@/src/domain/fuel";
import type { CreateOilChangeInput } from "@/src/domain/maintenance";
import type { Motorcycle } from "@/src/domain/motorcycle";
import {
  createFuelService,
  createOilChangeService,
  type CreateFuelLogInput,
} from "@/src/services";
import {
  DEFAULT_OIL_CHANGE_INTERVAL_KM,
  type OilChangeTracker,
} from "@/src/services/maintenance";
import { palette, radius, spacing, typography } from "@/src/theme";

type MaintenanceTrackersProps = {
  readonly motorcycle: Motorcycle;
  readonly refreshToken: number;
  readonly onDataChanged: () => Promise<void>;
};

export function MaintenanceTrackers({
  motorcycle,
  refreshToken,
  onDataChanged,
}: MaintenanceTrackersProps) {
  const oilService = useMemo(() => createOilChangeService(), []);
  const fuelService = useMemo(() => createFuelService(), []);
  const [oilTracker, setOilTracker] = useState<OilChangeTracker | null>(null);
  const [fuelSummary, setFuelSummary] = useState<FuelSummary | null>(null);
  const [trackedOdometerKm, setTrackedOdometerKm] = useState(motorcycle.odometerKm);
  const [loading, setLoading] = useState(true);
  const [oilFormVisible, setOilFormVisible] = useState(false);
  const [fuelFormVisible, setFuelFormVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oilResult, fuelResult, odometerResult] = await Promise.all([
        oilService.getOilChangeTracker(motorcycle.id),
        fuelService.getFuelSummary(motorcycle.id),
        oilService.getTrackedOdometer(motorcycle.id),
      ]);
      if (oilResult.ok) setOilTracker(oilResult.value);
      if (fuelResult.ok) setFuelSummary(fuelResult.value);
      if (odometerResult.ok) setTrackedOdometerKm(odometerResult.value);
    } catch {
      Alert.alert("Tracker unavailable", "Oil and fuel tracking could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [fuelService, motorcycle.id, oilService]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  async function saveOilChange(input: CreateOilChangeInput) {
    try {
      const result = await oilService.createOilChange(input);
      if (!result.ok) {
        Alert.alert("Oil change not saved", result.error.message);
        return false;
      }
      setOilFormVisible(false);
      await Promise.all([load(), onDataChanged()]);
      return true;
    } catch {
      Alert.alert("Oil change not saved", "The local oil-change record could not be saved.");
      return false;
    }
  }

  async function saveFuel(input: CreateFuelLogInput) {
    try {
      const result = await fuelService.createFuelLog(input);
      if (!result.ok) {
        Alert.alert("Fuel not saved", result.error.message);
        return false;
      }
      setFuelFormVisible(false);
      await load();
      return true;
    } catch {
      Alert.alert("Fuel not saved", "The local fuel record could not be saved.");
      return false;
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>LIVE MOTORCYCLE TRACKERS</Text>
          <Text style={styles.sectionTitle}>Fluids & service life</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>RIDE LINKED</Text>
        </View>
      </View>

      <OilTrackerCard
        loading={loading}
        onAdd={() => setOilFormVisible(true)}
        tracker={oilTracker}
      />
      <FuelTrackerCard
        fuelEfficiencyKmPerLiter={motorcycle.fuelEfficiencyKmPerLiter ?? 40}
        loading={loading}
        onAdd={() => setFuelFormVisible(true)}
        summary={fuelSummary}
        tankCapacityLiters={motorcycle.fuelTankCapacityLiters}
      />

      <OilChangeForm
        motorcycleId={motorcycle.id}
        onClose={() => setOilFormVisible(false)}
        onSave={saveOilChange}
        trackedOdometerKm={trackedOdometerKm}
        visible={oilFormVisible}
      />
      <FuelForm
        motorcycleId={motorcycle.id}
        onClose={() => setFuelFormVisible(false)}
        onSave={saveFuel}
        trackedOdometerKm={trackedOdometerKm}
        visible={fuelFormVisible}
      />
    </View>
  );
}

function OilTrackerCard({
  loading,
  onAdd,
  tracker,
}: {
  readonly loading: boolean;
  readonly onAdd: () => void;
  readonly tracker: OilChangeTracker | null;
}) {
  const tone = tracker?.status === "due"
    ? palette.danger
    : tracker?.status === "due_soon"
      ? palette.warning
      : palette.success;
  const statusLabel = !tracker?.latest
    ? "NOT TRACKING"
    : tracker.status === "due"
      ? "CHANGE NOW"
      : tracker.status === "due_soon"
        ? "DUE SOON"
        : "OIL HEALTHY";

  return (
    <View style={styles.trackerCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardIdentity}>
          <View style={[styles.cardIcon, { backgroundColor: "rgba(255,118,23,.11)" }]}>
            <SymbolView name={{ ios: "drop.fill", android: "oil_barrel", web: "oil_barrel" }} size={24} tintColor={palette.accentOrange} />
          </View>
          <View>
            <Text style={styles.cardKicker}>ENGINE OIL</Text>
            <Text style={styles.cardTitle}>Oil-change life</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { borderColor: `${tone}66` }]}>
          <View style={[styles.statusDot, { backgroundColor: tone }]} />
          <Text style={[styles.statusText, { color: tone }]}>{statusLabel}</Text>
        </View>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Calculating from recorded rides…</Text>
      ) : tracker?.latest ? (
        <>
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricLabel}>REMAINING</Text>
              <Text style={styles.metricValue}>{formatKm(tracker.remainingKm)}</Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.metricLabel}>RIDDEN SINCE CHANGE</Text>
              <Text style={styles.metricSecondary}>{formatKm(tracker.distanceSinceChangeKm)}</Text>
            </View>
          </View>
          <ProgressBar
            accessibilityLabel={`${Math.round(tracker.progress * 100)} percent of oil interval used`}
            color={tone}
            progress={tracker.progress}
          />
          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>Changed at {formatNumber(tracker.latest.odometerKm)} km</Text>
            <Text style={styles.rangeText}>Every {formatNumber(tracker.intervalKm)} km</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyTracker}>
          <Text style={styles.emptyTitle}>Log your latest oil change</Text>
          <Text style={styles.emptyCopy}>AxionRide will count every completed ride toward the next change.</Text>
        </View>
      )}

      <Pressable accessibilityRole="button" onPress={onAdd} style={({ pressed }) => [styles.cardAction, pressed && styles.pressed]}>
        <SymbolView name={{ ios: "plus.circle.fill", android: "add_circle", web: "add_circle" }} size={19} tintColor={palette.accentOrange} />
        <Text style={styles.cardActionText}>{tracker?.latest ? "Log oil change" : "Start oil tracking"}</Text>
        <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={17} tintColor={palette.textMuted} />
      </Pressable>
    </View>
  );
}

function FuelTrackerCard({
  fuelEfficiencyKmPerLiter,
  loading,
  onAdd,
  summary,
  tankCapacityLiters,
}: {
  readonly fuelEfficiencyKmPerLiter: number;
  readonly loading: boolean;
  readonly onAdd: () => void;
  readonly summary: FuelSummary | null;
  readonly tankCapacityLiters?: number;
}) {
  const remaining = summary?.estimatedFuelRemaining ?? null;
  const ratio = remaining !== null && tankCapacityLiters
    ? Math.min(1, remaining / tankCapacityLiters)
    : 0;
  const rangeKm = remaining === null ? null : remaining * fuelEfficiencyKmPerLiter;
  const tone = remaining !== null && tankCapacityLiters && ratio <= 0.2
    ? palette.warning
    : palette.accentBlue;

  return (
    <View style={styles.trackerCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardIdentity}>
          <View style={[styles.cardIcon, { backgroundColor: "rgba(24,196,255,.09)" }]}>
            <SymbolView name={{ ios: "fuelpump.fill", android: "local_gas_station", web: "local_gas_station" }} size={24} tintColor={palette.accentBlue} />
          </View>
          <View>
            <Text style={styles.cardKicker}>FUEL ESTIMATE</Text>
            <Text style={styles.cardTitle}>Tank & ride range</Text>
          </View>
        </View>
        <Text style={[styles.fuelValue, { color: tone }]}>{remaining === null ? "—" : `${remaining.toFixed(1)} L`}</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Calculating fuel usage…</Text>
      ) : summary?.lastRefill ? (
        <>
          {tankCapacityLiters ? (
            <ProgressBar accessibilityLabel={`${Math.round(ratio * 100)} percent estimated fuel remaining`} color={tone} progress={ratio} />
          ) : null}
          <View style={styles.fuelStats}>
            <View style={styles.fuelStat}>
              <Text style={styles.metricLabel}>EST. RANGE</Text>
              <Text style={styles.metricSecondary}>{rangeKm === null ? "—" : formatKm(rangeKm)}</Text>
            </View>
            <View style={styles.fuelStat}>
              <Text style={styles.metricLabel}>EFFICIENCY</Text>
              <Text style={styles.metricSecondary}>{fuelEfficiencyKmPerLiter.toFixed(1)} km/L</Text>
            </View>
            <View style={styles.fuelStat}>
              <Text style={styles.metricLabel}>MONTH SPEND</Text>
              <Text style={styles.metricSecondary}>₱{summary.monthlySpent.toFixed(0)}</Text>
            </View>
          </View>
          <Text style={styles.estimateNote}>Estimate subtracts fuel as completed ride distance is recorded.</Text>
        </>
      ) : (
        <View style={styles.emptyTracker}>
          <Text style={styles.emptyTitle}>Add your first refill</Text>
          <Text style={styles.emptyCopy}>Record a full tank to start estimated fuel and range tracking.</Text>
        </View>
      )}

      <Pressable accessibilityRole="button" onPress={onAdd} style={({ pressed }) => [styles.cardAction, pressed && styles.pressed]}>
        <SymbolView name={{ ios: "plus.circle.fill", android: "add_circle", web: "add_circle" }} size={19} tintColor={palette.accentBlue} />
        <Text style={[styles.cardActionText, { color: palette.accentBlue }]}>Add fuel</Text>
        <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={17} tintColor={palette.textMuted} />
      </Pressable>
    </View>
  );
}

function ProgressBar({ accessibilityLabel, color, progress }: { readonly accessibilityLabel: string; readonly color: string; readonly progress: number }) {
  const percent = Math.min(1, Math.max(0, progress));
  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(percent * 100) }} style={styles.progressTrack}>
      <View style={[styles.progressFill, { backgroundColor: color, width: `${percent * 100}%` }]} />
    </View>
  );
}

function OilChangeForm({
  motorcycleId,
  onClose,
  onSave,
  trackedOdometerKm,
  visible,
}: {
  readonly motorcycleId: string;
  readonly onClose: () => void;
  readonly onSave: (input: CreateOilChangeInput) => Promise<boolean>;
  readonly trackedOdometerKm: number;
  readonly visible: boolean;
}) {
  const [odometer, setOdometer] = useState("");
  const [interval, setInterval] = useState(String(DEFAULT_OIL_CHANGE_INTERVAL_KM));
  const [brand, setBrand] = useState("");
  const [viscosity, setViscosity] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setOdometer(String(Math.round(trackedOdometerKm)));
    setInterval(String(DEFAULT_OIL_CHANGE_INTERVAL_KM));
    setBrand("");
    setViscosity("");
    setPrice("");
  }, [trackedOdometerKm, visible]);

  async function submit() {
    const odometerKm = Number(odometer);
    const intervalKm = Number(interval);
    const parsedPrice = price.trim() ? Number(price) : undefined;
    if (!Number.isFinite(odometerKm) || odometerKm < 0) {
      Alert.alert("Check odometer", "Enter a valid non-negative odometer reading.");
      return;
    }
    if (!Number.isFinite(intervalKm) || intervalKm <= 0) {
      Alert.alert("Check interval", "Oil-change interval must be greater than zero.");
      return;
    }
    if (parsedPrice !== undefined && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      Alert.alert("Check cost", "Cost must be a valid non-negative amount.");
      return;
    }
    setSaving(true);
    await onSave({
      motorcycleId,
      performedAt: new Date().toISOString(),
      odometerKm,
      oilBrand: optionalText(brand),
      oilViscosity: optionalText(viscosity),
      price: parsedPrice,
      nextDueOdometerKm: odometerKm + intervalKm,
    });
    setSaving(false);
  }

  return (
    <TrackerFormSheet onClose={onClose} title="Log oil change" subtitle="Set today’s odometer and the next service interval." visible={visible}>
      <View style={styles.formGrid}>
        <View style={styles.formColumn}><AppTextInput keyboardType="decimal-pad" label="Odometer (km)" onChangeText={setOdometer} value={odometer} /></View>
        <View style={styles.formColumn}><AppTextInput keyboardType="decimal-pad" label="Next in (km)" onChangeText={setInterval} value={interval} /></View>
      </View>
      <View style={styles.formGrid}>
        <View style={styles.formColumn}><AppTextInput label="Oil brand" onChangeText={setBrand} placeholder="Motul" value={brand} /></View>
        <View style={styles.formColumn}><AppTextInput label="Viscosity" onChangeText={setViscosity} placeholder="10W-40" value={viscosity} /></View>
      </View>
      <AppTextInput keyboardType="decimal-pad" label="Cost (PHP)" onChangeText={setPrice} placeholder="Optional" value={price} />
      <FormActions loading={saving} onCancel={onClose} onSave={() => { void submit(); }} saveTitle="Save oil change" />
    </TrackerFormSheet>
  );
}

function FuelForm({
  motorcycleId,
  onClose,
  onSave,
  trackedOdometerKm,
  visible,
}: {
  readonly motorcycleId: string;
  readonly onClose: () => void;
  readonly onSave: (input: CreateFuelLogInput) => Promise<boolean>;
  readonly trackedOdometerKm: number;
  readonly visible: boolean;
}) {
  const [odometer, setOdometer] = useState("");
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [station, setStation] = useState("");
  const [fillType, setFillType] = useState<"full_tank" | "partial_refill">("full_tank");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setOdometer(String(Math.round(trackedOdometerKm)));
    setLiters("");
    setPricePerLiter("");
    setStation("");
    setFillType("full_tank");
  }, [trackedOdometerKm, visible]);

  async function submit() {
    const odometerKm = Number(odometer);
    const litersValue = Number(liters);
    const priceValue = pricePerLiter.trim() ? Number(pricePerLiter) : undefined;
    if (!Number.isFinite(odometerKm) || odometerKm < 0) {
      Alert.alert("Check odometer", "Enter a valid non-negative odometer reading.");
      return;
    }
    if (!Number.isFinite(litersValue) || litersValue <= 0) {
      Alert.alert("Check fuel amount", "Liters must be greater than zero.");
      return;
    }
    if (priceValue !== undefined && (!Number.isFinite(priceValue) || priceValue < 0)) {
      Alert.alert("Check fuel price", "Price per liter must be a valid amount.");
      return;
    }
    setSaving(true);
    await onSave({
      motorcycleId,
      recordedAt: new Date().toISOString(),
      odometerKm,
      liters: litersValue,
      pricePerLiter: priceValue,
      totalCost: priceValue === undefined ? undefined : priceValue * litersValue,
      fillType,
      stationName: optionalText(station),
    });
    setSaving(false);
  }

  return (
    <TrackerFormSheet onClose={onClose} title="Add fuel" subtitle="A full-tank entry starts live range estimation." visible={visible}>
      <View style={styles.segmentedControl}>
        {(["full_tank", "partial_refill"] as const).map((value) => {
          const selected = fillType === value;
          return (
            <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={value} onPress={() => setFillType(value)} style={[styles.segment, selected && styles.segmentSelected]}>
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{value === "full_tank" ? "Full tank" : "Partial refill"}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.formGrid}>
        <View style={styles.formColumn}><AppTextInput keyboardType="decimal-pad" label="Odometer (km)" onChangeText={setOdometer} value={odometer} /></View>
        <View style={styles.formColumn}><AppTextInput keyboardType="decimal-pad" label="Liters" onChangeText={setLiters} placeholder="0.00" value={liters} /></View>
      </View>
      <View style={styles.formGrid}>
        <View style={styles.formColumn}><AppTextInput keyboardType="decimal-pad" label="Price / liter" onChangeText={setPricePerLiter} placeholder="Optional" value={pricePerLiter} /></View>
        <View style={styles.formColumn}><AppTextInput label="Station" onChangeText={setStation} placeholder="Optional" value={station} /></View>
      </View>
      <FormActions loading={saving} onCancel={onClose} onSave={() => { void submit(); }} saveTitle="Save fuel" />
    </TrackerFormSheet>
  );
}

function TrackerFormSheet({ children, onClose, subtitle, title, visible }: { readonly children: ReactNode; readonly onClose: () => void; readonly subtitle: string; readonly title: string; readonly visible: boolean }) {
  return (
    <Modal animationType="fade" navigationBarTranslucent onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
        <Pressable accessibilityLabel="Close form" accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.formSheet}>
          <View style={styles.formHandle} />
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <Text style={styles.formKicker}>LOCAL SERVICE LOG</Text>
              <Text accessibilityRole="header" style={styles.formTitle}>{title}</Text>
              <Text style={styles.formSubtitle}>{subtitle}</Text>
            </View>
            <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={18} tintColor={palette.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormActions({ loading, onCancel, onSave, saveTitle }: { readonly loading: boolean; readonly onCancel: () => void; readonly onSave: () => void; readonly saveTitle: string }) {
  return (
    <View style={styles.formActions}>
      <GhostButton disabled={loading} onPress={onCancel} style={styles.formAction} title="Cancel" />
      <PrimaryButton loading={loading} onPress={onSave} style={styles.formAction} title={saveTitle} />
    </View>
  );
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function formatKm(value: number) {
  return `${formatNumber(value)} km`;
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  sectionEyebrow: { ...typography.label, color: palette.accentOrange, fontSize: 9, letterSpacing: 1 },
  sectionTitle: { ...typography.subtitle, marginTop: 4, color: palette.text, fontWeight: "900" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(34,197,94,.24)", borderRadius: radius.pill, backgroundColor: "rgba(34,197,94,.06)" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.success },
  liveText: { color: palette.success, fontSize: 8, fontWeight: "900", letterSpacing: .7 },
  trackerCard: { gap: 15, padding: 17, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,.1)", borderRadius: 22, backgroundColor: "rgba(12,17,23,.96)" },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardIdentity: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1, minWidth: 0 },
  cardIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  cardKicker: { ...typography.label, color: palette.textMuted, fontSize: 8, letterSpacing: .9 },
  cardTitle: { ...typography.body, marginTop: 2, color: palette.text, fontWeight: "900" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderRadius: radius.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 8, fontWeight: "900", letterSpacing: .5 },
  metricRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  metricRight: { alignItems: "flex-end" },
  metricLabel: { ...typography.label, color: palette.textMuted, fontSize: 8, letterSpacing: .7 },
  metricValue: { marginTop: 3, color: palette.text, fontSize: 25, lineHeight: 30, fontWeight: "900" },
  metricSecondary: { marginTop: 3, color: palette.text, fontSize: 14, fontWeight: "900" },
  progressTrack: { height: 8, overflow: "hidden", borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,.08)" },
  progressFill: { height: "100%", borderRadius: radius.pill },
  rangeRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rangeText: { ...typography.caption, color: palette.textMuted, fontSize: 10 },
  emptyTracker: { gap: 5, paddingVertical: 4 },
  emptyTitle: { ...typography.body, color: palette.text, fontWeight: "800" },
  emptyCopy: { ...typography.caption, color: palette.textMuted, lineHeight: 18 },
  loadingText: { ...typography.caption, paddingVertical: 12, color: palette.textMuted },
  cardAction: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.08)" },
  cardActionText: { flex: 1, color: palette.accentOrange, fontSize: 13, fontWeight: "900" },
  fuelValue: { fontSize: 20, fontWeight: "900" },
  fuelStats: { flexDirection: "row", gap: 8 },
  fuelStat: { flex: 1, minWidth: 0, padding: 10, borderRadius: 13, backgroundColor: "rgba(255,255,255,.035)" },
  estimateNote: { ...typography.caption, color: palette.textMuted, fontSize: 10 },
  pressed: { opacity: .76, transform: [{ scale: .99 }] },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.76)" },
  formSheet: { maxHeight: "91%", overflow: "hidden", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, borderColor: "rgba(255,118,23,.22)", backgroundColor: "#080C11" },
  formHandle: { alignSelf: "center", width: 44, height: 4, marginTop: 10, borderRadius: 2, backgroundColor: "rgba(255,255,255,.18)" },
  formHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  formHeaderCopy: { flex: 1, minWidth: 0 },
  formKicker: { ...typography.label, color: palette.accentOrange, fontSize: 9, letterSpacing: 1 },
  formTitle: { ...typography.subheading, marginTop: 3, color: palette.text },
  formSubtitle: { ...typography.caption, marginTop: 3, color: palette.textMuted },
  closeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "rgba(255,255,255,.06)" },
  formContent: { gap: 16, paddingHorizontal: 20, paddingBottom: Platform.OS === "android" ? 26 : 32 },
  formGrid: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  formColumn: { flex: 1, minWidth: 0 },
  formActions: { flexDirection: "row", gap: 10, paddingTop: 6 },
  formAction: { flex: 1, paddingHorizontal: 10 },
  segmentedControl: { flexDirection: "row", padding: 4, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,.055)" },
  segment: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  segmentSelected: { backgroundColor: palette.accentOrange },
  segmentText: { ...typography.caption, color: palette.textMuted, fontWeight: "800" },
  segmentTextSelected: { color: palette.darkBackground },
});

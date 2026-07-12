import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingSpinner, Toast } from '@/src/components';
import { FuelType, MotorcycleCategory, TransmissionType, type Motorcycle } from '@/src/domain/motorcycle';
import { createMotorcycleService } from '@/src/services';
import { iconSizes, motion, premiumColors, radius, spacing, touchSizes, typography } from '@/src/theme';

import { MotorcycleForm } from './components/MotorcycleForm';
import { useMotorcycleForm } from './hooks/useMotorcycleForm';

export function MotorcycleManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const motorcycleService = useMemo(() => createMotorcycleService(), []);
  const [initialMotorcycle, setInitialMotorcycle] = useState<Motorcycle | null>(null);

  useEffect(() => {
    async function load() {
      if (!params.id) { setInitialMotorcycle(createBlankMotorcycle()); return; }
      const result = await motorcycleService.getMotorcycle(params.id);
      if (result.ok) setInitialMotorcycle(result.value);
      else { Alert.alert('Motorcycle unavailable', result.error.message); router.back(); }
    }
    void load();
  }, [motorcycleService, params.id, router]);

  if (!initialMotorcycle) return <SafeAreaView style={styles.safeArea}><LoadingSpinner label="Loading motorcycle…" /></SafeAreaView>;
  return <MotorcycleManagementForm key={initialMotorcycle.id} initialMotorcycle={initialMotorcycle} editing={Boolean(params.id)} />;
}

function MotorcycleManagementForm({ initialMotorcycle, editing }: { readonly initialMotorcycle: Motorcycle; readonly editing: boolean }) {
  const router = useRouter();
  const motorcycleService = useMemo(() => createMotorcycleService(), []);
  const [saving, setSaving] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;
  const { values, errors, hasUnsavedChanges, notesCharacterCount, toastVisible, setToastVisible, updateField, resetForm, submit } = useMotorcycleForm({ initialMotorcycle });

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      setReduceMotion(reduced);
      Animated.timing(entrance, { toValue: 1, duration: reduced ? 0 : motion.duration.slow, useNativeDriver: true }).start();
    });
    return () => { active = false; };
  }, [entrance]);

  async function handleSave() {
    if (saving) return;
    const motorcycle = submit();
    if (!motorcycle) return;
    setSaving(true);
    const result = await motorcycleService.saveMotorcycle(motorcycle);
    setSaving(false);
    if (!result.ok) { Alert.alert('Motorcycle not saved', result.error.message); return; }
    setToastVisible(true);
    setTimeout(() => router.back(), reduceMotion ? 0 : 360);
  }

  function handleCancel() {
    if (!hasUnsavedChanges) { router.back(); return; }
    Alert.alert('Discard changes?', 'Your unsaved motorcycle details will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  function handleDelete() {
    Alert.alert('Delete motorcycle?', 'This removes the motorcycle from this local workspace.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void motorcycleService.deleteMotorcycle(initialMotorcycle.id).then((result) => result.ok ? router.back() : Alert.alert('Motorcycle not deleted', result.error.message)); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topGlow} />
      <View style={styles.sideGlow} />
      <Toast visible={toastVisible} message={editing ? 'Motorcycle updated' : 'Motorcycle added'} variant="success" onHide={() => setToastVisible(false)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
        <Animated.View style={[styles.animatedScreen, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={spacing.sm} onPress={handleCancel} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
                <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={premiumColors.textPrimary} size={iconSizes.md} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Vehicle profile</Text>
                <Text style={styles.title}>{editing ? 'Edit Motorcycle' : 'Add Motorcycle'}</Text>
                <Text style={styles.subtitle}>{editing ? 'Keep the machine details accurate.' : 'Set up the motorcycle you actually ride.'}</Text>
              </View>
            </View>

            <MotorcycleForm
              values={values}
              errors={errors}
              editing={editing}
              saving={saving}
              hasUnsavedChanges={hasUnsavedChanges}
              notesCharacterCount={notesCharacterCount}
              onChangeField={updateField}
              onSave={() => { void handleSave(); }}
              onCancel={handleCancel}
              onReset={resetForm}
              onDelete={editing ? handleDelete : undefined}
            />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createBlankMotorcycle(): Motorcycle {
  const now = new Date().toISOString();
  return { id: `motorcycle-${Date.now()}`, nickname: '', brand: '', model: '', year: new Date().getFullYear(), engineCc: 150, category: MotorcycleCategory.Naked, fuelType: FuelType.Gasoline, transmission: TransmissionType.Manual, color: 'Matte Black', odometerKm: 0, createdAt: now, updatedAt: now };
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: premiumColors.background },
  topGlow: { position: 'absolute', top: -150, right: -130, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(45, 63, 82, 0.11)' },
  sideGlow: { position: 'absolute', top: 360, left: -190, width: 330, height: 330, borderRadius: 165, backgroundColor: 'rgba(255, 106, 0, 0.04)' },
  keyboardAvoidingView: { flex: 1 }, animatedScreen: { flex: 1 }, screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.xl },
  header: { minHeight: 112, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  backButton: { width: touchSizes.default, height: touchSizes.default, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: premiumColors.border, borderRadius: radius.pill, backgroundColor: premiumColors.surfaceGlassStrong },
  headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { ...typography.label, color: premiumColors.primary, textTransform: 'uppercase', letterSpacing: 1.3 },
  title: { ...typography.heading, marginTop: spacing.xs, color: premiumColors.textPrimary, fontSize: 32 }, subtitle: { ...typography.body, marginTop: spacing.xs, color: premiumColors.textSecondary },
  pressed: { opacity: 0.72, transform: [{ scale: motion.scale.pressed }] },
});

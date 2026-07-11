import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Toast } from '@/src/components';
import { FuelType, MotorcycleCategory, TransmissionType, type Motorcycle } from '@/src/domain/motorcycle';
import { createMotorcycleService } from '@/src/services';
import { layout, palette, spacing, typography } from '@/src/theme';

import { MotorcycleDetailsCard } from './components/MotorcycleDetailsCard';
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

  if (!initialMotorcycle) return null;
  return <MotorcycleManagementForm key={initialMotorcycle.id} initialMotorcycle={initialMotorcycle} editing={Boolean(params.id)} />;
}

function MotorcycleManagementForm({ initialMotorcycle, editing }: { readonly initialMotorcycle: Motorcycle; readonly editing: boolean }) {
  const router = useRouter();
  const motorcycleService = useMemo(() => createMotorcycleService(), []);
  const {
    values,
    errors,
    previewMotorcycle,
    hasUnsavedChanges,
    notesCharacterCount,
    toastVisible,
    setToastVisible,
    updateField,
    resetForm,
    submit,
  } = useMotorcycleForm({ initialMotorcycle });

  async function handleSave() {
    const motorcycle = submit();
    if (!motorcycle) return;
    const result = await motorcycleService.saveMotorcycle(motorcycle);
    if (!result.ok) { Alert.alert('Motorcycle not saved', result.error.message); return; }
    setToastVisible(true);
    setTimeout(() => router.back(), 450);
  }

  function handleDelete() {
    Alert.alert('Delete motorcycle?', 'This removes the motorcycle from this local workspace.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void motorcycleService.deleteMotorcycle(initialMotorcycle.id).then((result) => result.ok ? router.back() : Alert.alert('Motorcycle not deleted', result.error.message)); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <Toast
        visible={toastVisible}
        message="Motorcycle saved"
        variant="success"
        onHide={() => setToastVisible(false)}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Motorcycle Management</Text>
            <Text style={styles.title}>Build the bike profile</Text>
            <Text style={styles.subtitle}>Add, edit, and preview motorcycle details stored on this device.</Text>
          </View>

          <MotorcycleDetailsCard motorcycle={previewMotorcycle} />

          <MotorcycleForm
            values={values}
            errors={errors}
            hasUnsavedChanges={hasUnsavedChanges}
            notesCharacterCount={notesCharacterCount}
            onChangeField={updateField}
            onSave={() => { void handleSave(); }}
            onCancel={() => router.back()}
            onReset={resetForm}
            onDelete={editing ? handleDelete : undefined}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createBlankMotorcycle(): Motorcycle {
  const now = new Date().toISOString();
  return { id: `motorcycle-${Date.now()}`, nickname: '', brand: '', model: '', year: new Date().getFullYear(), engineCc: 150, category: MotorcycleCategory.Naked, fuelType: FuelType.Gasoline, transmission: TransmissionType.Manual, color: 'Matte Black', odometerKm: 0, createdAt: now, updatedAt: now };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -130,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
  },
  kicker: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.58)',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.display,
    color: palette.text,
  },
  subtitle: {
    ...typography.body,
    maxWidth: 350,
    color: 'rgba(248, 250, 252, 0.68)',
  },
});

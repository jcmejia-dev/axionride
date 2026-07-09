import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Toast } from '@/src/components';
import { layout, palette, spacing, typography } from '@/src/theme';

import { MotorcycleDetailsCard } from './components/MotorcycleDetailsCard';
import { MotorcycleForm } from './components/MotorcycleForm';
import { mockMotorcycle } from './data/mockMotorcycle';
import { useMotorcycleForm } from './hooks/useMotorcycleForm';

export function MotorcycleManagementScreen() {
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
    submitDemo,
  } = useMotorcycleForm({ initialMotorcycle: mockMotorcycle });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <Toast
        visible={toastVisible}
        message="Motorcycle saved (demo)"
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
            <Text style={styles.subtitle}>Add, edit, and preview motorcycle details before storage is connected.</Text>
          </View>

          <MotorcycleDetailsCard motorcycle={previewMotorcycle} />

          <MotorcycleForm
            values={values}
            errors={errors}
            hasUnsavedChanges={hasUnsavedChanges}
            notesCharacterCount={notesCharacterCount}
            onChangeField={updateField}
            onSave={submitDemo}
            onCancel={resetForm}
            onReset={resetForm}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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

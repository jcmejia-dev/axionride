import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { iconSizes, motion, premiumColors, radius, spacing, touchSizes, typography } from '@/src/theme';

type Props = Pick<PressableProps, 'onPress' | 'disabled'> & { readonly title: string; readonly subtitle: string; readonly icon: 'maintenance' | 'protect'; readonly accessibilityLabel: string };

export function GarageActionCard({ title, subtitle, icon, accessibilityLabel, onPress, disabled = false }: Props) {
  const isDisabled = Boolean(disabled);
  const iconName = icon === 'maintenance' ? { ios: 'wrench.and.screwdriver.fill' as const, android: 'build' as const, web: 'build' as const } : { ios: 'checkmark.shield.fill' as const, android: 'verified_user' as const, web: 'verified_user' as const };
  return <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ disabled: isDisabled }} disabled={isDisabled} onPress={onPress} style={({ pressed }) => [styles.card, isDisabled ? styles.disabled : null, pressed ? styles.pressed : null]}><View style={styles.iconShell}><SymbolView name={iconName} tintColor={premiumColors.primary} size={iconSizes.lg} /></View><View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={premiumColors.textSecondary} size={iconSizes.md} /></Pressable>;
}

const styles = StyleSheet.create({ card: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderWidth: 1, borderColor: premiumColors.border, borderRadius: radius.xl, backgroundColor: 'rgba(15,19,26,0.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 5 }, iconShell: { width: touchSizes.comfortable, height: touchSizes.comfortable, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: premiumColors.primaryMuted }, copy: { flex: 1, minWidth: 0 }, title: { ...typography.subtitle, color: premiumColors.textPrimary }, subtitle: { ...typography.body, marginTop: 2, color: premiumColors.textSecondary, fontSize: 14 }, disabled: { opacity: 0.72 }, pressed: { opacity: 0.78, transform: [{ scale: motion.scale.subtlePressed }] } });

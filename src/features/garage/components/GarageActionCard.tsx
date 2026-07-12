import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { iconSizes, motion, premiumColors, radius, spacing, touchSizes, typography } from '@/src/theme';

type Props = Pick<PressableProps, 'onPress' | 'disabled'> & { readonly title: string; readonly subtitle: string; readonly icon: 'maintenance' | 'protect'; readonly accessibilityLabel: string };

export function GarageActionCard({ title, subtitle, icon, accessibilityLabel, onPress, disabled = false }: Props) {
  const isDisabled = Boolean(disabled);
  const iconName = icon === 'maintenance' ? { ios: 'wrench.and.screwdriver.fill' as const, android: 'build' as const, web: 'build' as const } : { ios: 'checkmark.shield.fill' as const, android: 'verified_user' as const, web: 'verified_user' as const };
  return <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ disabled: isDisabled }} disabled={isDisabled} onPress={onPress} style={({ pressed }) => [styles.card, isDisabled ? styles.disabled : null, pressed ? styles.pressed : null]}><View style={styles.iconShell}><SymbolView name={iconName} tintColor={premiumColors.primary} size={iconSizes.lg} /></View><View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={premiumColors.textSecondary} size={iconSizes.md} /></Pressable>;
}

const styles = StyleSheet.create({ card: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', borderRadius: radius.md, backgroundColor: '#0F1319', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 5 }, iconShell: { width: touchSizes.comfortable, height: touchSizes.comfortable, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: premiumColors.borderOrange, borderRadius: radius.md, backgroundColor: premiumColors.primaryMuted }, copy: { flex: 1, minWidth: 0 }, title: { ...typography.subtitle, color: premiumColors.textPrimary, letterSpacing: -0.2 }, subtitle: { ...typography.body, marginTop: 2, color: premiumColors.textSecondary, fontSize: 14 }, disabled: { opacity: 0.62 }, pressed: { opacity: 0.78, transform: [{ scale: motion.scale.subtlePressed }] } });

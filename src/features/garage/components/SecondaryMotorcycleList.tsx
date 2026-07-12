import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Motorcycle } from '@/src/domain/motorcycle';
import { iconSizes, motion, premiumColors, radius, spacing, touchSizes, typography } from '@/src/theme';

const fallbackMotorcycle = require('../../../../assets/images/dashboard-motorcycle-fallback.png');

type Props = { readonly motorcycles: readonly Motorcycle[]; readonly onEdit: (id: string) => void; readonly onMenu: (motorcycle: Motorcycle) => void };

export function SecondaryMotorcycleList({ motorcycles, onEdit, onMenu }: Props) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>All Motorcycles</Text>{motorcycles.length === 0 ? <Text style={styles.emptyCopy}>Your primary motorcycle is the only bike in this workspace.</Text> : <View style={styles.list}>{motorcycles.map((motorcycle) => <MotorcycleRow key={motorcycle.id} motorcycle={motorcycle} onEdit={() => onEdit(motorcycle.id)} onMenu={() => onMenu(motorcycle)} />)}</View>}</View>;
}

function MotorcycleRow({ motorcycle, onEdit, onMenu }: { readonly motorcycle: Motorcycle; readonly onEdit: () => void; readonly onMenu: () => void }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [motorcycle.imageUri]);
  const source = motorcycle.imageUri && !failed ? { uri: motorcycle.imageUri } : fallbackMotorcycle;
  const usingFallback = !motorcycle.imageUri || failed;
  return <Pressable accessibilityLabel={`Edit ${motorcycle.nickname}`} accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}><View style={styles.thumbnail}><Image source={source} resizeMode="contain" onError={() => setFailed(true)} style={styles.image} />{usingFallback ? <View pointerEvents="none" style={styles.fallbackVeil} /> : null}</View><View style={styles.copy}><Text numberOfLines={1} style={styles.name}>{motorcycle.nickname}</Text><View style={styles.secondaryBadge}><Text style={styles.secondaryText}>Secondary</Text></View><Text style={styles.odometer}>{formatNumber(motorcycle.odometerKm)} km</Text></View><Pressable accessibilityLabel={`Open actions for ${motorcycle.nickname}`} accessibilityRole="button" hitSlop={spacing.sm} onPress={(event) => { event.stopPropagation(); onMenu(); }} style={styles.menu}><SymbolView name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }} tintColor={premiumColors.textSecondary} size={iconSizes.md} /></Pressable></Pressable>;
}

function formatNumber(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value); }
const styles = StyleSheet.create({
  section: { gap: spacing.lg }, sectionTitle: { ...typography.subheading, color: premiumColors.textSecondary, fontSize: 20 }, emptyCopy: { ...typography.body, color: premiumColors.textTertiary }, list: { gap: spacing.md },
  row: { minHeight: 122, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', padding: spacing.md, borderWidth: 1, borderColor: premiumColors.border, borderRadius: radius.xl, backgroundColor: 'rgba(15, 19, 26, 0.9)' },
  thumbnail: { width: 112, height: 94, overflow: 'hidden', borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.025)' }, image: { width: '100%', height: '100%' }, fallbackVeil: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(7,10,15,0.62)' },
  copy: { flex: 1, minWidth: 0, paddingHorizontal: spacing.lg }, name: { ...typography.subtitle, color: premiumColors.textPrimary, fontSize: 18 },
  secondaryBadge: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: 'rgba(154,163,178,0.12)' }, secondaryText: { ...typography.label, color: premiumColors.textSecondary, fontSize: 10, textTransform: 'uppercase' },
  odometer: { ...typography.body, marginTop: spacing.xs, color: premiumColors.textSecondary }, menu: { width: touchSizes.compact, height: touchSizes.comfortable, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.78, transform: [{ scale: motion.scale.subtlePressed }] },
});

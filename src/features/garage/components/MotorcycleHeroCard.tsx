import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Motorcycle } from '@/src/domain/motorcycle';
import { iconSizes, motion, premiumColors, radius, spacing, touchSizes, typography } from '@/src/theme';

import type { GarageMaintenanceSummary } from '../types';

const fallbackMotorcycle = require('../../../../assets/images/dashboard-motorcycle-fallback.png');

type Props = {
  readonly motorcycle: Motorcycle;
  readonly maintenance: GarageMaintenanceSummary;
  readonly compact: boolean;
  readonly onEdit: () => void;
  readonly onMenu: () => void;
};

export function MotorcycleHeroCard({ motorcycle, maintenance, compact, onEdit, onMenu }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [motorcycle.imageUri]);
  const imageSource = motorcycle.imageUri && !imageFailed ? { uri: motorcycle.imageUri } : fallbackMotorcycle;
  const usingFallback = !motorcycle.imageUri || imageFailed;

  return (
    <View style={styles.card}>
      <View style={styles.ambientGlow} />
      <View style={styles.cardHeader}>
        <View style={styles.primaryBadge}>
          <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={premiumColors.primary} size={iconSizes.sm} />
          <Text style={styles.primaryText}>Primary</Text>
        </View>
        <Pressable accessibilityLabel={`Open actions for ${motorcycle.nickname}`} accessibilityRole="button" hitSlop={spacing.sm} onPress={onMenu} style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}>
          <SymbolView name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} tintColor={premiumColors.textSecondary} size={iconSizes.md} />
        </Pressable>
      </View>

      <Pressable accessibilityLabel={`Edit ${motorcycle.nickname}`} accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.identity, pressed ? styles.identityPressed : null]}>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={styles.name}>{motorcycle.nickname}</Text>
        <Text numberOfLines={1} style={styles.specification}>{motorcycle.engineCc}cc • {motorcycle.category} • {motorcycle.fuelType}</Text>
      </Pressable>

      <View style={[styles.imageStage, compact ? styles.imageStageCompact : null]}>
        <Image accessibilityLabel={`${motorcycle.brand} ${motorcycle.model} motorcycle`} source={imageSource} resizeMode="contain" onError={() => setImageFailed(true)} style={styles.image} />
        {usingFallback ? <View style={styles.fallbackVeil} pointerEvents="none" /> : null}
        <View style={styles.imageShade} pointerEvents="none" />
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColors[maintenance.statusTone] }]} />
        <Text style={[styles.statusText, { color: statusColors[maintenance.statusTone] }]}>{maintenance.statusLabel}</Text>
      </View>

      <View style={styles.divider} />
      <View style={[styles.metrics, compact ? styles.metricsCompact : null]}>
        <Metric icon={{ ios: 'gauge.with.dots.needle.67percent', android: 'speed', web: 'speed' }} label="Odometer" value={`${formatNumber(motorcycle.odometerKm)} km`} />
        <Metric icon={{ ios: 'calendar', android: 'event', web: 'event' }} label="Next maintenance" value={maintenance.nextMaintenanceLabel} emphasized />
        <Metric icon={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} label="Last oil change" value={maintenance.lastOilChangeLabel} last />
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${maintenance.progressPercent ?? 0}%` }]} /></View>
        <Text style={styles.progressValue}>{maintenance.progressPercent === null ? '—' : `${maintenance.progressPercent}%`}</Text>
      </View>
    </View>
  );
}

type MetricProps = {
  readonly icon: ComponentProps<typeof SymbolView>['name'];
  readonly label: string;
  readonly value: string;
  readonly emphasized?: boolean;
  readonly last?: boolean;
};

function Metric({ icon, label, value, emphasized = false, last = false }: MetricProps) {
  return <View style={[styles.metric, last ? styles.metricLast : null]}><View style={styles.metricTitle}><SymbolView name={icon} tintColor={premiumColors.primary} size={iconSizes.md} /><Text numberOfLines={2} style={styles.metricLabel}>{label}</Text></View><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72} style={[styles.metricValue, emphasized ? styles.metricValueEmphasized : null]}>{value}</Text></View>;
}

const statusColors = { success: premiumColors.success, warning: premiumColors.warning, danger: premiumColors.danger, neutral: premiumColors.textSecondary };
function formatNumber(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value); }

const styles = StyleSheet.create({
  card: { overflow: 'hidden', paddingTop: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, backgroundColor: '#0D1117', shadowColor: '#000000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.44, shadowRadius: 26, elevation: 9 },
  ambientGlow: { position: 'absolute', top: 70, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255, 106, 0, 0.055)' },
  cardHeader: { minHeight: touchSizes.compact, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  primaryBadge: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: premiumColors.borderOrange, borderRadius: radius.sm, backgroundColor: 'rgba(255, 106, 0, 0.08)' },
  primaryText: { ...typography.label, color: premiumColors.primaryBright, fontSize: 13, textTransform: 'uppercase' },
  menuButton: { width: touchSizes.compact, height: touchSizes.compact, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  identity: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  identityPressed: { opacity: 0.76 },
  name: { ...typography.title, color: premiumColors.textPrimary, fontSize: 29, lineHeight: 34, letterSpacing: -0.7 },
  specification: { ...typography.body, marginTop: spacing.xs, color: premiumColors.textSecondary, fontSize: 15 },
  imageStage: { height: 224, marginTop: -spacing.sm, marginHorizontal: spacing.md },
  imageStageCompact: { height: 190 },
  image: { width: '100%', height: '100%' },
  fallbackVeil: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(7, 10, 15, 0.62)' },
  imageShade: { position: 'absolute', right: 0, bottom: 0, left: 0, height: 42, backgroundColor: 'rgba(13, 17, 23, 0.34)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 42, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  statusDot: { width: 10, height: 10, borderRadius: radius.pill },
  statusText: { ...typography.body, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: premiumColors.border },
  metrics: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  metricsCompact: { paddingHorizontal: spacing.md },
  metric: { flex: 1, minWidth: 0, minHeight: 92, paddingHorizontal: spacing.md, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: premiumColors.border },
  metricLast: { borderRightWidth: 0 },
  metricTitle: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metricLabel: { ...typography.label, flex: 1, color: premiumColors.textSecondary, fontSize: 10, lineHeight: 13, textTransform: 'uppercase' },
  metricValue: { ...typography.subtitle, marginTop: spacing.sm, color: premiumColors.textPrimary, fontSize: 17, lineHeight: 22 },
  metricValueEmphasized: { color: premiumColors.primaryBright },
  progressRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  progressTrack: { flex: 1, height: 7, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: premiumColors.primary },
  progressValue: { ...typography.subtitle, minWidth: 42, color: premiumColors.primaryBright, textAlign: 'right' },
  pressed: { opacity: 0.7, transform: [{ scale: motion.scale.pressed }] },
});

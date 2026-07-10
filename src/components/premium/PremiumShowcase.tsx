import { Text, View } from 'react-native';

import { AxionRideLogo } from '@/src/components';
import { premiumColors, spacing, typography } from '@/src/theme';

import { MetricChip, PremiumButton, StatusBadge } from './controls';
import { EmptyStateCard, MotorcycleHeroCard, PremiumBanner, StatCard } from './contentCards';
import { ActionRow, PremiumHeader, PremiumScreen, SectionHeader } from './layout';
import { Divider, ElevatedCard, GlassCard, LoadingOverlay, SkeletonBlock } from './surfaces';

/**
 * Internal design-system preview. It is intentionally not registered in Expo Router.
 */
export function PremiumShowcase() {
  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow="Design System v2"
        title="AxionRide Premium UI"
        subtitle="Foundation components for future screen migration."
        trailing={<StatusBadge label="Internal" tone="orange" />}
      />

      <AxionRideLogo compact variant="full" />

      <SectionHeader title="Surfaces" subtitle="Glass, elevation, dividers, and loading states" />
      <GlassCard style={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={{ ...typography.subtitle, color: premiumColors.textPrimary }}>Glass Card</Text>
        <Text style={{ ...typography.caption, color: premiumColors.textSecondary }}>Subtle border, depth, and black-metal surface.</Text>
        <Divider />
        <SkeletonBlock width="72%" height={16} />
      </GlassCard>

      <ElevatedCard style={{ padding: spacing.lg }}>
        <Text style={{ ...typography.subtitle, color: premiumColors.textPrimary }}>Elevated Card</Text>
      </ElevatedCard>

      <SectionHeader title="Controls" />
      <View style={{ gap: spacing.md }}>
        <PremiumButton title="Primary Action" />
        <PremiumButton title="Secondary Action" variant="secondary" />
        <PremiumButton title="Ghost Action" variant="ghost" />
      </View>

      <SectionHeader title="Metrics" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <StatCard label="Total KM" value="6,842" detail="All time" />
        <StatCard label="Ride Time" value="112h" detail="All time" accent="purple" />
      </View>

      <MetricChip label="Fuel Level" value="78%" tone="success" />
      <StatusBadge label="Ready to ride" tone="success" dot />

      <MotorcycleHeroCard
        title="Skygo Boss 150"
        subtitle="150cc · 4-Stroke · Carburetor"
        badge={<StatusBadge label="Primary" tone="orange" />}
        status={<StatusBadge label="Ready to ride" tone="success" dot />}
      />

      <PremiumBanner title="Support AxionRide" subtitle="Premium banner surface for future campaigns." actionLabel="Action" />
      <ActionRow title="Settings Row" subtitle="Large touch target with leading/trailing slots" />
      <EmptyStateCard title="No data yet" description="Use this for first-run and empty collection states." />
      <LoadingOverlay visible={false} />
    </PremiumScreen>
  );
}

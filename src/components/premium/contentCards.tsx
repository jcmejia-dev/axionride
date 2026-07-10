import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType, type ViewProps } from 'react-native';

import { premiumColors, radius, spacing, typography } from '@/src/theme';

import { PremiumButton } from './controls';
import { GlassCard, ElevatedCard } from './surfaces';

type StatCardProps = ViewProps & {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  readonly icon?: ReactNode;
  readonly accent?: 'orange' | 'success' | 'warning' | 'danger' | 'blue' | 'purple';
};

export function StatCard({ label, value, detail, icon, accent = 'orange', style, ...props }: StatCardProps) {
  const accentColor = accentColors[accent];

  return (
    <GlassCard style={[styles.statCard, style]} {...props}>
      {icon ? <View style={[styles.statIcon, { borderColor: accentColor }]}>{icon}</View> : null}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {detail ? <Text style={styles.statDetail}>{detail}</Text> : null}
    </GlassCard>
  );
}

type MotorcycleHeroCardProps = ViewProps & {
  readonly title: string;
  readonly subtitle?: string;
  readonly imageSource?: ImageSourcePropType;
  readonly badge?: ReactNode;
  readonly status?: ReactNode;
  readonly metrics?: readonly ReactNode[];
  readonly action?: ReactNode;
};

export function MotorcycleHeroCard({
  title,
  subtitle,
  imageSource,
  badge,
  status,
  metrics = [],
  action,
  style,
  ...props
}: MotorcycleHeroCardProps) {
  return (
    <ElevatedCard style={[styles.motorcycleCard, style]} {...props}>
      <View style={styles.motorcycleTop}>
        <View style={styles.motorcycleCopy}>
          {badge}
          <Text style={styles.motorcycleTitle}>{title}</Text>
          {subtitle ? <Text style={styles.motorcycleSubtitle}>{subtitle}</Text> : null}
          {status ? <View style={styles.motorcycleStatus}>{status}</View> : null}
        </View>
        {action}
      </View>
      {imageSource ? <Image source={imageSource} resizeMode="contain" style={styles.motorcycleImage} /> : null}
      {metrics.length > 0 ? <View style={styles.metricGrid}>{metrics.map((metric, index) => <View key={index} style={styles.metricSlot}>{metric}</View>)}</View> : null}
    </ElevatedCard>
  );
}

type EmptyStateCardProps = ViewProps & {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly action?: ReactNode;
};

export function EmptyStateCard({ title, description, icon, action, style, ...props }: EmptyStateCardProps) {
  return (
    <GlassCard style={[styles.emptyCard, style]} {...props}>
      {icon ? <View style={styles.emptyIcon}>{icon}</View> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDescription}>{description}</Text> : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </GlassCard>
  );
}

type PremiumBannerProps = ViewProps & {
  readonly title: string;
  readonly subtitle?: string;
  readonly media?: ReactNode;
  readonly actionLabel?: string;
  readonly onActionPress?: () => void;
};

export function PremiumBanner({ title, subtitle, media, actionLabel, onActionPress, style, ...props }: PremiumBannerProps) {
  return (
    <ElevatedCard style={[styles.banner, style]} {...props}>
      {media ? <View style={styles.bannerMedia}>{media}</View> : null}
      <View style={styles.bannerCopy}>
        <Text style={styles.bannerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.bannerSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? <PremiumButton title={actionLabel} onPress={onActionPress} style={styles.bannerButton} /> : null}
    </ElevatedCard>
  );
}

type AdPlaceholderCardProps = ViewProps & {
  readonly title?: string;
  readonly subtitle?: string;
  readonly actionLabel?: string;
  readonly onActionPress?: () => void;
};

export function AdPlaceholderCard({
  title = 'Sponsored',
  subtitle = 'Reserved surface for future promotional content.',
  actionLabel,
  onActionPress,
  style,
  ...props
}: AdPlaceholderCardProps) {
  return (
    <PremiumBanner
      title={title}
      subtitle={subtitle}
      actionLabel={actionLabel}
      onActionPress={onActionPress}
      style={[styles.adCard, style]}
      {...props}
    />
  );
}

const accentColors = {
  orange: premiumColors.primary,
  success: premiumColors.success,
  warning: premiumColors.warning,
  danger: premiumColors.danger,
  blue: premiumColors.blue,
  purple: premiumColors.purple,
};

const styles = StyleSheet.create({
  statCard: {
    minWidth: 128,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statLabel: {
    ...typography.label,
    color: premiumColors.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    ...typography.title,
    color: premiumColors.textPrimary,
  },
  statDetail: {
    ...typography.caption,
    color: premiumColors.textSecondary,
  },
  motorcycleCard: {
    padding: spacing.xl,
    minHeight: 260,
  },
  motorcycleTop: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  motorcycleCopy: {
    flex: 1,
    minWidth: 0,
  },
  motorcycleTitle: {
    ...typography.title,
    marginTop: spacing.md,
    color: premiumColors.textPrimary,
  },
  motorcycleSubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
    fontWeight: '600',
  },
  motorcycleStatus: {
    marginTop: spacing.xl,
  },
  motorcycleImage: {
    alignSelf: 'flex-end',
    width: '76%',
    height: 150,
    marginTop: -spacing.lg,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  metricSlot: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 0,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: premiumColors.textPrimary,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    marginTop: spacing.sm,
    color: premiumColors.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.xl,
  },
  banner: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderColor: premiumColors.borderOrange,
  },
  bannerMedia: {
    flexShrink: 0,
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    ...typography.subtitle,
    color: premiumColors.textPrimary,
  },
  bannerSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
  },
  bannerButton: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  adCard: {
    backgroundColor: 'rgba(255, 106, 0, 0.08)',
  },
});

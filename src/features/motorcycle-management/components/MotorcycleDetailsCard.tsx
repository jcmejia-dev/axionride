import { StyleSheet, Text, View } from 'react-native';

import type { Motorcycle } from '@/src/domain/motorcycle';
import { Badge, GlassCard } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

import { MotorcycleImagePlaceholder } from './MotorcycleImagePlaceholder';

type MotorcycleDetailsCardProps = {
  motorcycle: Motorcycle;
};

export function MotorcycleDetailsCard({ motorcycle }: MotorcycleDetailsCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Live preview</Text>
          <Text style={styles.nickname}>{motorcycle.nickname || 'Untitled Motorcycle'}</Text>
          <Text style={styles.model}>
            {motorcycle.brand || 'Brand'} {motorcycle.model || 'Model'} · {motorcycle.year}
          </Text>
        </View>
        <Badge variant="success">Ride Ready</Badge>
      </View>

      <MotorcycleImagePlaceholder />

      <View style={styles.metrics}>
        <PreviewMetric label="Category" value={motorcycle.category} />
        <PreviewMetric label="Engine" value={`${motorcycle.engineCc}cc`} />
        <PreviewMetric label="Fuel" value={motorcycle.fuelType} />
        <PreviewMetric label="Transmission" value={motorcycle.transmission} />
        <PreviewMetric label="Mileage" value={`${motorcycle.odometerKm.toLocaleString()} km`} wide />
      </View>
    </GlassCard>
  );
}

type PreviewMetricProps = {
  label: string;
  value: string;
  wide?: boolean;
};

function PreviewMetric({ label, value, wide = false }: PreviewMetricProps) {
  return (
    <View style={[styles.metric, wide ? styles.wideMetric : null]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl,
    overflow: 'hidden',
    backgroundColor: '#08090B',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.46,
    shadowRadius: 34,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.54)',
    textTransform: 'uppercase',
  },
  nickname: {
    ...typography.heading,
    marginTop: spacing.xs,
    color: palette.text,
  },
  model: {
    ...typography.body,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.68)',
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 0,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
  },
  wideMetric: {
    flexBasis: '100%',
  },
  metricLabel: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.54)',
    textTransform: 'uppercase',
  },
  metricValue: {
    ...typography.subtitle,
    marginTop: spacing.xs,
    color: palette.text,
  },
});

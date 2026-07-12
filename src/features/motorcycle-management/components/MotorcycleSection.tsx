import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components';
import { motion, premiumColors, spacing, typography } from '@/src/theme';

type MotorcycleSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  delay?: number;
};

export function MotorcycleSection({ title, description, children, delay = 0 }: MotorcycleSectionProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      Animated.timing(progress, { toValue: 1, delay: reduced ? 0 : delay, duration: reduced ? 0 : motion.duration.slow, useNativeDriver: true }).start();
    });
    return () => { active = false; };
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}>
      <GlassCard style={styles.card}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        <View style={styles.content}>{children}</View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl,
    backgroundColor: 'rgba(15, 19, 26, 0.9)',
    borderColor: premiumColors.border,
  },
  title: {
    ...typography.subtitle,
    color: premiumColors.textPrimary,
  },
  description: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
  },
  content: {
    gap: spacing.lg,
  },
});

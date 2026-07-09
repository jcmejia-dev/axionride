import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components';
import { palette, spacing, typography } from '@/src/theme';

type MotorcycleSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  delay?: number;
};

export function MotorcycleSection({ title, description, children, delay = 0 }: MotorcycleSectionProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay,
      friction: 8,
      tension: 48,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
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
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
  },
  title: {
    ...typography.subtitle,
    color: palette.text,
  },
  description: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.56)',
  },
  content: {
    gap: spacing.lg,
  },
});

import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { elevation, motion, premiumColors, radius, spacing } from '@/src/theme';

type SurfaceProps = ViewProps & {
  readonly children: ReactNode;
};

export function GlassCard({ children, style, ...props }: SurfaceProps) {
  return (
    <View style={[styles.glassCard, elevation.soft, style]} {...props}>
      {children}
    </View>
  );
}

export function ElevatedCard({ children, style, ...props }: SurfaceProps) {
  return (
    <View style={[styles.elevatedCard, elevation.metallic, style]} {...props}>
      {children}
    </View>
  );
}

export function Divider({ style, ...props }: ViewProps) {
  return <View accessibilityRole="none" style={[styles.divider, style]} {...props} />;
}

type SkeletonBlockProps = ViewProps & {
  readonly width?: ViewStyle['width'];
  readonly height?: number;
};

export function SkeletonBlock({ width = '100%', height = 20, style, ...props }: SkeletonBlockProps) {
  const progress = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 820,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0.35,
          duration: 820,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          opacity: progress,
          width,
        },
        style,
      ]}
      {...props}
    />
  );
}

type LoadingOverlayProps = ViewProps & {
  readonly visible: boolean;
  readonly children?: ReactNode;
};

export function LoadingOverlay({ visible, children, style, ...props }: LoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View accessibilityRole="progressbar" style={[styles.loadingOverlay, style]} {...props}>
      <ActivityIndicator color={premiumColors.primary} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.xl,
    backgroundColor: premiumColors.surfaceGlass,
  },
  elevatedCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: premiumColors.borderStrong,
    borderRadius: radius.xl,
    backgroundColor: premiumColors.surfaceElevated,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: premiumColors.border,
  },
  skeleton: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(7, 10, 15, 0.72)',
    transitionDuration: `${motion.duration.base}ms`,
  },
});

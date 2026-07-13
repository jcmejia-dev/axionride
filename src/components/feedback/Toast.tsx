import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { elevation, layout, palette, radius, semanticColors, spacing, typography } from '@/src/theme';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';
export type ToastPresentation = 'standard' | 'achievement';

type ToastProps = ViewProps & {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  onHide?: () => void;
  durationMs?: number;
  icon?: ReactNode;
  presentation?: ToastPresentation;
};

/** Bottom-floating toast with UI-thread transitions and tap-to-dismiss. */
export function Toast({
  visible,
  message,
  variant = 'info',
  onHide,
  durationMs = 2400,
  icon,
  presentation = 'standard',
  style,
  ...props
}: ToastProps) {
  const progress = useSharedValue(0);
  const glitchOffset = useSharedValue(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHideRef = useRef(onHide);
  const accentColor = toastAccent[variant];

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  const notifyHidden = useCallback(() => {
    onHideRef.current?.();
  }, []);

  const dismiss = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    progress.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) runOnJS(notifyHidden)();
    });
  }, [notifyHidden, progress]);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    if (!visible) {
      progress.value = withTiming(0, { duration: 160 });
      return;
    }

    progress.value = withSpring(1, { damping: 17, stiffness: 190, mass: 0.72 });
    if (presentation === 'achievement') {
      glitchOffset.value = withSequence(
        withTiming(-5, { duration: 45 }),
        withTiming(4, { duration: 45 }),
        withTiming(-2, { duration: 45 }),
        withTiming(0, { duration: 70 }),
      );
    }
    hideTimer.current = setTimeout(dismiss, Math.max(2000, Math.min(durationMs, 3000)));

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [dismiss, durationMs, glitchOffset, message, presentation, progress, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 28 },
      { translateX: glitchOffset.value },
      { scale: 0.96 + progress.value * 0.04 },
    ],
  }));
  const tapGesture = useMemo(() => Gesture.Tap().onEnd(() => {
    runOnJS(dismiss)();
  }), [dismiss]);

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View
        accessibilityHint="Tap to dismiss"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.wrapper, animatedStyle, style]}
        {...props}>
        <View style={[styles.toast, presentation === 'achievement' && styles.achievementToast, elevation.raised]}>
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          {presentation === 'achievement' ? (
            <View pointerEvents="none" style={styles.glitchDecor}>
              <View style={[styles.glitchLine, styles.glitchLineTop]} />
              <View style={[styles.glitchLine, styles.glitchLineBottom]} />
              <View style={styles.scanLine} />
            </View>
          ) : null}
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <View style={styles.copy}>
            {presentation === 'achievement' ? <Text style={styles.achievementLabel}>ACHIEVEMENT // UNLOCKED</Text> : null}
            <Text style={[styles.message, presentation === 'achievement' && styles.achievementMessage]}>{message}</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const toastAccent = {
  success: palette.success,
  warning: palette.warning,
  error: palette.danger,
  info: palette.accentBlue,
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: spacing.xl,
    bottom: layout.floatingTabBarContentInset - spacing.md,
    left: spacing.xl,
    zIndex: 40,
  },
  toast: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: semanticColors.dark.border,
    borderRadius: radius.lg,
    backgroundColor: semanticColors.dark.surfaceStrong,
  },
  achievementToast: {
    minHeight: 74,
    borderRadius: 6,
    borderColor: 'rgba(255, 122, 26, 0.58)',
    backgroundColor: 'rgba(4, 9, 14, 0.98)',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.34)',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 106, 0, 0.1)',
  },
  copy: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  message: {
    ...typography.body,
    color: semanticColors.dark.text,
  },
  achievementLabel: {
    ...typography.label,
    marginBottom: 3,
    color: '#FF7A1A',
    fontFamily: 'sans-serif-condensed',
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.2,
  },
  achievementMessage: {
    fontFamily: 'sans-serif-condensed',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    letterSpacing: 0.35,
  },
  glitchDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  glitchLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255, 122, 26, 0.7)',
  },
  glitchLineTop: {
    top: 7,
    right: 18,
    width: 34,
  },
  glitchLineBottom: {
    bottom: 8,
    left: 14,
    width: 22,
  },
  scanLine: {
    position: 'absolute',
    top: '49%',
    right: 0,
    left: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(121, 206, 255, 0.12)',
  },
});

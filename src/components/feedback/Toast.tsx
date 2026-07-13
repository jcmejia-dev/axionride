import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { elevation, layout, palette, radius, semanticColors, spacing, typography } from '@/src/theme';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

type ToastProps = ViewProps & {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  onHide?: () => void;
  durationMs?: number;
};

/** Bottom-floating toast with UI-thread transitions and tap-to-dismiss. */
export function Toast({
  visible,
  message,
  variant = 'info',
  onHide,
  durationMs = 2400,
  style,
  ...props
}: ToastProps) {
  const progress = useSharedValue(0);
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
    hideTimer.current = setTimeout(dismiss, Math.max(2000, Math.min(durationMs, 3000)));

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [dismiss, durationMs, message, progress, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 28 },
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
        <View style={[styles.toast, elevation.raised]}>
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          <Text style={styles.message}>{message}</Text>
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
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  message: {
    ...typography.body,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: semanticColors.dark.text,
  },
});

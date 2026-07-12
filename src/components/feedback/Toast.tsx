import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { elevation, palette, radius, semanticColors, spacing, typography } from '@/src/theme';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

type ToastProps = ViewProps & {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  onHide?: () => void;
  durationMs?: number;
};

/** Animated glass-style toast for short, non-blocking status feedback. */
export function Toast({
  visible,
  message,
  variant = 'info',
  onHide,
  durationMs = 2200,
  style,
  ...props
}: ToastProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accentColor = toastAccent[variant];

  useEffect(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    if (!visible) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.spring(progress, {
      toValue: 1,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    hideTimer.current = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => onHide?.());
    }, durationMs);

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [durationMs, message, onHide, progress, variant, visible]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-18, 0],
              }),
            },
          ],
        },
        style,
      ]}
      {...props}>
      <View style={[styles.toast, elevation.raised]}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
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
    top: Platform.OS === 'ios' ? 62 : 48,
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
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
    color: semanticColors.dark.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});

import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { playSound } from '@/src/services/sound';
import { elevation, palette, semanticColors, spacing, typography } from '@/src/theme';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';
export type ToastPresentation = 'standard' | 'hud' | 'achievement';
export type ToastContentKind = 'xp' | 'achievement' | 'success' | 'info' | 'error';

type ToastProps = ViewProps & {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  onHide?: () => void;
  durationMs?: number;
  icon?: ReactNode;
  presentation?: ToastPresentation;
  contentKind?: ToastContentKind;
  stackIndex?: number;
};

/** Top-floating HUD toast with UI-thread transitions and tap-to-dismiss. */
export function Toast({
  visible,
  message,
  variant = 'info',
  onHide,
  durationMs = 2000,
  icon,
  presentation = 'standard',
  contentKind,
  stackIndex = 0,
  style,
  ...props
}: ToastProps) {
  const progress = useSharedValue(0);
  const glitchOffset = useSharedValue(0);
  const glitchOpacity = useSharedValue(1);
  const lifetimeProgress = useSharedValue(1);
  const depthScale = useSharedValue(getStackScale(stackIndex));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHideRef = useRef(onHide);
  const accentColor = toastAccent[variant];
  const resolvedContentKind = contentKind ?? (presentation === 'achievement' ? 'achievement' : variant === 'success' ? 'success' : variant === 'error' ? 'error' : 'info');
  const resolvedIcon = icon ?? <ToastIcon kind={resolvedContentKind} color={accentColor} />;
  const autoDismissMs = Math.max(1800, Math.min(durationMs, 2500));

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    depthScale.value = withTiming(getStackScale(stackIndex), {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [depthScale, stackIndex]);

  const notifyHidden = useCallback(() => {
    onHideRef.current?.();
  }, []);

  const dismiss = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    progress.value = withTiming(0, { duration: 210 }, (finished) => {
      if (finished) runOnJS(notifyHidden)();
    });
  }, [notifyHidden, progress]);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    if (!visible) {
      progress.value = withTiming(0, { duration: 200 });
      return;
    }

    progress.value = withTiming(1, { duration: 220 });
    lifetimeProgress.value = 1;
    lifetimeProgress.value = withTiming(0, {
      duration: autoDismissMs,
      easing: Easing.linear,
    });
    playSound('toast');
    glitchOffset.value = withSequence(
      withTiming(-3, { duration: 24 }),
      withTiming(2, { duration: 22 }),
      withTiming(-1, { duration: 22 }),
      withTiming(0, { duration: 32 }),
    );
    glitchOpacity.value = withSequence(
      withTiming(.9, { duration: 24 }),
      withTiming(1, { duration: 26 }),
      withTiming(.94, { duration: 20 }),
      withTiming(1, { duration: 30 }),
    );
    hideTimer.current = setTimeout(dismiss, autoDismissMs);

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [autoDismissMs, dismiss, glitchOffset, glitchOpacity, lifetimeProgress, message, presentation, progress, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value * glitchOpacity.value,
    transform: [
      { translateX: (1 - progress.value) * 100 + glitchOffset.value },
      { scale: depthScale.value },
    ],
  }));
  const lifetimeStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, lifetimeProgress.value) * 100}%`,
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
        style={[styles.wrapper, { top: 58 + stackIndex * 84, zIndex: 100 - stackIndex }, animatedStyle, style]}
        {...props}>
        <View style={[styles.toast, presentation !== 'standard' && styles.achievementToast, elevation.raised, { shadowColor: accentColor }]}>
          <Animated.View style={[styles.lifetimeTrack, { backgroundColor: accentColor }, lifetimeStyle]} />
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          {presentation !== 'standard' ? (
            <View pointerEvents="none" style={styles.glitchDecor}>
              <View style={[styles.glitchLine, styles.glitchLineTop]} />
              <View style={[styles.glitchLine, styles.glitchLineBottom]} />
              <View style={styles.scanLine} />
            </View>
          ) : null}
          <View style={styles.icon}>{resolvedIcon}</View>
          <View style={styles.copy}>
            {presentation !== 'standard' ? <Text style={styles.achievementLabel}>{presentation === 'achievement' ? 'ACHIEVEMENT // UNLOCKED' : 'AXIONRIDE // SYSTEM'}</Text> : null}
            <Text style={[styles.message, presentation !== 'standard' && styles.achievementMessage]}>{message}</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function ToastIcon({ kind, color }: { readonly kind: ToastContentKind; readonly color: string }) {
  const name: ComponentProps<typeof SymbolView>['name'] = kind === 'xp'
    ? { ios: 'bolt.fill', android: 'bolt', web: 'bolt' }
    : kind === 'achievement'
      ? { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' }
      : kind === 'error'
        ? { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }
        : kind === 'info'
          ? { ios: 'info.circle.fill', android: 'info', web: 'info' }
          : { ios: 'checkmark', android: 'check', web: 'check' };
  return <SymbolView name={name} size={18} tintColor={color} />;
}

function getStackScale(stackIndex: number) {
  if (stackIndex <= 0) return 1;
  return stackIndex === 1 ? .96 : .94;
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
    right: spacing.lg,
    left: 48,
    zIndex: 100,
  },
  toast: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: semanticColors.dark.border,
    borderRadius: 18,
    backgroundColor: 'rgba(7, 12, 18, .94)',
    shadowOpacity: .28,
    shadowRadius: 18,
    elevation: 12,
  },
  achievementToast: {
    minHeight: 74,
    borderRadius: 18,
    borderColor: 'rgba(255, 122, 26, 0.58)',
    backgroundColor: 'rgba(5, 10, 16, .96)',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  lifetimeTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    opacity: .9,
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

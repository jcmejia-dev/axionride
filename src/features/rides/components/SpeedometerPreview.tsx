import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/src/theme';

type SpeedometerPreviewProps = {
  readonly speedKmh: number;
  readonly status: 'idle' | 'active' | 'paused' | 'completed';
  readonly permissionLabel: string;
  readonly gpsActive: boolean;
  readonly elapsedTime: string;
  readonly disabled?: boolean;
  readonly onStart: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onFinish: () => void;
  readonly onCancel: () => void;
};

export function SpeedometerPreview({
  speedKmh,
  status,
  permissionLabel,
  gpsActive,
  elapsedTime,
  disabled = false,
  onStart,
  onPause,
  onResume,
  onFinish,
  onCancel,
}: SpeedometerPreviewProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const statusText = getStatusText(status, gpsActive);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.18, 0.38],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1.06],
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.dial}>
        <Text style={styles.speed}>{Math.round(speedKmh)}</Text>
        <Text style={styles.unit}>km/h</Text>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, gpsActive ? styles.gpsDot : null]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        <Text style={styles.elapsed}>{elapsedTime}</Text>
      </View>
      <Text style={styles.permissionText}>{permissionLabel}</Text>
      {status === 'idle' ? (
        <CockpitButton label="Start Ride" onPress={onStart} disabled={disabled} primary />
      ) : status === 'active' ? (
        <View style={styles.buttonRow}>
          <CockpitButton label="Pause" onPress={onPause} disabled={disabled} />
          <CockpitButton label="Finish" onPress={onFinish} disabled={disabled} primary />
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <CockpitButton label="Resume" onPress={onResume} disabled={disabled} primary />
          <CockpitButton label="Cancel" onPress={onCancel} disabled={disabled} />
          <CockpitButton label="Finish" onPress={onFinish} disabled={disabled} />
        </View>
      )}
    </View>
  );
}

type CockpitButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly primary?: boolean;
};

function CockpitButton({ label, onPress, disabled = false, primary = false }: CockpitButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.startButton,
        primary ? styles.primaryButton : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}>
      <Text style={[styles.startButtonText, primary ? styles.primaryButtonText : null]}>{label}</Text>
    </Pressable>
  );
}

function getStatusText(status: SpeedometerPreviewProps['status'], gpsActive: boolean) {
  if (status === 'active') {
    return gpsActive ? 'GPS tracking' : 'Tracking without location';
  }

  if (status === 'paused') {
    return 'Paused';
  }

  return 'Ready to ride';
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    top: 6,
    width: 236,
    height: 236,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderRadius: 118,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  dial: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 110,
    backgroundColor: '#08090B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.38,
    shadowRadius: 30,
    elevation: 9,
  },
  speed: {
    color: palette.text,
    fontSize: 76,
    lineHeight: 82,
    fontWeight: '900',
  },
  unit: {
    ...typography.subtitle,
    color: 'rgba(248, 250, 252, 0.62)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.success,
  },
  statusText: {
    ...typography.caption,
    color: palette.text,
    fontWeight: '800',
  },
  gpsDot: {
    backgroundColor: palette.accentBlue,
  },
  elapsed: {
    ...typography.caption,
    marginTop: spacing.md,
    color: 'rgba(248, 250, 252, 0.5)',
    fontWeight: '800',
  },
  permissionText: {
    ...typography.caption,
    color: 'rgba(248, 250, 252, 0.58)',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  startButton: {
    minHeight: 52,
    minWidth: 132,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  startButtonText: {
    ...typography.button,
    color: palette.text,
  },
  primaryButtonText: {
    color: palette.darkBackground,
  },
  disabled: {
    opacity: 0.46,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});

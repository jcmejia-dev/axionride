import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { palette, radius, spacing } from '@/src/theme';

type RideMapControlsProps = {
  readonly following: boolean;
  readonly onRecenter: () => void;
  readonly onFitRoute: () => void;
  readonly onToggleFollow: () => void;
};

export function RideMapControls({
  following,
  onRecenter,
  onFitRoute,
  onToggleFollow,
}: RideMapControlsProps) {
  return (
    <View style={styles.controls}>
      <ControlButton
        accessibilityLabel="Recenter map"
        icon={{ ios: 'location.fill', android: 'my_location', web: 'my_location' }}
        onPress={onRecenter}
      />
      <ControlButton
        accessibilityLabel="Fit route"
        icon={{ ios: 'arrow.up.left.and.arrow.down.right', android: 'zoom_out_map', web: 'zoom_out_map' }}
        onPress={onFitRoute}
      />
      <ControlButton
        accessibilityLabel={following ? 'Disable follow rider' : 'Follow rider'}
        active={following}
        icon={{ ios: 'location.north.line.fill', android: 'near_me', web: 'near_me' }}
        onPress={onToggleFollow}
      />
    </View>
  );
}

type ControlButtonProps = {
  readonly accessibilityLabel: string;
  readonly icon: {
    readonly ios: 'location.fill' | 'arrow.up.left.and.arrow.down.right' | 'location.north.line.fill';
    readonly android: 'my_location' | 'zoom_out_map' | 'near_me';
    readonly web: 'my_location' | 'zoom_out_map' | 'near_me';
  };
  readonly active?: boolean;
  readonly onPress: () => void;
};

function ControlButton({ accessibilityLabel, icon, active = false, onPress }: ControlButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active ? styles.activeButton : null,
        pressed ? styles.pressed : null,
      ]}>
      <SymbolView
        name={icon}
        tintColor={active ? palette.darkBackground : palette.text}
        size={19}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
  },
  button: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(7, 10, 15, 0.82)',
  },
  activeButton: {
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
});

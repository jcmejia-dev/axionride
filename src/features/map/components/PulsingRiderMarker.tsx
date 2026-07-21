import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

type PulsingRiderMarkerProps = {
  readonly size?: number;
};

export function PulsingRiderMarker({ size = 24 }: PulsingRiderMarkerProps) {
  const pulse = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const outerRingStyle = useAnimatedStyle(() => {
    const scale = 1 + pulse.value * 1.5;
    return {
      transform: [{ scale }],
      opacity: opacity.value,
    };
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "rgba(0, 122, 255, 0.3)",
          },
          outerRingStyle,
        ]}
      />
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: (size * 0.5) / 2,
          backgroundColor: "#007AFF",
          borderWidth: 2,
          borderColor: "#fff",
        }}
      />
    </View>
  );
}

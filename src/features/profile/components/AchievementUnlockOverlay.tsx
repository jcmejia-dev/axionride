import { SymbolView } from "expo-symbols";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
} from "react";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";

import { palette, radius, spacing, typography } from "@/src/theme";

type SymbolName = ComponentProps<typeof SymbolView>["name"];

export type UnlockEvent = {
  readonly id: string;
  readonly title: string;
  readonly icon: SymbolName;
};

export function AchievementUnlockOverlay({
  event,
  onComplete,
}: {
  readonly event: UnlockEvent | null;
  readonly onComplete: () => void;
}): ReactElement {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const [visibleEvent, setVisibleEvent] = useState<UnlockEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!event) {
      setVisibleEvent(null);
      return;
    }

    // Set the event to display
    setVisibleEvent(event);

    // Reset animations
    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0);
    glowOpacity.setValue(0);

    // Animate in: scale burst + glow flash
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Auto-dismiss after 800ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisibleEvent(null);
        onComplete();
      });
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [event, scaleAnim, opacityAnim, glowOpacity, onComplete]);

  if (!visibleEvent) return <View />;

  return (
    <Modal transparent animationType="none" visible={true}>
      <View style={styles.overlay}>
        {/* Glow background */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowOpacity,
              transform: [
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0.3, 1],
                    outputRange: [0.5, 1.2],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Content card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconWrap}>
            <SymbolView
              name={visibleEvent.icon}
              size={40}
              tintColor={palette.accentOrange}
            />
          </View>
          <Text style={styles.kicker}>Achievement Unlocked</Text>
          <Text style={styles.title}>{visibleEvent.title}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  glowRing: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
  },
  card: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.3)",
    borderRadius: radius.xl + 4,
    backgroundColor: "rgba(17, 21, 28, 0.96)",
    minWidth: 240,
    shadowColor: palette.accentOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
  },
  kicker: {
    ...typography.label,
    color: palette.accentOrange,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    ...typography.heading,
    color: palette.text,
    textAlign: "center",
  },
});

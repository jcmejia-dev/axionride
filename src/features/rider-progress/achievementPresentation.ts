import type { ComponentProps } from "react";
import type { SymbolView } from "expo-symbols";

import type { RiderAchievementId } from "@/src/domain/rider-progress";

export type AchievementSymbolName = ComponentProps<typeof SymbolView>["name"];

export const ACHIEVEMENT_ICONS: Record<RiderAchievementId, AchievementSymbolName> = {
  "first-ride": {
    ios: "flag.checkered",
    android: "sports_score",
    web: "sports_score",
  },
  "ten-rides": {
    ios: "10.circle.fill",
    android: "filter_9_plus",
    web: "filter_9_plus",
  },
  "hundred-km-rider": {
    ios: "gauge.high",
    android: "speed",
    web: "speed",
  },
  "maintenance-master": {
    ios: "wrench.and.screwdriver.fill",
    android: "build",
    web: "build",
  },
};

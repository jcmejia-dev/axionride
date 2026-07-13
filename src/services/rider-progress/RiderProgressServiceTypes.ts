import type {
  RiderAchievement,
  RiderProgressSnapshot,
} from "@/src/domain/rider-progress";

export type RiderProgressReward = {
  readonly id: string;
  readonly kind: "xp" | "achievement";
  readonly message: string;
};

export type RiderProgressUpdate = {
  readonly xpGained: number;
  readonly snapshot: RiderProgressSnapshot;
  readonly unlockedAchievements: readonly RiderAchievement[];
};

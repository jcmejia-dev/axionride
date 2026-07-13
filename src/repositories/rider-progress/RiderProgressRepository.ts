import type {
  RiderAchievement,
  RiderAchievementId,
} from "@/src/domain/rider-progress";

export type StoredRiderProgress = {
  readonly totalXp: number;
  readonly streakCount: number;
  readonly lastActiveDate: string | null;
};

export type RiderProgressEventType =
  | "ride_completed"
  | "maintenance_completed"
  | "daily_open"
  | "stats_viewed";

export type RecordRiderProgressEventInput = {
  readonly id: string;
  readonly type: RiderProgressEventType;
  readonly xp: number;
  readonly occurredAt: string;
  readonly activityDate?: string;
};

export type RecordRiderProgressEventResult = {
  readonly applied: boolean;
  readonly progress: StoredRiderProgress;
};

export interface RiderProgressRepository {
  getProgress(): Promise<StoredRiderProgress>;
  getAchievements(): Promise<readonly RiderAchievement[]>;
  recordEvent(input: RecordRiderProgressEventInput): Promise<RecordRiderProgressEventResult>;
  unlockAchievements(
    ids: readonly RiderAchievementId[],
    unlockedAt: string,
  ): Promise<readonly RiderAchievement[]>;
  clear(): Promise<void>;
}

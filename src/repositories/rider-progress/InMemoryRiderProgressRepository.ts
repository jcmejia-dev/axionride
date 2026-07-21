import {
  RIDER_ACHIEVEMENT_DEFINITIONS,
  calculateNextRiderStreak,
  type RiderAchievement,
  type RiderAchievementId,
} from "@/src/domain/rider-progress";

import type {
  RecordRiderProgressEventInput,
  RiderProgressRepository,
  StoredRiderProgress,
} from "./RiderProgressRepository";

export class InMemoryRiderProgressRepository implements RiderProgressRepository {
  private progress: StoredRiderProgress = {
    totalXp: 0,
    streakCount: 0,
    lastActiveDate: null,
  };
  private readonly events = new Set<string>();
  private achievements: RiderAchievement[] = RIDER_ACHIEVEMENT_DEFINITIONS.map(
    (achievement) => ({ ...achievement, unlocked: false, unlockedAt: null }),
  );

  async getProgress() {
    return this.progress;
  }

  async getAchievements() {
    return this.achievements;
  }

  async recordEvent(input: RecordRiderProgressEventInput) {
    if (this.events.has(input.id)) {
      return { applied: false, progress: this.progress };
    }

    this.events.add(input.id);
    const streak = input.activityDate
      ? calculateNextRiderStreak(
          this.progress.streakCount,
          this.progress.lastActiveDate,
          input.activityDate,
        )
      : null;
    this.progress = {
      totalXp: this.progress.totalXp + input.xp,
      streakCount: streak?.streakCount ?? this.progress.streakCount,
      lastActiveDate: streak?.lastActiveDate ?? this.progress.lastActiveDate,
    };
    return { applied: true, progress: this.progress };
  }

  async unlockAchievements(ids: readonly RiderAchievementId[], unlockedAt: string) {
    const requested = new Set(ids);
    const newlyUnlocked: RiderAchievement[] = [];
    this.achievements = this.achievements.map((achievement) => {
      if (!requested.has(achievement.id) || achievement.unlocked) return achievement;
      const unlocked = { ...achievement, unlocked: true, unlockedAt };
      newlyUnlocked.push(unlocked);
      return unlocked;
    });
    return newlyUnlocked;
  }

  async clear() {
    this.progress = { totalXp: 0, streakCount: 0, lastActiveDate: null };
    this.events.clear();
    this.achievements = RIDER_ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
      ...achievement,
      unlocked: false,
      unlockedAt: null,
    }));
  }
}

import { MaintenanceStatus } from "@/src/domain/maintenance";
import {
  calculateRiderProgress,
  getEligibleRiderAchievementIds,
  type RiderAchievement,
  type RiderAchievementId,
  type RiderProgressSnapshot,
} from "@/src/domain/rider-progress";
import { RideStatus } from "@/src/domain/ride";
import { BaseService } from "@/src/services/BaseService";
import type { ServiceContext } from "@/src/services/ServiceContext";
import type { ServiceResult } from "@/src/services/ServiceTypes";

import { emitRiderProgressReward } from "./RiderProgressRewardEvents";
import type { RiderProgressUpdate } from "./RiderProgressServiceTypes";

export const RIDER_XP = {
  rideCompleted: 5,
  maintenanceCompleted: 10,
  dailyOpen: 2,
  statsViewed: 1,
  dailyChallengeCompleted: 5,
} as const;

const SNAPSHOT_CACHE_TTL_MS = 30_000;
const snapshotCache = new Map<string, { readonly cachedAt: number; readonly snapshot: RiderProgressSnapshot }>();
let operationQueue: Promise<void> = Promise.resolve();

export class RiderProgressService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }

  getSnapshot(forceRefresh = false): Promise<ServiceResult<RiderProgressSnapshot>> {
    return runSerialized(async () => {
      try {
        const workspaceId = await this.context.repositories.workspaces.getActiveWorkspaceId();
        const cached = snapshotCache.get(workspaceId);
        if (!forceRefresh && cached && Date.now() - cached.cachedAt < SNAPSHOT_CACHE_TTL_MS) {
          return this.success(cached.snapshot);
        }

        const unlockedAchievements = await this.evaluateAchievements();
        const snapshot = await this.readSnapshot();
        cacheSnapshot(workspaceId, snapshot);
        unlockedAchievements.forEach(emitAchievementReward);
        return this.success(snapshot);
      } catch (cause) {
        return this.failure({
          code: "repository_error",
          message: "Rider progress could not be loaded.",
          cause,
        });
      }
    });
  }

  recordRideCompleted(rideId: string) {
    return this.recordEvent({
      id: `ride:${rideId}`,
      type: "ride_completed",
      xp: RIDER_XP.rideCompleted,
      reason: "Ride completed",
    });
  }

  recordMaintenanceCompleted(maintenanceId: string) {
    return this.recordEvent({
      id: `maintenance:${maintenanceId}`,
      type: "maintenance_completed",
      xp: RIDER_XP.maintenanceCompleted,
      reason: "Maintenance completed",
    });
  }

  recordDailyOpen(now = new Date()) {
    const dateKey = toLocalDateKey(now);
    return this.recordEvent({
      id: `daily:${dateKey}`,
      type: "daily_open",
      xp: RIDER_XP.dailyOpen,
      reason: "Daily riding streak",
      activityDate: dateKey,
      occurredAt: now.toISOString(),
    });
  }

  recordStatsViewed(now = new Date()) {
    const dateKey = toLocalDateKey(now);
    return this.recordEvent({
      id: `stats:${dateKey}`,
      type: "stats_viewed",
      xp: RIDER_XP.statsViewed,
      reason: "Ride statistics viewed",
      occurredAt: now.toISOString(),
    });
  }

  recordDailyChallengeCompleted(challengeId: string) {
    return this.recordEvent({
      id: `daily-challenge:${challengeId}`,
      type: "daily_challenge_completed",
      xp: RIDER_XP.dailyChallengeCompleted,
      reason: "Daily challenge completed",
    });
  }

  private recordEvent(input: {
    readonly id: string;
    readonly type: "ride_completed" | "maintenance_completed" | "daily_open" | "stats_viewed" | "daily_challenge_completed";
    readonly xp: number;
    readonly reason: string;
    readonly activityDate?: string;
    readonly occurredAt?: string;
  }): Promise<ServiceResult<RiderProgressUpdate>> {
    return runSerialized(async () => {
      try {
        const occurredAt = input.occurredAt ?? new Date().toISOString();
        const result = await this.requireRepository().recordEvent({
          id: input.id,
          type: input.type,
          xp: input.xp,
          occurredAt,
          activityDate: input.activityDate,
        });
        const unlockedAchievements = await this.evaluateAchievements(occurredAt);
        const workspaceId = await this.context.repositories.workspaces.getActiveWorkspaceId();
        const snapshot = await this.readSnapshot();
        cacheSnapshot(workspaceId, snapshot);

        if (result.applied) {
          emitRiderProgressReward({
            id: `xp:${input.id}`,
            kind: "xp",
            message: `+${input.xp} XP — ${input.reason}`,
          });
        }
        unlockedAchievements.forEach(emitAchievementReward);

        return this.success({
          xpGained: result.applied ? input.xp : 0,
          snapshot,
          unlockedAchievements,
        });
      } catch (cause) {
        return this.failure({
          code: "repository_error",
          message: "Rider progress could not be updated.",
          cause,
        });
      }
    });
  }

  private async evaluateAchievements(unlockedAt = new Date().toISOString()) {
    const [rides, maintenance, achievements] = await Promise.all([
      this.context.repositories.rides.getAllRides(),
      this.context.repositories.maintenance.getAllMaintenance(),
      this.requireRepository().getAchievements(),
    ]);
    const completedRides = rides.filter((ride) => ride.status === RideStatus.Completed);
    const completedMaintenance = maintenance.filter(
      (record) => record.status === MaintenanceStatus.Completed,
    );
    const totalDistanceKm = completedRides.reduce((total, ride) => total + ride.distanceKm, 0);
    const eligibleIds: RiderAchievementId[] = getEligibleRiderAchievementIds({
      completedRideCount: completedRides.length,
      totalDistanceKm,
      completedMaintenanceCount: completedMaintenance.length,
    });

    const lockedIds = new Set(
      achievements.filter((achievement) => !achievement.unlocked).map((achievement) => achievement.id),
    );
    return this.requireRepository().unlockAchievements(
      eligibleIds.filter((id) => lockedIds.has(id)),
      unlockedAt,
    );
  }

  private async readSnapshot(): Promise<RiderProgressSnapshot> {
    // Keep the read order deterministic after the repository's single-flight
    // workspace initialization has completed.
    const storedProgress = await this.requireRepository().getProgress();
    const achievements = await this.requireRepository().getAchievements();
    return {
      progress: calculateRiderProgress(storedProgress.totalXp),
      streak: {
        streakCount: storedProgress.streakCount,
        lastActiveDate: storedProgress.lastActiveDate,
      },
      achievements,
    };
  }

  private requireRepository() {
    const repository = this.context.repositories.riderProgress;
    if (!repository) throw new Error("Rider progress repository is unavailable.");
    return repository;
  }
}

function cacheSnapshot(workspaceId: string, snapshot: RiderProgressSnapshot) {
  snapshotCache.set(workspaceId, { cachedAt: Date.now(), snapshot });
}

function emitAchievementReward(achievement: RiderAchievement) {
  emitRiderProgressReward({
    id: `achievement:${achievement.id}:${achievement.unlockedAt ?? "unlocked"}`,
    kind: "achievement",
    message: achievement.title,
  });
}

function runSerialized<T>(operation: () => Promise<T>) {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(() => undefined, () => undefined);
  return result;
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

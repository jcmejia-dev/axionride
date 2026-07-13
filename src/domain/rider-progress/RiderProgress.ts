export type RiderProgress = {
  readonly level: number;
  readonly xp: number;
  readonly totalXp: number;
};

export type RiderStreak = {
  readonly streakCount: number;
  readonly lastActiveDate: string | null;
};

export type RiderAchievementId =
  | "first-ride"
  | "ten-rides"
  | "hundred-km-rider"
  | "maintenance-master";

export type RiderAchievement = {
  readonly id: RiderAchievementId;
  readonly title: string;
  readonly description: string;
  readonly unlocked: boolean;
  readonly unlockedAt: string | null;
};

export type RiderProgressSnapshot = {
  readonly progress: RiderProgress;
  readonly streak: RiderStreak;
  readonly achievements: readonly RiderAchievement[];
};

export const RIDER_ACHIEVEMENT_DEFINITIONS = [
  {
    id: "first-ride",
    title: "First Ride",
    description: "Complete your first recorded ride.",
  },
  {
    id: "ten-rides",
    title: "10 Rides",
    description: "Complete 10 recorded rides.",
  },
  {
    id: "hundred-km-rider",
    title: "100 KM Rider",
    description: "Record 100 kilometres of total riding distance.",
  },
  {
    id: "maintenance-master",
    title: "Maintenance Master",
    description: "Complete five maintenance tasks.",
  },
] as const satisfies readonly Omit<RiderAchievement, "unlocked" | "unlockedAt">[];

export function calculateRiderProgress(totalXp: number): RiderProgress {
  const normalizedTotalXp = Math.max(0, Math.floor(totalXp));
  return {
    level: Math.floor(normalizedTotalXp / 100) + 1,
    xp: normalizedTotalXp % 100,
    totalXp: normalizedTotalXp,
  };
}

export function calculateNextRiderStreak(
  currentStreak: number,
  lastActiveDate: string | null,
  activityDate: string,
): RiderStreak {
  if (lastActiveDate === activityDate) {
    return { streakCount: currentStreak, lastActiveDate };
  }

  const consecutive = lastActiveDate !== null && daysBetween(lastActiveDate, activityDate) === 1;
  return {
    streakCount: consecutive ? currentStreak + 1 : 1,
    lastActiveDate: activityDate,
  };
}

export function getEligibleRiderAchievementIds(metrics: {
  readonly completedRideCount: number;
  readonly totalDistanceKm: number;
  readonly completedMaintenanceCount: number;
}): RiderAchievementId[] {
  const eligibleIds: RiderAchievementId[] = [];
  if (metrics.completedRideCount >= 1) eligibleIds.push("first-ride");
  if (metrics.completedRideCount >= 10) eligibleIds.push("ten-rides");
  if (metrics.totalDistanceKm >= 100) eligibleIds.push("hundred-km-rider");
  if (metrics.completedMaintenanceCount >= 5) eligibleIds.push("maintenance-master");
  return eligibleIds;
}

function daysBetween(from: string, to: string) {
  return Math.round((dateOnlyToUtc(to) - dateOnlyToUtc(from)) / 86_400_000);
}

function dateOnlyToUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

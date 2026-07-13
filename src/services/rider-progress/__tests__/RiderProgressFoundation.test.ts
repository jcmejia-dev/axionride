import {
  RIDER_ACHIEVEMENT_DEFINITIONS,
  calculateNextRiderStreak,
  calculateRiderProgress,
  getEligibleRiderAchievementIds,
} from "@/src/domain/rider-progress";

/** Framework-neutral contract tests for the rider progression rules. */
export function runRiderProgressFoundationContractTests() {
  const levelOne = calculateRiderProgress(75);
  assert(levelOne.level === 1 && levelOne.xp === 75, "XP remains within level one");

  const levelThree = calculateRiderProgress(275);
  assert(levelThree.level === 3 && levelThree.xp === 75, "level formula uses each 100 total XP");

  const consecutive = calculateNextRiderStreak(2, "2026-07-12", "2026-07-13");
  assert(consecutive.streakCount === 3, "opening on the next local day extends the streak");

  const missedDay = calculateNextRiderStreak(5, "2026-07-10", "2026-07-13");
  assert(missedDay.streakCount === 1, "missing a day resets the streak");

  const sameDay = calculateNextRiderStreak(3, "2026-07-13", "2026-07-13");
  assert(sameDay.streakCount === 3, "same-day activity does not inflate the streak");

  const eligible = getEligibleRiderAchievementIds({
    completedRideCount: 10,
    totalDistanceKm: 100,
    completedMaintenanceCount: 5,
  });
  assert(eligible.length === RIDER_ACHIEVEMENT_DEFINITIONS.length, "all thresholds unlock exactly four achievements");
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Rider progress contract failed: ${message}`);
}

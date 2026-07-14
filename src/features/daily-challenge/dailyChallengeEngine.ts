import type { RidePoint } from '@/src/domain/ride';

import type {
  DailyChallengeEvaluation,
  DailyChallengeType,
  DailyRideChallenge,
} from './types';

type Definition = {
  readonly type: DailyChallengeType;
  readonly title: string;
  readonly description: string;
  readonly targetSeconds: number;
};

type SpeedInterval = {
  readonly seconds: number;
  readonly speedKmh: number;
  readonly speedChangeKmhPerSecond: number;
};

const DEFINITIONS: readonly Definition[] = [
  { type: 'smooth_speed', title: 'Smooth Operator', description: 'Hold a smooth pace with no abrupt speed spikes for 3 minutes.', targetSeconds: 180 },
  { type: 'no_stops', title: 'Keep Rolling', description: 'Ride continuously for 5 minutes without a confirmed stop.', targetSeconds: 300 },
  { type: 'steady_above_20', title: 'Steady Twenty', description: 'Stay above 20 km/h consistently for 2 minutes.', targetSeconds: 120 },
  { type: 'minimize_slow', title: 'Flow State', description: 'Complete 3 minutes with slow riding at 15% or less.', targetSeconds: 180 },
] as const;

export function createDailyChallenge(date: string): DailyRideChallenge {
  const definition = DEFINITIONS[hashDate(date) % DEFINITIONS.length];
  return {
    challengeId: `${date}:${definition.type}`,
    date,
    ...definition,
    progress: 0,
    completed: false,
  };
}

export function hydrateDailyChallenge(input: {
  readonly challengeId: string;
  readonly date: string;
  readonly type: DailyChallengeType;
  readonly progress: number;
  readonly completed: boolean;
}) {
  const definition = DEFINITIONS.find((item) => item.type === input.type)
    ?? DEFINITIONS[0];
  return {
    ...input,
    ...definition,
    progress: clampProgress(input.progress),
  } satisfies DailyRideChallenge;
}

export function evaluateDailyChallenge(
  challenge: DailyRideChallenge,
  route: readonly RidePoint[],
): DailyChallengeEvaluation {
  if (challenge.completed) return { progress: 100, completed: true, reason: 'Today’s challenge is already complete.' };
  const intervals = createSpeedIntervals(route);
  if (intervals.length === 0) return { progress: challenge.progress, completed: false, reason: 'Not enough GPS telemetry was recorded.' };

  const evaluation = challenge.type === 'smooth_speed'
    ? evaluateSmoothness(intervals, challenge.targetSeconds)
    : challenge.type === 'no_stops'
      ? evaluateNoStops(intervals, challenge.targetSeconds)
      : challenge.type === 'steady_above_20'
        ? evaluateSteadySpeed(intervals, challenge.targetSeconds)
        : evaluateSlowSegments(intervals, challenge.targetSeconds);
  const progress = Math.max(challenge.progress, evaluation.progress);
  return { ...evaluation, progress, completed: progress >= 100 };
}

export function toLocalChallengeDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function evaluateSmoothness(intervals: readonly SpeedInterval[], targetSeconds: number): DailyChallengeEvaluation {
  let streak = 0;
  let longestStreak = 0;
  let spikeCount = 0;
  for (const interval of intervals) {
    if (interval.speedKmh >= 2 && interval.speedChangeKmhPerSecond <= 12) {
      streak += interval.seconds;
      longestStreak = Math.max(longestStreak, streak);
    } else if (interval.speedChangeKmhPerSecond > 12) {
      spikeCount += 1;
      streak = 0;
    }
  }
  const progress = progressFor(longestStreak, targetSeconds);
  return {
    progress,
    completed: progress >= 100,
    reason: progress >= 100
      ? 'Smooth speed maintained with controlled acceleration.'
      : spikeCount > 0
        ? `${spikeCount} abrupt speed ${spikeCount === 1 ? 'change was' : 'changes were'} detected.`
        : `${formatRemaining(targetSeconds - longestStreak)} of smooth riding remaining.`,
  };
}

function evaluateNoStops(intervals: readonly SpeedInterval[], targetSeconds: number): DailyChallengeEvaluation {
  let streak = 0;
  let longestStreak = 0;
  let stoppedRun = 0;
  let confirmedStops = 0;
  for (const interval of intervals) {
    if (interval.speedKmh >= 2) {
      streak += interval.seconds;
      longestStreak = Math.max(longestStreak, streak);
      stoppedRun = 0;
      continue;
    }
    stoppedRun += interval.seconds;
    if (stoppedRun >= 5) {
      if (streak > 0) confirmedStops += 1;
      streak = 0;
    }
  }
  const progress = progressFor(longestStreak, targetSeconds);
  return {
    progress,
    completed: progress >= 100,
    reason: progress >= 100
      ? 'Continuous riding completed without a confirmed stop.'
      : confirmedStops > 0
        ? `${confirmedStops} confirmed ${confirmedStops === 1 ? 'stop interrupted' : 'stops interrupted'} the streak.`
        : `${formatRemaining(targetSeconds - longestStreak)} of continuous riding remaining.`,
  };
}

function evaluateSteadySpeed(intervals: readonly SpeedInterval[], targetSeconds: number): DailyChallengeEvaluation {
  let streak = 0;
  let longestStreak = 0;
  let belowTargetSeconds = 0;
  for (const interval of intervals) {
    if (interval.speedKmh >= 20) {
      streak += interval.seconds;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      belowTargetSeconds += interval.seconds;
      streak = 0;
    }
  }
  const progress = progressFor(longestStreak, targetSeconds);
  return {
    progress,
    completed: progress >= 100,
    reason: progress >= 100
      ? 'A consistent pace above 20 km/h was maintained.'
      : belowTargetSeconds > 0
        ? `Speed below 20 km/h interrupted the current streak.`
        : `${formatRemaining(targetSeconds - longestStreak)} above 20 km/h remaining.`,
  };
}

function evaluateSlowSegments(intervals: readonly SpeedInterval[], targetSeconds: number): DailyChallengeEvaluation {
  const totalSeconds = intervals.reduce((total, interval) => total + interval.seconds, 0);
  const slowSeconds = intervals
    .filter((interval) => interval.speedKmh < 10)
    .reduce((total, interval) => total + interval.seconds, 0);
  const slowRatio = totalSeconds > 0 ? slowSeconds / totalSeconds : 1;
  const durationProgress = Math.min(1, totalSeconds / targetSeconds);
  const qualityProgress = slowRatio <= .15 ? 1 : .15 / slowRatio;
  const progress = clampProgress(durationProgress * qualityProgress * 100);
  const completed = totalSeconds >= targetSeconds && slowRatio <= .15;
  return {
    progress: completed ? 100 : progress,
    completed,
    reason: completed
      ? 'Slow riding stayed within 15% of the session.'
      : slowRatio > .15
        ? `Slow riding reached ${Math.round(slowRatio * 100)}%; keep it at 15% or less.`
        : `${formatRemaining(targetSeconds - totalSeconds)} of qualifying riding remaining.`,
  };
}

function createSpeedIntervals(route: readonly RidePoint[]) {
  const intervals: SpeedInterval[] = [];
  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const current = route[index];
    if (!isValidSpeed(previous.speed) || !isValidSpeed(current.speed)) continue;
    const seconds = (Date.parse(current.timestamp) - Date.parse(previous.timestamp)) / 1000;
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 10) continue;
    intervals.push({
      seconds,
      speedKmh: current.speed,
      speedChangeKmhPerSecond: Math.abs(current.speed - previous.speed) / seconds,
    });
  }
  return intervals;
}

function isValidSpeed(speed: number | undefined): speed is number {
  return typeof speed === 'number' && Number.isFinite(speed) && speed >= 0 && speed <= 120;
}

function progressFor(seconds: number, targetSeconds: number) {
  return clampProgress((seconds / targetSeconds) * 100);
}

function clampProgress(progress: number) {
  return Math.round(Math.max(0, Math.min(100, progress)));
}

function formatRemaining(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return minutes > 0 ? `${minutes}m${remainder ? ` ${remainder}s` : ''}` : `${remainder}s`;
}

function hashDate(date: string) {
  return [...date].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 17);
}

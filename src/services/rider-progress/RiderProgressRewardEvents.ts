import type { RiderProgressReward } from "./RiderProgressServiceTypes";

type RewardListener = (reward: RiderProgressReward) => void;

const listeners = new Set<RewardListener>();
let pendingRewards: RiderProgressReward[] = [];

export function emitRiderProgressReward(reward: RiderProgressReward) {
  if (!listeners.size) {
    pendingRewards.push(reward);
    return;
  }

  listeners.forEach((listener) => listener(reward));
}

export function subscribeToRiderProgressRewards(listener: RewardListener) {
  listeners.add(listener);
  const queuedRewards = pendingRewards;
  pendingRewards = [];
  queuedRewards.forEach(listener);

  return () => {
    listeners.delete(listener);
  };
}

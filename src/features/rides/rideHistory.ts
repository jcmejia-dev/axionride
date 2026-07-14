import type { Ride } from '@/src/domain/ride';

export type RideHistorySection = {
  readonly title: 'Today' | 'Yesterday' | 'This Week' | 'Earlier';
  readonly data: readonly Ride[];
};

export function groupRideHistory(rides: readonly Ride[], now = new Date()): readonly RideHistorySection[] {
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const buckets: Record<RideHistorySection['title'], Ride[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  };
  [...rides]
    .sort((first, second) => Date.parse(second.startTime) - Date.parse(first.startTime))
    .forEach((ride) => {
      const timestamp = startOfDay(new Date(ride.endTime ?? ride.startTime));
      if (timestamp.getTime() >= today.getTime()) buckets.Today.push(ride);
      else if (timestamp.getTime() >= yesterday.getTime()) buckets.Yesterday.push(ride);
      else if (timestamp.getTime() >= weekStart.getTime()) buckets['This Week'].push(ride);
      else buckets.Earlier.push(ride);
    });

  return (Object.keys(buckets) as RideHistorySection['title'][])
    .map((title) => ({ title, data: buckets[title] }))
    .filter((section) => section.data.length > 0);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

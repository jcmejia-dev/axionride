import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RiderProgressSnapshot } from "@/src/domain/rider-progress";
import { getLevelProgress } from "@/src/domain/rider-progress";
import type { RideStatisticsSummary, ServiceContext } from "@/src/services";
import {
  createRiderProgressService,
  createStatisticsService,
} from "@/src/services";

import type { RideMetrics } from "../components/StatsSummary";

export type ProfileScreenData = {
  readonly loading: boolean;
  readonly error: string | null;
  readonly riderName: string;
  readonly snapshot: RiderProgressSnapshot | null;
  readonly metrics: RideMetrics;
  readonly levelProgress: { current: number; next: number; progress: number };
};

const EMPTY_METRICS: RideMetrics = {
  totalRides: 0,
  totalDistanceKm: 0,
  totalDurationSeconds: 0,
  bestScore: null,
};

function rideStatsToMetrics(
  stats: RideStatisticsSummary,
  bestScore: number | null,
): RideMetrics {
  return {
    totalRides: stats.totalRides,
    totalDistanceKm: stats.totalDistanceKm,
    totalDurationSeconds: stats.totalRideTimeSeconds,
    bestScore,
  };
}

type CachedData = {
  readonly snapshot: RiderProgressSnapshot | null;
  readonly metrics: RideMetrics;
  readonly version: number;
};

let cachedProfileData: CachedData = {
  snapshot: null,
  metrics: EMPTY_METRICS,
  version: 0,
};

let fetchVersion = 0;

export function useProfileData(
  serviceContext: ServiceContext | null,
  riderName: string,
  refreshKey: number,
): ProfileScreenData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!serviceContext) return;

    const currentVersion = ++fetchVersion;

    try {
      setError(null);

      const statsService = createStatisticsService(serviceContext);
      const progressService = createRiderProgressService(serviceContext);

      const [statsResult, progressResult] = await Promise.all([
        statsService.getDashboardStatistics(),
        progressService.getSnapshot(true),
      ]);

      if (!mountedRef.current || currentVersion !== fetchVersion) return;

      let metrics = EMPTY_METRICS;
      if (statsResult.ok) {
        metrics = rideStatsToMetrics(statsResult.value.rides, null);
      }

      let snapshot: RiderProgressSnapshot | null = null;
      if (progressResult.ok) {
        snapshot = progressResult.value;
      }

      cachedProfileData = {
        snapshot,
        metrics,
        version: currentVersion,
      };

      setLoading(false);
    } catch (cause) {
      if (!mountedRef.current) return;
      setError(
        cause instanceof Error ? cause.message : "Failed to load profile data",
      );
      setLoading(false);
    }
  }, [serviceContext]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh, refreshKey]);

  const snapshot = cachedProfileData.snapshot;
  const metrics = cachedProfileData.metrics;

  const levelProgress = useMemo(
    () =>
      snapshot
        ? getLevelProgress(snapshot.progress.totalXp)
        : { current: 0, next: 100, progress: 0 },
    [snapshot],
  );

  return useMemo(
    () => ({
      loading,
      error,
      riderName,
      snapshot,
      metrics,
      levelProgress,
    }),
    [loading, error, riderName, snapshot, metrics, levelProgress],
  );
}

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { StyleSheet, View } from "react-native";

import { Toast } from "@/src/components";
import {
  createInitialRiderProgressSnapshot,
  type RiderProgressSnapshot,
} from "@/src/domain/rider-progress";
import {
  createRiderProgressService,
  subscribeToRiderProgressRewards,
  type RiderProgressReward,
} from "@/src/services";
import { useAuth } from "./AuthProvider";

type RiderProgressContextValue = {
  readonly revision: number;
  readonly snapshot: RiderProgressSnapshot;
  readonly loading: boolean;
  readonly refresh: () => Promise<RiderProgressSnapshot | null>;
  readonly recordStatsViewed: () => Promise<void>;
};

const RiderProgressContext = createContext<RiderProgressContextValue | null>(null);

export function RiderProgressProvider({ children }: PropsWithChildren) {
  const { initialized, user } = useAuth();
  const riderProgressService = useMemo(() => createRiderProgressService(), []);
  const [rewards, setRewards] = useState<readonly RiderProgressReward[]>([]);
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState(createInitialRiderProgressSnapshot);
  const [loading, setLoading] = useState(true);

  const applySnapshot = useCallback((updated: RiderProgressSnapshot) => {
    setSnapshot(updated);
    console.log("XP UPDATE", {
      totalXp: updated.progress.totalXp,
      level: updated.progress.level,
      xp: updated.progress.xp,
    });
  }, []);

  const refresh = useCallback(async () => {
    const result = await riderProgressService.getSnapshot(true);
    if (!result.ok) return null;
    applySnapshot(result.value);
    return result.value;
  }, [applySnapshot, riderProgressService]);

  const recordStatsViewed = useCallback(async () => {
    const result = await riderProgressService.recordStatsViewed();
    if (result.ok) {
      applySnapshot(result.value.snapshot);
      return;
    }
    await refresh();
  }, [applySnapshot, refresh, riderProgressService]);

  useEffect(() => subscribeToRiderProgressRewards((reward) => {
    setRewards((current) => [reward, ...current.filter((item) => item.id !== reward.id)].slice(0, 3));
    setRevision((current) => current + 1);
    void refresh();
  }), [refresh]);

  useEffect(() => {
    if (!initialized) return;
    let cancelled = false;
    setLoading(true);
    void riderProgressService.recordDailyOpen().then(async (result) => {
      if (cancelled) return;
      if (result.ok) {
        applySnapshot(result.value.snapshot);
      } else {
        await refresh();
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [applySnapshot, initialized, refresh, riderProgressService, user?.id]);

  return (
    <RiderProgressContext.Provider value={{ revision, snapshot, loading, refresh, recordStatsViewed }}>
      <View style={styles.root}>
        {children}
        {rewards.map((reward, stackIndex) => (
          <Toast
            key={reward.id}
            visible
            message={reward.message}
            variant="success"
            durationMs={reward.kind === "achievement" ? 2400 : 2000}
            presentation={reward.kind === "achievement" ? "achievement" : "hud"}
            contentKind={reward.kind}
            stackIndex={stackIndex}
            onHide={() => setRewards((current) => current.filter((item) => item.id !== reward.id))}
          />
        ))}
      </View>
    </RiderProgressContext.Provider>
  );
}

export function useRiderProgress() {
  const context = useContext(RiderProgressContext);
  if (!context) throw new Error("useRiderProgress must be used inside RiderProgressProvider.");
  return context;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

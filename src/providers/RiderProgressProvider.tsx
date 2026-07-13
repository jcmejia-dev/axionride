import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { SymbolView } from "expo-symbols";
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
import { premiumColors } from "@/src/theme";

import { useAuth } from "./AuthProvider";

type RiderProgressContextValue = {
  readonly revision: number;
  readonly snapshot: RiderProgressSnapshot;
  readonly loading: boolean;
  readonly refresh: () => Promise<void>;
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
  const activeReward = rewards[0] ?? null;

  const refresh = useCallback(async () => {
    const result = await riderProgressService.getSnapshot();
    if (result.ok) setSnapshot(result.value);
  }, [riderProgressService]);

  const recordStatsViewed = useCallback(async () => {
    const result = await riderProgressService.recordStatsViewed();
    if (result.ok) {
      setSnapshot(result.value.snapshot);
      return;
    }
    await refresh();
  }, [refresh, riderProgressService]);

  useEffect(() => subscribeToRiderProgressRewards((reward) => {
    setRewards((current) => [...current, reward]);
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
        setSnapshot(result.value.snapshot);
      } else {
        await refresh();
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [initialized, refresh, riderProgressService, user?.id]);

  return (
    <RiderProgressContext.Provider value={{ revision, snapshot, loading, refresh, recordStatsViewed }}>
      <View style={styles.root}>
        {children}
        <Toast
          visible={activeReward !== null}
          message={activeReward?.message ?? ""}
          variant="success"
          durationMs={activeReward?.kind === "achievement" ? 3000 : 2400}
          presentation={activeReward?.kind === "achievement" ? "achievement" : "standard"}
          icon={activeReward?.kind === "achievement" ? (
            <SymbolView
              name={{ ios: "trophy.fill", android: "emoji_events", web: "emoji_events" }}
              size={18}
              tintColor={premiumColors.primary}
            />
          ) : undefined}
          onHide={() => setRewards((current) => current.slice(1))}
        />
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

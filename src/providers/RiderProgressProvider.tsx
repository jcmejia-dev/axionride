import {
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
  createRiderProgressService,
  subscribeToRiderProgressRewards,
  type RiderProgressReward,
} from "@/src/services";

import { useAuth } from "./AuthProvider";

type RiderProgressContextValue = {
  readonly revision: number;
};

const RiderProgressContext = createContext<RiderProgressContextValue | null>(null);

export function RiderProgressProvider({ children }: PropsWithChildren) {
  const { initialized } = useAuth();
  const riderProgressService = useMemo(() => createRiderProgressService(), []);
  const [rewards, setRewards] = useState<readonly RiderProgressReward[]>([]);
  const [revision, setRevision] = useState(0);
  const activeReward = rewards[0] ?? null;

  useEffect(() => subscribeToRiderProgressRewards((reward) => {
    setRewards((current) => [...current, reward]);
    setRevision((current) => current + 1);
  }), []);

  useEffect(() => {
    if (!initialized) return;
    void riderProgressService.recordDailyOpen();
  }, [initialized, riderProgressService]);

  return (
    <RiderProgressContext.Provider value={{ revision }}>
      <View style={styles.root}>
        {children}
        <Toast
          visible={activeReward !== null}
          message={activeReward?.message ?? ""}
          variant="success"
          durationMs={activeReward?.kind === "achievement" ? 3000 : 2400}
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

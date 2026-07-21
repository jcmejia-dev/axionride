import { SymbolView } from "expo-symbols";
import { useState, type ReactElement } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/src/components";
import type {
  RiderAchievement,
  RiderAchievementId,
} from "@/src/domain/rider-progress";
import {
  ACHIEVEMENT_ICONS,
  type AchievementSymbolName,
} from "@/src/features/rider-progress/achievementPresentation";
import { palette, radius, spacing, typography } from "@/src/theme";

export type AchievementsGridProps = {
  readonly achievements: readonly RiderAchievement[];
};

export { ACHIEVEMENT_ICONS };

function getProgressForAchievement(
  id: RiderAchievementId,
  achievements: readonly RiderAchievement[],
): { current: number; target: number } | null {
  const achievement = achievements.find((a) => a.id === id);
  if (achievement?.unlocked) return null;

  switch (id) {
    case "first-ride":
      return { current: 0, target: 1 };
    case "ten-rides":
      return { current: 0, target: 10 };
    case "hundred-km-rider":
      return { current: 0, target: 100 };
    case "maintenance-master":
      return { current: 0, target: 5 };
    default:
      return null;
  }
}

export function AchievementsGrid({
  achievements,
}: AchievementsGridProps): ReactElement {
  const [selectedAchievement, setSelectedAchievement] =
    useState<RiderAchievement | null>(null);

  return (
    <GlassCard style={styles.container}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <Text style={styles.sectionSubtitle}>
        {achievements.filter((a) => a.unlocked).length} / {achievements.length}{" "}
        unlocked
      </Text>
      <View style={styles.grid}>
        {achievements.map((achievement) => (
          <AchievementCell
            key={achievement.id}
            achievement={achievement}
            onPress={() => setSelectedAchievement(achievement)}
          />
        ))}
      </View>
      <AchievementDetailModal
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </GlassCard>
  );
}

function AchievementCell({
  achievement,
  onPress,
}: {
  readonly achievement: RiderAchievement;
  readonly onPress: () => void;
}): ReactElement {
  const icon = ACHIEVEMENT_ICONS[achievement.id];
  const progress = achievement.unlocked
    ? null
    : getProgressForAchievement(achievement.id, [achievement]);

  return (
    <Pressable
      accessibilityLabel={`${achievement.title}${achievement.unlocked ? "" : " (locked)"}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        achievement.unlocked ? styles.cellUnlocked : styles.cellLocked,
        pressed && styles.cellPressed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          achievement.unlocked
            ? styles.iconWrapUnlocked
            : styles.iconWrapLocked,
        ]}
      >
        <SymbolView
          name={icon}
          size={22}
          tintColor={
            achievement.unlocked ? palette.accentOrange : palette.textMuted
          }
        />
      </View>
      <Text
        style={[
          styles.cellTitle,
          achievement.unlocked ? styles.textUnlocked : styles.textLocked,
        ]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
      {!achievement.unlocked && progress ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min((progress.current / progress.target) * 100, 100)}%`,
              },
            ]}
          />
        </View>
      ) : null}
      {achievement.unlocked ? (
        <Text style={styles.unlockedLabel}>Unlocked</Text>
      ) : null}
    </Pressable>
  );
}

function AchievementDetailModal({
  achievement,
  onClose,
}: {
  readonly achievement: RiderAchievement | null;
  readonly onClose: () => void;
}): ReactElement {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={achievement !== null}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {achievement ? (
          <GlassCard style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconWrap,
                  achievement.unlocked
                    ? styles.iconWrapUnlocked
                    : styles.iconWrapLocked,
                ]}
              >
                <SymbolView
                  name={ACHIEVEMENT_ICONS[achievement.id]}
                  size={32}
                  tintColor={
                    achievement.unlocked
                      ? palette.accentOrange
                      : palette.textMuted
                  }
                />
              </View>
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                onPress={onClose}
                style={styles.closeButton}
              >
                <SymbolView
                  name={
                    {
                      ios: "xmark",
                      android: "close",
                      web: "close",
                    } as AchievementSymbolName
                  }
                  tintColor={palette.text}
                  size={18}
                />
              </Pressable>
            </View>
            <Text style={styles.modalTitle}>{achievement.title}</Text>
            <Text style={styles.modalDescription}>
              {achievement.description}
            </Text>
            <View
              style={[
                styles.statusBadge,
                achievement.unlocked
                  ? styles.statusBadgeUnlocked
                  : styles.statusBadgeLocked,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  achievement.unlocked
                    ? styles.statusTextUnlocked
                    : styles.statusTextLocked,
                ]}
              >
                {achievement.unlocked ? "Unlocked" : "Locked"}
              </Text>
            </View>
            {achievement.unlockedAt ? (
              <Text style={styles.unlockedDate}>
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            ) : null}
          </GlassCard>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: "rgba(248, 250, 252, 0.58)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: {
    width: "31%",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  cellUnlocked: {
    opacity: 1,
  },
  cellLocked: {
    opacity: 0.5,
  },
  cellPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  iconWrapUnlocked: {
    backgroundColor: "rgba(249, 115, 22, 0.12)",
  },
  iconWrapLocked: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cellTitle: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  textUnlocked: {
    color: palette.text,
  },
  textLocked: {
    color: "rgba(248, 250, 252, 0.4)",
  },
  progressTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "rgba(249, 115, 22, 0.5)",
  },
  unlockedLabel: {
    ...typography.caption,
    fontSize: 10,
    color: palette.success,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    padding: spacing.xl,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 340,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  modalDescription: {
    ...typography.body,
    color: "rgba(248, 250, 252, 0.66)",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusBadgeUnlocked: {
    backgroundColor: "rgba(104, 211, 145, 0.12)",
  },
  statusBadgeLocked: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  statusText: {
    ...typography.label,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusTextUnlocked: {
    color: palette.success,
  },
  statusTextLocked: {
    color: palette.textMuted,
  },
  unlockedDate: {
    ...typography.caption,
    color: "rgba(248, 250, 252, 0.5)",
  },
});

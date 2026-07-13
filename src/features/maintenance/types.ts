import type { MaintenanceType } from "@/src/domain/maintenance";

export type MaintenanceStatus =
  | "Due Soon"
  | "Good"
  | "Overdue"
  | "Completed"
  | "Unknown";

export type MaintenanceOverallStatus = {
  readonly status: MaintenanceStatus;
  readonly nextService: string;
  readonly remainingDistance: string;
  readonly progress: number;
};

export type MaintenanceSummaryItem = {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly accent: "orange" | "success" | "warning" | "danger";
};

export type MaintenanceTask = {
  readonly id: string;
  readonly title: string;
  readonly remainingDistance: string;
  readonly status: MaintenanceStatus;
  readonly type: MaintenanceType;
};

export type MaintenanceTimelineItem = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly completedAt: string;
};

export type MaintenanceData = {
  readonly overallStatus: MaintenanceOverallStatus;
  readonly summary: readonly MaintenanceSummaryItem[];
  readonly upcomingTasks: readonly MaintenanceTask[];
  readonly timeline: readonly MaintenanceTimelineItem[];
};

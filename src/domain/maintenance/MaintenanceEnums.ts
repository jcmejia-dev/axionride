/**
 * Service category for a maintenance task.
 */
export enum MaintenanceType {
  OilChange = 'Oil Change',
  ChainService = 'Chain Service',
  BrakeInspection = 'Brake Inspection',
  TireCheck = 'Tire Check',
  BatteryCheck = 'Battery Check',
  Coolant = 'Coolant',
  GeneralService = 'General Service',
  CustomTask = 'Custom Task',
}

/**
 * Lifecycle status for a maintenance task or reminder.
 */
export enum MaintenanceStatus {
  Upcoming = 'Upcoming',
  DueSoon = 'Due Soon',
  Overdue = 'Overdue',
  Completed = 'Completed',
  Skipped = 'Skipped',
}

/**
 * Priority level used for ordering service attention and future reminders.
 */
export enum MaintenancePriority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
  Critical = 'Critical',
}

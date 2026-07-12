import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  type Maintenance,
} from '@/src/domain/maintenance';
import {
  FuelType,
  MotorcycleCategory,
  TransmissionType,
  type Motorcycle,
} from '@/src/domain/motorcycle';
import {
  isMaintenanceNotificationPayload,
  planMaintenanceReminder,
  type MaintenanceReminderSettings,
} from '@/src/services/notifications/MaintenanceReminderPlanner';
import { DATABASE_MIGRATIONS } from '@/src/storage/sqlite';

/** Framework-neutral contract tests. A future test runner can invoke this suite directly. */
export function runMaintenanceNotificationContractTests() {
  testDateStates();
  testDistanceStates();
  testExcludedRecordsAndDistanceHonesty();
  testDeduplicationContract();
  testWorkspacePayloadIsolation();
  testSettingsMigrationContract();
}

function testDateStates() {
  const dueSoon = planMaintenanceReminder({
    workspaceId: 'workspace-a',
    motorcycle: motorcycle(),
    maintenance: maintenance({ lastServiceDate: '2026-07-05', intervalDays: 14 }),
    settings,
    now: new Date('2026-07-12T10:00:00+08:00'),
  });
  assert(dueSoon?.kind === 'date-due-soon', 'date maintenance inside the threshold is due soon');

  const overdue = planMaintenanceReminder({
    workspaceId: 'workspace-a',
    motorcycle: motorcycle(),
    maintenance: maintenance({ lastServiceDate: '2026-06-20', intervalDays: 14 }),
    settings,
    now: new Date('2026-07-12T10:00:00+08:00'),
  });
  assert(overdue?.kind === 'date-overdue', 'past-due date maintenance is overdue');
}

function testDistanceStates() {
  const dueSoon = planMaintenanceReminder({
    workspaceId: 'workspace-a',
    motorcycle: motorcycle({ odometerKm: 4700 }),
    maintenance: maintenance({ lastServiceOdometerKm: 3000, intervalKm: 2000 }),
    settings,
  });
  assert(dueSoon?.kind === 'distance-due-soon' && dueSoon.triggerDate === null, 'distance due-soon is immediate');

  const overdue = planMaintenanceReminder({
    workspaceId: 'workspace-a',
    motorcycle: motorcycle({ odometerKm: 5080 }),
    maintenance: maintenance({ title: 'Chain service', lastServiceOdometerKm: 3000, intervalKm: 2000 }),
    settings,
  });
  assert(overdue?.kind === 'distance-overdue' && overdue.body.includes('80 km'), 'distance overdue amount uses current odometer');
}

function testExcludedRecordsAndDistanceHonesty() {
  for (const status of [MaintenanceStatus.Completed, MaintenanceStatus.Skipped]) {
    const plan = planMaintenanceReminder({
      workspaceId: 'workspace-a',
      motorcycle: motorcycle({ odometerKm: 9000 }),
      maintenance: maintenance({ status, lastServiceOdometerKm: 0, intervalKm: 1000 }),
      settings,
    });
    assert(plan === null, `${status} records do not notify`);
  }

  const distanceOnly = planMaintenanceReminder({
    workspaceId: 'workspace-a',
    motorcycle: motorcycle({ odometerKm: 100 }),
    maintenance: maintenance({ lastServiceOdometerKm: 0, intervalKm: 1000 }),
    settings,
  });
  assert(distanceOnly === null, 'distance-only records never receive an invented future date');
}

function testDeduplicationContract() {
  const input = {
    workspaceId: 'workspace-a',
    motorcycle: motorcycle({ odometerKm: 5080 }),
    maintenance: maintenance({ lastServiceOdometerKm: 3000, intervalKm: 2000 }),
    settings,
  } as const;
  const first = planMaintenanceReminder(input);
  const repeated = planMaintenanceReminder({ ...input, motorcycle: motorcycle({ odometerKm: 5200 }) });
  assert(first?.signature === repeated?.signature, 'odometer changes do not spam an equivalent overdue state');

  const edited = planMaintenanceReminder({ ...input, maintenance: maintenance({ updatedAt: '2026-07-13T00:00:00.000Z', lastServiceOdometerKm: 3000, intervalKm: 2000 }) });
  assert(first?.signature !== edited?.signature, 'editing maintenance invalidates the prior schedule');
}

function testWorkspacePayloadIsolation() {
  assert(isMaintenanceNotificationPayload({ type: 'maintenance-reminder', maintenanceId: 'task-a', workspaceId: 'workspace-a' }), 'valid payload is accepted');
  assert(!isMaintenanceNotificationPayload({ type: 'maintenance-reminder', maintenanceId: 'task-a' }), 'payload without workspace is rejected');
}

function testSettingsMigrationContract() {
  const migration = DATABASE_MIGRATIONS.find((item) => item.version === 4);
  assert(Boolean(migration), 'notification persistence migration exists');
  const sql = migration!.statements.join('\n');
  assert(sql.includes('maintenance_notification_settings'), 'workspace settings are persisted');
  assert(sql.includes('DEFAULT 500') && sql.includes('DEFAULT 7'), 'safe due-soon defaults are migrated');
  assert(sql.includes('maintenance_notification_state'), 'deduplication metadata is persisted');
  assert(sql.includes('workspace_id'), 'settings and scheduling state are workspace scoped');
}

const settings: MaintenanceReminderSettings = {
  enabled: true,
  dueSoonKm: 500,
  dueSoonDays: 7,
  dailySummaryEnabled: false,
};

function maintenance(overrides: Partial<Maintenance> = {}): Maintenance {
  return {
    id: 'maintenance-a',
    motorcycleId: 'motorcycle-a',
    title: 'Oil Change',
    type: MaintenanceType.OilChange,
    status: MaintenanceStatus.Upcoming,
    priority: MaintenancePriority.Normal,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 'motorcycle-a',
    nickname: 'Skygo Boss 150',
    brand: 'Skygo',
    model: 'Boss 150',
    year: 2025,
    engineCc: 150,
    category: MotorcycleCategory.Naked,
    fuelType: FuelType.Gasoline,
    transmission: TransmissionType.Manual,
    color: 'Black',
    odometerKm: 0,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Maintenance notification contract failed: ${message}`);
}

export const DATABASE_NAME = 'axionride.db';

export const SQLITE_TABLES = {
  schemaMigrations: 'schema_migrations',
  workspaces: 'workspaces',
  appState: 'app_state',
  motorcycles: 'motorcycles',
  maintenanceRecords: 'maintenance_records',
  rides: 'rides',
  ridePoints: 'ride_points',
  syncMetadata: 'sync_metadata',
  maintenanceNotificationSettings: 'maintenance_notification_settings',
  maintenanceNotificationState: 'maintenance_notification_state',
} as const;

export const DEFAULT_ANONYMOUS_WORKSPACE_ID = 'workspace-anonymous';

export const BASE_SCHEMA_SQL = [
  'PRAGMA foreign_keys = ON;',
  'PRAGMA journal_mode = WAL;',
  `CREATE TABLE IF NOT EXISTS ${SQLITE_TABLES.schemaMigrations} (
    version INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );`,
] as const;

export const DOMAIN_SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS ${SQLITE_TABLES.motorcycles} (
    id TEXT PRIMARY KEY NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS ${SQLITE_TABLES.maintenanceRecords} (
    id TEXT PRIMARY KEY NOT NULL,
    motorcycle_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (motorcycle_id) REFERENCES ${SQLITE_TABLES.motorcycles}(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS ${SQLITE_TABLES.rides} (
    id TEXT PRIMARY KEY NOT NULL,
    motorcycle_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (motorcycle_id) REFERENCES ${SQLITE_TABLES.motorcycles}(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS ${SQLITE_TABLES.ridePoints} (
    id TEXT PRIMARY KEY NOT NULL,
    ride_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (ride_id) REFERENCES ${SQLITE_TABLES.rides}(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS ${SQLITE_TABLES.syncMetadata} (
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    sync_status TEXT NOT NULL,
    last_synced_at TEXT,
    remote_updated_at TEXT,
    conflict_json TEXT,
    PRIMARY KEY (entity_type, entity_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_maintenance_records_motorcycle_id
    ON ${SQLITE_TABLES.maintenanceRecords}(motorcycle_id);`,
  `CREATE INDEX IF NOT EXISTS idx_rides_motorcycle_id
    ON ${SQLITE_TABLES.rides}(motorcycle_id);`,
  `CREATE INDEX IF NOT EXISTS idx_ride_points_ride_id_sequence
    ON ${SQLITE_TABLES.ridePoints}(ride_id, sequence);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_metadata_status
    ON ${SQLITE_TABLES.syncMetadata}(sync_status);`,
] as const;

export const WORKSPACE_SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS ${SQLITE_TABLES.workspaces} (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('anonymous', 'authenticated')),
    display_name TEXT NOT NULL,
    external_user_id TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS ${SQLITE_TABLES.appState} (
    singleton_id INTEGER PRIMARY KEY NOT NULL CHECK (singleton_id = 1),
    active_workspace_id TEXT NOT NULL,
    FOREIGN KEY (active_workspace_id) REFERENCES ${SQLITE_TABLES.workspaces}(id)
  );`,
  `INSERT OR IGNORE INTO ${SQLITE_TABLES.workspaces}
    (id, kind, display_name, external_user_id, created_at, updated_at)
    VALUES ('${DEFAULT_ANONYMOUS_WORKSPACE_ID}', 'anonymous', 'Local rider', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
  `INSERT OR IGNORE INTO ${SQLITE_TABLES.appState} (singleton_id, active_workspace_id)
    VALUES (1, '${DEFAULT_ANONYMOUS_WORKSPACE_ID}');`,
  `ALTER TABLE ${SQLITE_TABLES.motorcycles} ADD COLUMN workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_ANONYMOUS_WORKSPACE_ID}';`,
  `ALTER TABLE ${SQLITE_TABLES.motorcycles} ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1));`,
  `ALTER TABLE ${SQLITE_TABLES.maintenanceRecords} ADD COLUMN workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_ANONYMOUS_WORKSPACE_ID}';`,
  `ALTER TABLE ${SQLITE_TABLES.rides} ADD COLUMN workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_ANONYMOUS_WORKSPACE_ID}';`,
  `ALTER TABLE ${SQLITE_TABLES.ridePoints} ADD COLUMN workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_ANONYMOUS_WORKSPACE_ID}';`,
  `ALTER TABLE ${SQLITE_TABLES.syncMetadata} ADD COLUMN workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_ANONYMOUS_WORKSPACE_ID}';`,
  `UPDATE ${SQLITE_TABLES.motorcycles}
    SET is_primary = 1
    WHERE id = (SELECT id FROM ${SQLITE_TABLES.motorcycles}
      WHERE workspace_id = '${DEFAULT_ANONYMOUS_WORKSPACE_ID}' AND deleted_at IS NULL
      ORDER BY created_at ASC LIMIT 1);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_motorcycles_workspace_id_id
    ON ${SQLITE_TABLES.motorcycles}(workspace_id, id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_workspace_id_id
    ON ${SQLITE_TABLES.maintenanceRecords}(workspace_id, id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_rides_workspace_id_id
    ON ${SQLITE_TABLES.rides}(workspace_id, id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_primary_motorcycle_per_workspace
    ON ${SQLITE_TABLES.motorcycles}(workspace_id) WHERE is_primary = 1 AND deleted_at IS NULL;`,
  `CREATE INDEX IF NOT EXISTS idx_maintenance_workspace ON ${SQLITE_TABLES.maintenanceRecords}(workspace_id);`,
  `CREATE INDEX IF NOT EXISTS idx_rides_workspace ON ${SQLITE_TABLES.rides}(workspace_id);`,
  `CREATE INDEX IF NOT EXISTS idx_ride_points_workspace ON ${SQLITE_TABLES.ridePoints}(workspace_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_metadata_workspace ON ${SQLITE_TABLES.syncMetadata}(workspace_id);`,
  `CREATE TRIGGER IF NOT EXISTS maintenance_workspace_insert_guard
    BEFORE INSERT ON ${SQLITE_TABLES.maintenanceRecords}
    WHEN NOT EXISTS (SELECT 1 FROM ${SQLITE_TABLES.motorcycles} m
      WHERE m.id = NEW.motorcycle_id AND m.workspace_id = NEW.workspace_id AND m.deleted_at IS NULL)
    BEGIN SELECT RAISE(ABORT, 'maintenance motorcycle workspace mismatch'); END;`,
  `CREATE TRIGGER IF NOT EXISTS maintenance_workspace_update_guard
    BEFORE UPDATE OF motorcycle_id, workspace_id ON ${SQLITE_TABLES.maintenanceRecords}
    WHEN NOT EXISTS (SELECT 1 FROM ${SQLITE_TABLES.motorcycles} m
      WHERE m.id = NEW.motorcycle_id AND m.workspace_id = NEW.workspace_id AND m.deleted_at IS NULL)
    BEGIN SELECT RAISE(ABORT, 'maintenance motorcycle workspace mismatch'); END;`,
  `CREATE TRIGGER IF NOT EXISTS ride_workspace_insert_guard
    BEFORE INSERT ON ${SQLITE_TABLES.rides}
    WHEN NOT EXISTS (SELECT 1 FROM ${SQLITE_TABLES.motorcycles} m
      WHERE m.id = NEW.motorcycle_id AND m.workspace_id = NEW.workspace_id AND m.deleted_at IS NULL)
    BEGIN SELECT RAISE(ABORT, 'ride motorcycle workspace mismatch'); END;`,
  `CREATE TRIGGER IF NOT EXISTS ride_workspace_update_guard
    BEFORE UPDATE OF motorcycle_id, workspace_id ON ${SQLITE_TABLES.rides}
    WHEN NOT EXISTS (SELECT 1 FROM ${SQLITE_TABLES.motorcycles} m
      WHERE m.id = NEW.motorcycle_id AND m.workspace_id = NEW.workspace_id AND m.deleted_at IS NULL)
    BEGIN SELECT RAISE(ABORT, 'ride motorcycle workspace mismatch'); END;`,
  `CREATE TRIGGER IF NOT EXISTS ride_point_workspace_insert_guard
    BEFORE INSERT ON ${SQLITE_TABLES.ridePoints}
    WHEN NOT EXISTS (SELECT 1 FROM ${SQLITE_TABLES.rides} r
      WHERE r.id = NEW.ride_id AND r.workspace_id = NEW.workspace_id AND r.deleted_at IS NULL)
    BEGIN SELECT RAISE(ABORT, 'ride point workspace mismatch'); END;`,
] as const;

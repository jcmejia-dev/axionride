export const DATABASE_NAME = 'axionride.db';

export const SQLITE_TABLES = {
  schemaMigrations: 'schema_migrations',
  motorcycles: 'motorcycles',
  maintenanceRecords: 'maintenance_records',
  rides: 'rides',
  ridePoints: 'ride_points',
  syncMetadata: 'sync_metadata',
} as const;

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

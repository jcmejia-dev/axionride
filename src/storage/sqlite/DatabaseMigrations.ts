import { DOMAIN_SCHEMA_SQL, WORKSPACE_SCHEMA_SQL } from './DatabaseSchema';
import type { DatabaseMigration } from './SQLiteTypes';

export const DATABASE_MIGRATIONS: readonly DatabaseMigration[] = [
  {
    version: 1,
    name: 'create_offline_foundation_tables',
    statements: DOMAIN_SCHEMA_SQL,
  },
  {
    version: 2,
    name: 'add_local_workspace_isolation',
    statements: WORKSPACE_SCHEMA_SQL,
  },
  {
    version: 3,
    name: 'add_local_profile_customization',
    statements: [
      `ALTER TABLE workspaces ADD COLUMN profile_nickname TEXT;`,
      `ALTER TABLE workspaces ADD COLUMN profile_image_uri TEXT;`,
    ],
  },
  {
    version: 4,
    name: 'add_workspace_maintenance_notifications',
    statements: [
      `CREATE TABLE IF NOT EXISTS maintenance_notification_settings (
        workspace_id TEXT PRIMARY KEY NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        due_soon_km INTEGER NOT NULL DEFAULT 500,
        due_soon_days INTEGER NOT NULL DEFAULT 7,
        daily_summary_enabled INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS maintenance_notification_state (
        workspace_id TEXT NOT NULL,
        maintenance_id TEXT NOT NULL,
        notification_kind TEXT NOT NULL,
        identifier TEXT NOT NULL,
        state_signature TEXT NOT NULL,
        scheduled_for TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY(workspace_id, maintenance_id, notification_kind),
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_maintenance_notification_state_workspace
        ON maintenance_notification_state(workspace_id);`,
    ],
  },
] as const;

export const CURRENT_DATABASE_VERSION = DATABASE_MIGRATIONS.reduce(
  (currentVersion, migration) => Math.max(currentVersion, migration.version),
  0,
);

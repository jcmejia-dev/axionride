import { DAILY_RIDE_CHALLENGE_SCHEMA_SQL, DOMAIN_SCHEMA_SQL, RIDER_PROGRESS_SCHEMA_SQL, RIDE_SCORE_PROGRESS_SCHEMA_SQL, WORKSPACE_SCHEMA_SQL } from './DatabaseSchema';
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
    name: 'add_local_rider_progress',
    statements: RIDER_PROGRESS_SCHEMA_SQL,
  },
  {
    version: 5,
    name: 'add_local_ride_score_progress',
    statements: RIDE_SCORE_PROGRESS_SCHEMA_SQL,
  },
  {
    version: 6,
    name: 'add_daily_ride_challenges',
    statements: DAILY_RIDE_CHALLENGE_SCHEMA_SQL,
  },
] as const;

export const CURRENT_DATABASE_VERSION = DATABASE_MIGRATIONS.reduce(
  (currentVersion, migration) => Math.max(currentVersion, migration.version),
  0,
);

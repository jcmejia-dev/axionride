import { DOMAIN_SCHEMA_SQL } from './DatabaseSchema';
import type { DatabaseMigration } from './SQLiteTypes';

export const DATABASE_MIGRATIONS: readonly DatabaseMigration[] = [
  {
    version: 1,
    name: 'create_offline_foundation_tables',
    statements: DOMAIN_SCHEMA_SQL,
  },
] as const;

export const CURRENT_DATABASE_VERSION = DATABASE_MIGRATIONS.reduce(
  (currentVersion, migration) => Math.max(currentVersion, migration.version),
  0,
);

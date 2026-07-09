import type { SQLiteBindParams as ExpoSQLiteBindParams, SQLiteBindValue as ExpoSQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

/**
 * Shared SQLite database handle type used by storage infrastructure.
 */
export type AxionRideDatabase = SQLiteDatabase;

/**
 * SQLite bind value supported by Expo SQLite parameterized queries.
 */
export type SQLiteBindValue = ExpoSQLiteBindValue;

/**
 * Named bind parameters for parameterized SQLite statements.
 */
export type SQLiteBindParams = ExpoSQLiteBindParams;

/**
 * Schema migration registered by the local database foundation.
 */
export type DatabaseMigration = {
  /** Monotonic schema version applied by this migration. */
  readonly version: number;

  /** Short developer-facing migration name. */
  readonly name: string;

  /** Static SQL statements for this migration. */
  readonly statements: readonly string[];
};

/**
 * Row shape stored in the internal migration tracking table.
 */
export type SchemaVersionRow = {
  readonly version: number;
};

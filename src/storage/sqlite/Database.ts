import * as SQLite from 'expo-sqlite';

import { CURRENT_DATABASE_VERSION, DATABASE_MIGRATIONS } from './DatabaseMigrations';
import { BASE_SCHEMA_SQL, DATABASE_NAME, SQLITE_TABLES } from './DatabaseSchema';
import type { AxionRideDatabase, SchemaVersionRow, SQLiteBindParams, SQLiteBindValue } from './SQLiteTypes';

let databasePromise: Promise<AxionRideDatabase> | null = null;

/**
 * Open the AxionRide SQLite database and apply pending schema migrations.
 */
export async function initializeDatabase() {
  const database = await getDatabase();
  await runMigrations(database);
  return database;
}

/**
 * Get a shared database handle for this JS runtime.
 *
 * This helper centralizes database opening but does not make repositories or UI
 * depend on SQLite directly.
 */
export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
}

/**
 * Run a callback with an initialized database handle.
 */
export async function withDatabase<T>(operation: (database: AxionRideDatabase) => Promise<T>) {
  const database = await initializeDatabase();
  return operation(database);
}

/**
 * Execute a parameterized write statement against an initialized database.
 */
export async function runStatement(sql: string, params: SQLiteBindParams = []) {
  return withDatabase((database) => database.runAsync(sql, params));
}

/**
 * Fetch the first row for a parameterized query.
 */
export async function getFirst<Row>(
  sql: string,
  params: SQLiteBindParams = [],
) {
  return withDatabase((database) => database.getFirstAsync<Row>(sql, params));
}

/**
 * Fetch all rows for a parameterized query.
 */
export async function getAll<Row>(
  sql: string,
  params: SQLiteBindParams = [],
) {
  return withDatabase((database) => database.getAllAsync<Row>(sql, params));
}

/**
 * Return the latest applied schema version.
 */
export async function getCurrentSchemaVersion(database: AxionRideDatabase) {
  const row = await database.getFirstAsync<SchemaVersionRow>(
    `SELECT MAX(version) AS version FROM ${SQLITE_TABLES.schemaMigrations};`,
  );

  return row?.version ?? 0;
}

async function runMigrations(database: AxionRideDatabase) {
  await database.execAsync(BASE_SCHEMA_SQL.join('\n'));

  const currentVersion = await getCurrentSchemaVersion(database);
  const pendingMigrations = DATABASE_MIGRATIONS.filter((migration) => migration.version > currentVersion);

  for (const migration of pendingMigrations) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.statements.join('\n'));
      await database.runAsync(
        `INSERT INTO ${SQLITE_TABLES.schemaMigrations} (version, name, applied_at)
         VALUES (?, ?, ?);`,
        migration.version,
        migration.name,
        new Date().toISOString(),
      );
    });
  }
}

export { CURRENT_DATABASE_VERSION };

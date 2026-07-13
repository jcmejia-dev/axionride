# AxionRide Database

## Purpose

AxionRide uses `expo-sqlite` as its offline source of truth. Application screens call services, services call repository interfaces, and the default runtime repositories use `axionride.db`. Supabase remains a future sync target and is not part of the current storage path.

## Data Philosophy

AxionRide should be designed as an offline-first application. Rider and motorcycle data must remain available when network coverage is poor or unavailable.

## Current Schema

Migration 1 creates `motorcycles`, `maintenance_records`, `rides`, `ride_points`, `sync_metadata`, and `schema_migrations`.

Migration 2 creates `workspaces` and `app_state`, creates a stable `workspace-anonymous` workspace, and adds `workspace_id` to every owned table. It also adds `is_primary` to motorcycles, enforces one live primary motorcycle per workspace, and installs relationship guards so maintenance, rides, and ride points cannot reference records in another workspace.

Migration 3 adds optional local profile customization fields to workspaces.

Migration 4 adds workspace-scoped `rider_progress`, `rider_progress_events`, and `rider_achievements` tables. XP events use a workspace-and-event composite key so completion retries and repeated daily actions cannot award XP twice. Progress remains local and is not synced to Supabase.

The active workspace is the local isolation boundary. Repositories resolve it for every read and write; screens never query SQLite directly. A workspace may later hold an external authentication user ID, but the local schema does not depend on a specific authentication provider.

Supabase Auth user IDs are stored only as `workspaces.external_user_id` mappings. They select local isolation boundaries; they do not make Supabase a storage source and do not upload local records.

## Existing Data Migration

Migration 2 runs inside the database migration transaction. Existing motorcycles, maintenance records, rides, ride points, and sync metadata are assigned to the stable anonymous workspace. The oldest live motorcycle becomes primary. No record is uploaded or deleted.

Migration application is idempotent through `schema_migrations`: once version 2 is recorded, subsequent startup initialization skips it. If migration fails, its exclusive transaction rolls back and the version is not recorded.

Before shipping a schema downgrade or replacing this migration, preserve a copy of the app database or export an AxionRide backup. SQLite `ALTER TABLE ... ADD COLUMN` is not automatically reversible. A rollback build should continue understanding schema version 2 or explicitly rebuild tables from a verified backup.

## Backup Boundaries

Backup format version 2 contains workspace metadata and only records visible to the active workspace. Restore clears and replaces only that active workspace. Version 1 backups lack ownership metadata and are rejected with an incompatibility message; they are not silently assigned or imported.

## Future Data Domains

- Users and authentication profiles
- Garages
- Motorcycles
- Ride sessions and route points
- Fuel logs
- Maintenance logs
- Service history
- Notification preferences
- Sync metadata
- OBD-II readings
- Marketplace and community records

## Modeling Guidelines

- Use stable identifiers for all syncable records.
- Track created and updated timestamps consistently.
- Track deletion state when records need to sync across devices.
- Avoid storing derived data unless it improves performance or preserves history.
- Treat location, vehicle, and account data as sensitive.

## Open Decisions

- Conflict resolution strategy.
- Data retention and export policy.
- Whether future authentication claims the anonymous workspace in place or copies it into a newly created authenticated workspace. The operation must require an explicit user decision.

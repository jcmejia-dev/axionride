# AxionRide Database

## Purpose

AxionRide uses `expo-sqlite` as its offline source of truth. Application screens call services, services call repository interfaces, and the default runtime repositories use `axionride.db`. Supabase remains a future sync target and is not part of the current storage path.

## Data Philosophy

AxionRide should be designed as an offline-first application. Rider and motorcycle data must remain available when network coverage is poor or unavailable.

## Current Schema

Migration 1 creates `motorcycles`, `maintenance_records`, `rides`, `ride_points`, `sync_metadata`, and `schema_migrations`.

Migration 2 creates `workspaces` and `app_state`, creates a stable `workspace-anonymous` workspace, and adds `workspace_id` to every owned table. It also adds `is_primary` to motorcycles, enforces one live primary motorcycle per workspace, and installs relationship guards so maintenance, rides, and ride points cannot reference records in another workspace.

Migration 3 adds workspace-local profile customization fields.

Migration 4 creates `maintenance_notification_settings` and `maintenance_notification_state`. Reminder preferences and operating-system schedule identifiers are keyed by `workspace_id`; they do not contain cloud data or notification tokens. The migration defaults reminders to disabled, with due-soon thresholds of 500 km and 7 days. Existing rider records are unchanged.

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
- Additional notification preferences beyond local maintenance reminders
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

# AxionRide Project Blueprint

## Product Vision

AxionRide is a motorcycle companion app for riders who want one dependable place to manage motorcycles, maintenance, fuel usage, ride history, navigation context, and performance insights.

The long-term product direction is offline-first, privacy-aware, and rider-focused. Core ownership data should remain useful without a network connection, then sync safely when cloud services are available.

## MVP Scope

The MVP should prove the core ownership workflow before advanced ride features:

- Branded app shell with Expo Router.
- Garage with motorcycle profiles.
- Maintenance records and reminders.
- Fuel logs.
- Settings for app preferences.
- Local-first data model.
- Basic Supabase account and sync planning before cloud implementation.

The MVP should not include AI, marketplace, community, OBD-II, complex analytics, or background ride tracking until the core local data model is stable.

## Feature Phases

### Phase 0: Foundation

- Branding, documentation, architecture boundaries, theme tokens, and route structure.
- No production business logic beyond placeholders.

### Phase 1: Garage MVP

- Motorcycle list.
- Motorcycle detail.
- Add/edit motorcycle profile.
- Basic fields: nickname, make, model, year, odometer, VIN optional, notes optional.

### Phase 2: Ownership Logs

- Maintenance logs.
- Fuel logs.
- Service history.
- Basic reminder rules.
- Search and filtering.

### Phase 3: Local Persistence

- SQLite schema.
- Local repositories.
- Migration strategy.
- Import/export planning.

### Phase 4: Accounts And Sync

- Authentication.
- Supabase project setup.
- User-owned rows and policies.
- Offline sync queue.
- Conflict handling.

### Phase 5: Ride Experience

- Speedometer.
- GPS maps.
- Ride tracking.
- Ride summaries.
- Battery and permission safeguards.

### Phase 6: Intelligence And Connected Features

- AI assistant.
- OBD-II integration.
- Weather-aware riding context.
- Advanced maintenance suggestions.

## Screen List

Initial screens:

- Home
- Garage
- Motorcycle Detail
- Add Motorcycle
- Edit Motorcycle
- Maintenance
- Maintenance Detail
- Add Maintenance Record
- Fuel Log
- Add Fuel Record
- Settings

Planned ride screens:

- Ride Dashboard
- Speedometer
- Map
- Active Ride
- Ride Summary
- Ride History

Planned account and sync screens:

- Sign In
- Create Account
- Account
- Sync Status

Planned future screens:

- AI Assistant
- OBD-II Devices
- Weather
- Export Data

## Navigation Plan

Expo Router remains the routing foundation.

Planned top-level tabs:

- Home
- Garage
- Maintenance
- Fuel
- Rides
- Settings

Implementation rules:

- `app/` contains route files and route layouts only.
- Route files should compose feature screens from `src/features/`.
- Business logic, persistence, validation, and service calls should not live directly in route files.
- Modal routes may be used for add/edit flows when they improve mobile ergonomics.

## Database Plan

SQLite is planned as the local source of truth for MVP ownership data.

Initial local tables:

- `motorcycles`
- `maintenance_records`
- `maintenance_reminders`
- `fuel_records`
- `ride_records`
- `ride_points`
- `sync_queue`
- `sync_metadata`

Common columns:

- `id`
- `created_at`
- `updated_at`
- `deleted_at`
- `sync_status`
- `remote_id`

Database rules:

- Use migrations.
- Keep schema changes documented.
- Prefer repository functions over direct database access from UI.
- Use soft deletes when records may need cloud sync reconciliation.

## Offline-First Strategy

AxionRide should work without network access for core ownership workflows.

Rules:

- Local reads come from SQLite.
- Local writes complete before cloud sync.
- Sync runs after local persistence, not before it.
- Failed sync attempts should be retryable.
- Users should be able to understand whether data is local, syncing, synced, or conflicted.
- Core data should not disappear because a session expires or network access fails.

## Supabase Sync Plan

Supabase is planned for authentication, cloud storage, and sync.

Planned Supabase responsibilities:

- User authentication.
- Row-level security.
- Remote ownership records.
- Optional file storage for receipts or motorcycle images.
- Sync timestamps and conflict metadata.

Sync approach:

- Local SQLite remains the app's working data source.
- Supabase acts as backup and cross-device sync.
- Local records use stable UUIDs.
- Each synced table should include user ownership, timestamps, deletion markers, and version metadata.
- Sync should be incremental where practical.
- Conflict resolution rules must be documented before production sync ships.

## Authentication Plan

Authentication is planned after the local MVP shape is clear.

Initial auth requirements:

- Email-based account flow or provider-based auth selected after product validation.
- Secure session handling.
- Clear signed-in, signed-out, and offline session states.
- No auth requirement for purely local draft data unless a product decision requires it.

Rules:

- Do not add authentication until the task explicitly asks for it.
- Do not block local-only workflows behind auth prematurely.
- Treat account data, location data, and vehicle data as sensitive.

## Garage Feature Plan

Garage is the core MVP feature.

Planned capabilities:

- View motorcycles.
- Add motorcycle.
- Edit motorcycle.
- Archive or delete motorcycle.
- Track odometer.
- Store notes and identifiers.
- Show maintenance and fuel summary per motorcycle.

Data fields:

- Nickname
- Make
- Model
- Year
- Odometer
- VIN optional
- Plate optional
- Notes optional

## Maintenance Feature Plan

Maintenance should help riders track work already done and upcoming service needs.

Planned capabilities:

- Add service record.
- Edit service record.
- Attach motorcycle.
- Track date, odometer, category, cost, provider, and notes.
- Create reminder by date or mileage.
- Mark reminder complete.

Initial categories:

- Oil
- Tires
- Chain
- Brakes
- Battery
- Inspection
- Other

## Fuel Log Feature Plan

Fuel logs should help riders understand cost and consumption.

Planned capabilities:

- Add fuel record.
- Track motorcycle, date, odometer, volume, price, full tank flag, and notes.
- Calculate simple consumption after enough data exists.
- Filter records by motorcycle.

Rules:

- Keep units configurable later.
- Avoid complex analytics until data quality is reliable.

## Ride Tracking Plan

Ride tracking is planned after Garage, Maintenance, Fuel, and local persistence.

Planned capabilities:

- Start ride.
- Pause/resume ride.
- End ride.
- Save route points.
- Save summary: distance, duration, average speed, max speed.

Rules:

- Do not add ride tracking before permissions, battery impact, and offline behavior are designed.
- Do not start background tracking without explicit user consent.

## Speedometer Plan

Speedometer is planned as part of the ride experience.

Planned capabilities:

- Current speed.
- Unit preference.
- Ride duration.
- Distance.
- GPS signal state.

Rules:

- Must show permission and signal states clearly.
- Must avoid implying precision when GPS accuracy is poor.

## Maps/GPS Plan

Maps and GPS are planned for route capture, ride review, and navigation context.

Planned capabilities:

- Permission request flow.
- Current location display.
- Ride route preview.
- Saved route review.

Rules:

- Request location permissions only when needed.
- Explain why location is needed.
- Handle denied, limited, unavailable, and background states.
- Keep GPS functionality usable with intermittent connectivity where possible.

## Settings Plan

Settings should support core app preferences and trust controls.

Planned settings:

- Theme preference.
- Distance unit.
- Fuel unit.
- Currency.
- Notification preference.
- Data export.
- Sync status.
- Account management after auth exists.
- Privacy and permission status.

## AI Assistant Future Plan

The AI assistant is a future feature, not an MVP requirement.

Possible capabilities:

- Explain maintenance records.
- Suggest service intervals.
- Summarize ownership costs.
- Help interpret symptoms.
- Prepare ride or maintenance checklists.

Rules:

- AI must not replace professional mechanical advice.
- AI should cite the user's own records when making record-based claims.
- Sensitive motorcycle, location, and account data must be handled deliberately.
- Do not add AI dependencies or API calls until explicitly approved.

## Branch Roadmap

Suggested branch sequence:

- `feature/app-branding`
- `docs/project-blueprint`
- `feature/theme-system`
- `feature/garage-ui`
- `feature/garage-local-model`
- `feature/maintenance-ui`
- `feature/fuel-log-ui`
- `feature/sqlite-persistence`
- `feature/supabase-auth`
- `feature/supabase-sync`
- `feature/ride-dashboard`
- `feature/maps-gps`
- `feature/ai-assistant-planning`

Branch rules:

- Keep each branch focused.
- Do not mix infrastructure, UI, data, and docs unless the task requires it.
- Run validation before merging.
- Update docs when architecture, data, or workflow decisions change.

## Rules For Future Codex Prompts

Future Codex prompts should state:

- Current branch.
- Exact goal.
- Files or areas allowed to change.
- Explicit forbidden actions.
- Whether package changes are allowed.
- Required validation commands.
- Expected final summary.

Prompt rules:

- For documentation tasks, say "Do not change app code."
- For UI tasks, say whether behavior changes are allowed.
- For data tasks, say whether database schema changes are allowed.
- For package tasks, explicitly authorize installs and package changes.
- For Expo-specific tasks, require checking Expo SDK 57 docs first.
- Always preserve Expo Router unless a documented architecture decision says otherwise.
- Always distinguish planned features from implemented features.

# AxionRide AI Engineering Constitution

## Project Identity

AxionRide is an Expo React Native TypeScript application for motorcycle ownership, riding, maintenance, service history, and connected riding workflows. It is in a foundation stage and must stay clean, modular, and ready for offline-first production features.

AI assistants must optimize for correctness, maintainability, and user trust. Do not add product behavior unless the task explicitly asks for it.

## Stack

- Expo SDK 57.
- Expo Router.
- React Native.
- React 19.
- TypeScript.
- Planned local storage: SQLite.
- Planned cloud sync: Supabase.

Before writing code that depends on Expo behavior, read the exact Expo SDK 57 documentation at `https://docs.expo.dev/versions/v57.0.0/`.

## Architecture Rules

- Keep application code modular and feature-oriented.
- Keep route files thin.
- Keep business logic out of `app/` route files.
- Put reusable code under `src/`.
- Group feature code by domain under `src/features/`.
- Share code only when reuse is real, not speculative.
- Avoid large rewrites unless the task explicitly requests them.
- Prefer small, reviewable changes with clear boundaries.

## Expo Router Rules

- Do not remove Expo Router.
- Do not delete or rename `app/` unless explicitly requested.
- `app/` is for Expo Router route files and route layouts only.
- Do not put services, stores, database logic, API clients, validation schemas, or shared utilities directly in `app/`.
- Route files may compose feature components, providers, and hooks from `src/`.
- Navigation helpers that are not route files belong in `src/navigation/`.

## `src/` Folder Rules

- `src/api/`: API clients and request helpers.
- `src/components/`: reusable presentational components.
- `src/config/`: configuration helpers.
- `src/constants/`: stable constants.
- `src/database/`: local database schema, migrations, and persistence helpers.
- `src/features/`: domain feature modules.
- `src/hooks/`: reusable hooks.
- `src/lib/`: low-level adapters and infrastructure helpers.
- `src/navigation/`: navigation helpers outside route files.
- `src/providers/`: application-level context providers.
- `src/services/`: integrations and platform services.
- `src/store/`: state management boundaries.
- `src/theme/`: design tokens and theme helpers.
- `src/types/`: shared TypeScript types.
- `src/utils/`: pure utilities.
- `src/validation/`: validation schemas and helpers.

Do not create new root-level application folders when a `src/` folder already exists for that concern.

## TypeScript Rules

- Keep TypeScript strict.
- Prefer explicit domain types over `any`.
- Do not silence type errors with broad casts unless there is a documented boundary reason.
- Keep shared types in `src/types/` or inside the owning feature.
- Use type-only imports where appropriate.
- Run `npx.cmd tsc --noEmit` after changes that affect imports, types, or architecture.

## UI Rules

- Do not redesign screens unless explicitly asked.
- Do not change visual behavior during architecture, documentation, or governance work.
- Keep screens thin and composed from reusable components or feature modules.
- Preserve accessibility expectations for touch targets, labels, contrast, loading states, and error states.
- UI changes must include screenshots or clear validation notes when practical.

## Offline-First Rules

- AxionRide is planned as an offline-first app.
- Local writes should be designed to succeed before network sync.
- Sync should be explicit, observable, retryable, and conflict-aware.
- Do not introduce cloud-only flows for core rider data without documenting offline behavior.
- Model loading, empty, error, offline, and conflict states before production release.

## State Management Rules

- Keep local UI state close to the component that owns it.
- Keep feature state inside the owning feature when possible.
- Promote state to shared stores only when multiple features need it.
- Do not introduce a global state library without a documented need.
- Do not mix server sync state, local database state, and transient UI state without clear boundaries.

## Database Rules

- SQLite is planned for local storage.
- Supabase is planned for cloud sync and backend services.
- Database schema changes must be documented.
- Migrations must be reviewable and reversible where practical.
- Do not store secrets in local database records.
- Do not assume network availability for reads or writes that should work offline.

## Security Rules

- Never commit secrets, tokens, private keys, service-role keys, or production credentials.
- Use environment/config boundaries for sensitive values.
- Treat location, ride history, vehicle data, and account data as sensitive.
- Request platform permissions only when needed and explain the user value.
- Validate external input at system boundaries.
- Prefer least-privilege access for backend policies and service calls.

## Testing Rules

- Run the most relevant checks before completing work.
- For architecture or import changes, run `npx.cmd tsc --noEmit`.
- For Expo project health, run `npx.cmd expo-doctor`.
- Add or update tests when behavior changes or risk warrants it.
- If a requested validation command cannot run, report the exact reason.

## Git Workflow Rules

- Keep work on focused branches.
- Use `main` as the stable baseline.
- Use `develop` only when active integration work requires it.
- Use feature, fix, docs, chore, hotfix, and release branch prefixes.
- Keep commits small and descriptive.
- Do not mix unrelated refactors with feature work.
- Do not rewrite shared history unless explicitly approved.
- Do not run destructive Git commands unless explicitly requested.

## Documentation Rules

- Update docs when architecture, workflow, setup, security, data, or behavior changes.
- Keep docs practical and current.
- Document decisions and constraints, not just outcomes.
- Prefer direct language over speculative roadmaps.
- If docs and code disagree, either fix the mismatch or report it clearly.

## Forbidden Actions

AI assistants must not:

- Install packages unless explicitly requested.
- Run `npm install` unless explicitly requested.
- Run `npm audit fix`.
- Modify `package.json` unless the task explicitly requires it.
- Delete Expo Router.
- Delete or repurpose `app/`.
- Move `assets/` unless explicitly requested.
- Create app features during governance, architecture, or documentation tasks.
- Change app behavior during documentation-only tasks.
- Touch `node_modules/`.
- Commit secrets.
- Perform broad rewrites when a scoped change will solve the task.

## AI Response Requirements

After making changes, AI assistants must summarize:

- Files updated.
- Key changes made.
- Commands run.
- Validation results.
- Remaining warnings or errors.

If validation fails, distinguish between pre-existing project issues, environment issues, and issues caused by the change.

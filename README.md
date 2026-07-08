# AxionRide

AxionRide is a modern motorcycle companion application built with Expo React Native and TypeScript. The project is in its foundation stage and is structured to support a long-term production roadmap without prematurely introducing business logic.

## Goals

- Help riders manage motorcycles, rides, maintenance, fuel usage, and service history.
- Support offline-first workflows for unreliable network conditions.
- Preserve a modular architecture that can grow into authentication, cloud sync, maps, weather, AI assistance, OBD-II integration, community, and marketplace features.
- Keep the codebase maintainable, typed, documented, and reviewable.

## Tech Stack

- Expo SDK 57
- Expo Router
- React Native
- React
- TypeScript
- Git and GitHub

Expo SDK 57 targets React Native 0.86, React 19.2.3, and Node.js 22.13.x according to the Expo SDK 57 versioned documentation.

## Folder Structure

```text
app/                    Expo Router routes and layouts
assets/                 Fonts, images, icons, and static assets
docs/                   Project planning and engineering documentation
src/
  api/                  API client boundaries and request helpers
  components/           Reusable application components
  config/               Runtime and build-time configuration helpers
  constants/            Stable application constants
  database/             Local database schema, migrations, and persistence helpers
  features/             Domain-focused feature modules
  hooks/                Reusable React hooks
  lib/                  Low-level adapters and infrastructure helpers
  navigation/           Navigation helpers outside Expo Router route files
  providers/            Application-level context providers
  services/             Service and integration boundaries
  store/                State management boundaries
  theme/                Design tokens and theme helpers
  types/                Shared TypeScript types
  utils/                Pure utility functions
  validation/           Validation schemas and helpers
scripts/                Project automation scripts
supabase/               Supabase configuration, migrations, and edge functions
.github/                GitHub issue and pull request templates
```

## Development Workflow

1. Create a focused branch from `main`.
2. Keep changes scoped to one concern.
3. Preserve Expo Router and the existing app structure.
4. Update documentation when architecture, behavior, or workflows change.
5. Open a pull request using the project template.

## How to Run

Install dependencies if needed:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

Run on a target platform:

```bash
npm run android
npm run ios
npm run web
```

## Roadmap

The high-level roadmap is documented in [docs/ROADMAP.md](docs/ROADMAP.md). The detailed product and implementation blueprint is documented in [docs/PROJECT_BLUEPRINT.md](docs/PROJECT_BLUEPRINT.md). Planned areas include authentication, garage management, motorcycle profiles, ride tracking, GPS, speedometer, fuel logs, maintenance logs, service history, notifications, offline-first persistence, cloud sync, AI assistance, OBD-II integration, weather, maps, community, and marketplace.

## Documentation

- [Project Bible](docs/PROJECT_BIBLE.md)
- [Project Blueprint](docs/PROJECT_BLUEPRINT.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [UI Guidelines](docs/UI_GUIDELINES.md)
- [Changelog](docs/CHANGELOG.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Git Workflow](docs/GIT_WORKFLOW.md)

## License

This project currently includes an MIT license file. Confirm final ownership and licensing terms before public distribution.

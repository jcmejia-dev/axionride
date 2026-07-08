# AxionRide Architecture

## Overview

AxionRide is an Expo React Native application using Expo SDK 57, Expo Router, and TypeScript. The architecture should remain modular, feature-oriented, and ready for offline-first mobile workflows.

## Routing

Expo Router owns navigation through the existing `app/` directory. The `app/` directory should contain route files and route layouts only. Future routing changes should be made deliberately and documented before implementation. The router should not be replaced.

## Source Organization

Reusable application code lives under `src/`:

- `src/api/`: API client boundaries and request helpers.
- `src/components/`: reusable presentational components.
- `src/config/`: runtime and build-time configuration helpers.
- `src/constants/`: stable application constants.
- `src/database/`: local database schema, migrations, and persistence helpers.
- `src/features/`: domain-specific feature modules.
- `src/hooks/`: reusable React hooks.
- `src/lib/`: low-level adapters and infrastructure helpers.
- `src/navigation/`: navigation helpers that are not Expo Router route files.
- `src/providers/`: application-level context providers.
- `src/services/`: integrations, platform services, and external API clients.
- `src/store/`: state management boundaries.
- `src/theme/`: design tokens and theme helpers.
- `src/types/`: shared TypeScript types.
- `src/utils/`: pure utility functions.
- `src/validation/`: validation schemas and validation helpers.

Supporting project folders:

- `assets/`: fonts, images, icons, and static assets.
- `docs/`: project planning and engineering documentation.
- `scripts/`: project automation scripts.
- `supabase/`: Supabase configuration, migrations, and edge functions when introduced.

## Feature Boundaries

Each future feature should own its UI, local state, validation, and feature-specific types where practical. Cross-feature behavior should move into `src/services`, `src/store`, or `src/lib` only when reuse is proven.

## Data Direction

The intended long-term data direction is offline-first:

- Local writes should feel immediate.
- Sync should be explicit, observable, and resilient.
- Conflicts should be modeled before cloud sync is shipped.
- Platform permissions should be requested only when needed.

## Quality Standards

- TypeScript should be strict enough to protect domain contracts.
- Complex behavior should have tests before release.
- Architectural decisions should be documented in `docs/`.
- Production features should include error, loading, empty, and offline states.

# AxionRide Project Bible

## Purpose

AxionRide is a modern motorcycle companion application built with Expo React Native and TypeScript. The product vision is to help riders manage their motorcycles, rides, maintenance, fuel usage, service records, and connected riding context from one dependable mobile experience.

## Product Principles

- Rider safety comes before engagement.
- Offline capability is a core requirement, not an enhancement.
- Data must be portable, auditable, and recoverable.
- Features should be modular so the app can grow without becoming tightly coupled.
- User trust depends on clear permissions, predictable sync, and transparent data handling.

## Long-Term Feature Areas

- Authentication and account management
- Garage and motorcycle profiles
- Ride tracking, GPS, speedometer, and maps
- Fuel logs, maintenance logs, and service history
- Notifications and reminders
- Offline-first local data with cloud sync
- AI assistant for rider and maintenance support
- OBD-II integration
- Weather-aware riding context
- Community and marketplace capabilities

## Engineering Principles

- Preserve Expo Router as the routing foundation.
- Keep `app/` focused on Expo Router routes and route layouts.
- Keep reusable application code under `src/`.
- Keep feature code isolated by domain.
- Prefer typed boundaries between UI, services, data, and platform APIs.
- Introduce dependencies only when they solve a confirmed production need.
- Write documentation before large architectural changes.
- Make risky changes small, reviewable, and reversible.

## Current Foundation

The project currently uses Expo SDK 57, Expo Router, React Native, TypeScript, Git, and GitHub. This foundation intentionally avoids business logic until product requirements and data contracts are defined.

## Product Blueprint

The detailed product scope, feature phases, screen plan, data plan, sync strategy, and future Codex prompt rules are documented in [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md).

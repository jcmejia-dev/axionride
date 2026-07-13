# Rider Progress

## Purpose

Rider Progress rewards consistent ownership and riding habits without introducing currencies, leaderboards, loot, or competitive mechanics. All state remains local and workspace-scoped in SQLite.

## XP and Levels

| Activity | XP | Idempotency |
| --- | ---: | --- |
| Complete a ride | 5 | Once per ride ID |
| Complete maintenance | 10 | Once per maintenance ID |
| Open AxionRide on a local calendar day | 2 | Once per day |
| View dashboard ride statistics | 1 | Once per day |

The rider level is `floor(totalXp / 100) + 1`. Current-level XP is `totalXp % 100`, so the dashboard can render a stable 0–100 progress bar without recalculating activity history.

## Achievements

- **First Ride:** at least one completed ride.
- **10 Rides:** at least 10 completed rides.
- **100 KM Rider:** completed ride distance totals at least 100 km.
- **Maintenance Master:** at least five completed maintenance records.

Definitions and unlock state are persisted. Achievement checks run after progress events and when an uncached snapshot is loaded, allowing existing local history to unlock achievements after the feature is introduced.

## Streaks

Dates use the device's local calendar. The first daily open starts a one-day streak, activity on the following date increments it, a gap of more than one day resets it to one, and repeated opens on the same date do not change it.

## Storage

Migration 4 adds:

- `rider_progress`: total XP, streak count, and last active date per workspace.
- `rider_progress_events`: an idempotent local XP ledger.
- `rider_achievements`: titles, descriptions, unlock flags, and unlock timestamps.

No backend sync is performed. The service keeps a short in-memory snapshot cache, while SQLite remains the source of truth.

## Reward Delivery

Successful new XP events and achievement unlocks publish local reward events. `RiderProgressProvider` queues these events and renders them through the existing animated bottom toast. Failure to update progress is logged but never rolls back a successfully saved ride or maintenance record.

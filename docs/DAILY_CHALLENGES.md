# Daily Ride Challenges

## Purpose

Daily Ride Challenges encourage consistent riding habits without changing tracking or Ride Score rules. Generation, progress, and rewards work offline and remain scoped to the active local workspace.

## Daily generation

The device's local `YYYY-MM-DD` date deterministically selects one of four definitions. Reopening the app on the same date produces the same challenge; a new local date creates a new row.

- **Smooth Operator:** maintain a moving pace without speed changes above 12 km/h per second for three continuous minutes.
- **Keep Rolling:** ride for five continuous minutes without speed remaining below 2 km/h for the existing five-second stop confirmation window.
- **Steady Twenty:** remain at or above 20 km/h for two continuous minutes.
- **Flow State:** record at least three minutes with speed below 10 km/h accounting for no more than 15% of evaluated time.

## Runtime progress

The evaluator observes the already-filtered foreground route points after they are accepted by `RideService`; it never changes them. The ride HUD updates from the in-memory route each location callback. SQLite checkpoints occur only after another five percentage points or the 100% threshold, avoiding a database write every GPS second. Stored progress keeps the best attempt for that date.

## Completion and rewards

Finishing a ride finalizes the current attempt. A successful first completion records a `daily_challenge_completed` rider-progress event worth 5 XP. The event ID contains the challenge ID, so retries cannot duplicate the reward. Failed attempts show the telemetry-based reason and may be retried until the local date changes. A completed challenge remains complete for the rest of the day.

## UI surfaces

- Dashboard: today's definition, description, state, and progress.
- Ride screen: compact HUD title, progress bar, and percentage.
- Ride completion: completed/failed result, reason, and awarded XP.

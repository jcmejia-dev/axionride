# AxionRide Session Handoff

Read this file before doing a broad repository scan. Keep it short and update it after material work.

## Current Focus

- Branch: `feature/speedometer-fuel-trips`.
- Product priority: make rider progression and achievements feel reliable and rewarding.
- Current XP rule: completed ride `+5`, completed maintenance `+10`, daily open `+2`, daily stats view `+1`, completed daily challenge `+5`.

## Completed in the Latest Session

- Fixed the login “Supabase is not configured” error caused by legacy `NEXT_PUBLIC_*` names in the ignored local `.env` file.
- Added an Expo config bridge that accepts the existing legacy URL/publishable-key names while keeping `EXPO_PUBLIC_*` canonical for new environments; credential values were never printed or committed.
- Fixed Profile’s endless loading state by removing notification permission from the blocking core-load path and adding guarded timeout/error/finally handling.
- Removed temporary `PROFILE FIX ACTIVE` UI plus red/blue/green diagnostic borders.
- Added a visible profile error message and retry action instead of allowing an infinite spinner.
- Fixed maintenance creation: repositories now validate the complete generated record instead of rejecting create inputs for missing generated IDs/timestamps.
- Rebuilt the maintenance scheduling sheet for small Android screens with scrolling, balanced inputs, inline validation, and stable actions above system navigation.
- Added live oil-change and fuel cards to the Maintenance screen.
- Oil-change life, scheduled distance maintenance, tracked odometer, fuel remaining, and estimated range now advance from durable completed ride distance.
- Added compact oil-change and fuel logging sheets. Oil logs establish the next due odometer; full-tank logs establish a fuel baseline.
- Fixed historical XP reconciliation: durable completed rides and maintenance records are now backfilled into the XP event ledger.
- Reconciliation uses stable event IDs and remains idempotent, so refreshes cannot double-award XP.
- Added real achievement progress metrics for completed rides, total kilometres, and completed maintenance.
- Replaced the dashboard trophy `Alert` with an animated, accessible trophy-garage sheet.
- Added selectable milestone cards, collection progress, level/XP summary, locked/unlocked presentation, and actual per-achievement progress.
- Added an in-memory rider-progress repository and a regression contract for XP reconciliation.

## Dirty-Tree Context to Preserve

The branch already contained substantial uncommitted work before the gamification changes:

- Fuel and oil-change services, repositories, schema, and draft maintenance UI.
- Trip planning domain, repositories, services, and draft screens.
- Map marker, location, profile, maintenance, service-factory, and database edits.
- `FuelSection`, `OilChangeSection`, `TripPlanningScreen`, and `ActiveTripScreen` still need final route/screen integration.
- `npx` and `tsc-output.txt` are temporary artifacts; confirm before removing them.

Do not discard or broadly reformat this existing work.

## Validation State

- `npx.cmd tsc --noEmit --pretty false`: passing after the gamification and maintenance changes.
- Android Metro production exports: passing after maintenance and profile fixes (2,190 modules); temporary exports removed after validation.
- Contract tests are framework-neutral functions; there is currently no configured package test runner.
- Expo Doctor: 19/20 checks pass. The remaining pre-existing warning is SDK 57 patch-version drift across 18 Expo packages; dependencies were not changed.
- Browser visual validation was unavailable in the current environment; Android on-device validation remains to be run.

## Recommended Next Steps

1. Launch the Android development build and verify historical XP appears after app bootstrap.
2. Open the dashboard trophy garage and validate entrance animation, card selection, scrolling, back-button close, and small-screen layout.
3. On Maintenance, create a schedule, log an oil change, and add a full-tank fuel entry; then finish a ride and confirm all distance/range bars advance.
4. Validate a newly finished ride adds XP once and unlocks eligible achievements.
5. Continue with achievement variety/reward balancing only after the XP path is verified on device.

## Fast Resume

Start with:

```powershell
Get-Content docs/SESSION_HANDOFF.md
git status --short
git log -5 --oneline
```

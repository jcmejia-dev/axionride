# Offline Maintenance Notifications

AxionRide maintenance notifications are local device notifications. They do not use remote push, Supabase, or a cloud table. SQLite remains the source of truth:

`Maintenance UI -> MaintenanceService -> Maintenance Engine -> workspace-scoped repositories -> NotificationService`

## Behavior

- Date reminders are scheduled with the operating system at the configured due-soon boundary (default: 7 days before the calculated due date at 9:00 AM local time).
- Date and distance tasks already due soon or overdue are surfaced immediately when reconciliation detects a new state.
- Distance status uses the motorcycle's actual stored odometer. AxionRide never converts kilometers into a guessed date.
- Completed, skipped, and deleted maintenance records do not schedule notifications.
- The notification payload carries the local workspace and maintenance identifiers. A tap is accepted only when its workspace is active, then opens the Maintenance route. Deleted records safely fall back to the Maintenance screen.

## Reconciliation triggers

AxionRide cancels and rebuilds meaningful reminders after maintenance create/edit/complete/delete, motorcycle edit/delete/primary selection, ride completion, app launch/resume, reminder setting changes, and local workspace/account switches. Inactive-workspace schedules are canceled. SQLite schedule metadata prevents repeated equivalent due-soon or overdue notifications.

## Permission and settings

Permission is requested only after the rider explicitly enables Maintenance Reminders. The Profile settings screen persists the enabled state and configurable distance/date thresholds per workspace. When the operating system blocks notifications, the UI reports that state and can open system settings. A test notification action exists only in development builds.

The optional daily summary is intentionally not enabled: individual state-deduplicated reminders provide the necessary information without adding daily notification spam.

## Platform limitations

Future date notifications are delivered by Android/iOS where supported after scheduling. Delivery is not guaranteed when notifications are disabled, the app is force-stopped, or the OS applies battery/background restrictions. Distance reminders are not continuous background odometer monitoring; they are re-evaluated only when AxionRide receives a real local data update or becomes active.

`expo-notifications` and its `maintenance-reminders` channel plugin were already part of the native project before this feature. The channel uses high importance on Android. An existing preview APK that already contains the plugin can receive this feature through OTA; an Expo Go session cannot test these notification APIs on this SDK.

## Rollback

Migration 4 is additive and does not modify maintenance, motorcycle, ride, or workspace ownership records. Before downgrading to a build that does not understand schema version 4, preserve an AxionRide backup or database copy. Disabling reminders cancels active-workspace schedules and clears only reminder scheduling metadata; it never deletes maintenance data.

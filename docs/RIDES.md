# Rides

## Ride names

New rides use `Ride - {local date/time}` as their default name. `rideName` is stored in the existing ride JSON payload, so no SQLite schema migration is required. Older records remain valid and display their legacy `title`. Renaming a completed ride updates both fields through `RideService.renameRide` for backward compatibility.

## Navigation

- The Rides tab owns live foreground tracking and the speedometer controls.
- `/ride-history` renders the complete local archive grouped into Today, Yesterday, This Week, and Earlier.
- `/ride-details/[id]` loads one ride, renders the recorded route and telemetry, and allows the name to be edited.

## Maps

History thumbnails are rendered locally from route coordinates and do not instantiate native maps. The live and detail maps use the existing `react-native-maps` integration with a dark style, hidden controls, and custom route markers. Completed routes use orange for normal movement, yellow for slow sections, and red markers for confirmed stops. Provider attribution remains visible where required by the native map provider.

## Live speed

Foreground tracking requests `BestForNavigation` accuracy with one-second and one-meter update thresholds. `LocationService` prefers a valid native speed, otherwise calculates Haversine distance divided by elapsed time. Samples below two meters or with non-positive time are excluded from computed speed. Values above 120 km/h and unconfirmed single-frame increases above 40 km/h are rejected; a five-sample rolling average drives every live speed consumer. Persisted maximum speed is derived only from these filtered route samples and requires two consecutive confirmations, using the lower value in each confirmation window so a single accepted peak cannot become the ride record.

## Ride analytics and fuel

Completed rides persist speed-classified segments in the existing JSON payload. Speeds below 10 km/h are slow, while speeds below 2 km/h lasting at least five seconds are stopped. Older rides derive these segments from their saved route when opened. Fuel usage is `distanceKm / fuelEfficiencyKmPerLiter`; motorcycle efficiency is editable and defaults to 40 km/L.

## Ride Score

Ride Score is calculated on demand from saved telemetry and does not change ride tracking or persistence. Smoothness measures time-normalized changes between consecutive filtered speed samples and penalizes abrupt spikes. Consistency uses the coefficient of variation of moving speeds. Traffic handling uses stopped and slow duration as percentages of total ride time. Efficiency compares used fuel with `distanceKm / expectedEfficiencyKmPerLiter`; an estimate produced from the configured efficiency therefore represents the expected baseline, while recorded excess usage lowers the score.

The final 0–100 result weights smoothness at 30%, consistency at 25%, traffic handling at 25%, and efficiency at 20%. Grades are S for 90–100, A for 80–89, B for 70–79, C for 60–69, and D below 60. The completion and detail screens use the same pure calculator and reveal the total, grade, and four sub-metrics with staggered Reanimated transitions.

The active workspace also keeps its best and most recent score locally in SQLite. A first ride establishes the baseline without comparison copy. Later completion summaries show a pulsing personal-best badge and the previous best when the new score is higher, a compact positive delta when it improves on the last ride, or a negative delta with one suggestion derived from the weakest sub-metric when it declines. The score formula itself is unchanged by this comparison layer.

## Motion and feedback

Ride navigation uses a short fade-from-bottom transition. The speedometer responds faster while accelerating, carries 720 ms of inertia while slowing, crossfades the numeric readout, adds subtle vibration above 75 km/h, and increases glow with speed. Live route segments draw over their first 380 ms while the camera eases slightly ahead of the rider with heading and pitch. Opening ride detail fades in the map, replays the route over 1.6 seconds, waits 300 ms before revealing markers, and only then staggers telemetry cards at 80 ms intervals. Insights slide in after telemetry and the timeline connector draws vertically.

Finishing a ride opens a staged HUD summary with distance, time, average speed, fuel used, and a concise interpretation based on stopped and slow time. Detail insights show those traffic-oriented durations explicitly. History cards lift slightly during scrolling and glow on press. Ride rename and rider reward feedback use the shared glass HUD toast with a short horizontal distortion and opacity flicker.

## Companion feedback

Ride personality and smart insights are rules-based and derived only from saved telemetry: average and maximum speed, stopped-time ratio, slow-time ratio, and the consistency of recorded speed samples. The UI avoids claiming historical route congestion when it has only one ride; it describes congestion patterns observed in the current ride instead.

Replay routes grade their opacity from a dim start to a bright finish while preserving normal, slow, and stopped colors. Stopped points use an additional low-opacity outer circle for a lightweight glow. During an active ride, the cockpit shows a pulsing LIVE indicator and derives STRONG, GOOD, or WEAK signal copy from the latest recorded accuracy value.

Ride completion surfaces the existing +5 XP reward inside the summary. The dashboard XP bar animates changes and performs a fill-reset-refill sequence with a short badge flash when the rider reaches a new level. Sound feedback remains disabled because the project does not currently include an audio dependency, sound assets, or a persisted sound preference.

## Progress refresh and confirmations

Rider progress refreshes can explicitly bypass the in-memory snapshot cache. The provider uses that forced path after every queued reward, immediately replaces its React snapshot state, and logs `XP UPDATE` with `totalXp`, `level`, and current-level `xp` while this issue is being verified. Ride completion awaits the same forced refresh before opening its summary, which receives the returned snapshot directly.

Ride rewards retain their existing event flow but render as a three-item top-floating HUD stack. Each item has a monochrome XP, achievement, or success icon, a lifetime bar, 220 ms right-slide entry, 100 ms shake/flicker, approximately two-second dismissal, and tap-to-dismiss. Older items scale to 0.96 and 0.94. `playSound('toast')` is called through a deliberate no-op service boundary so future opt-in audio does not require changing toast call sites. The finish-ride decision uses a custom glass confirmation modal with a 250 ms fade/scale transition instead of the platform alert.

## Performance

Ride history is cached per local workspace for 30 seconds and invalidated after ride completion or rename. The full history uses `SectionList` virtualization, memoized grouping, memoized cards, and lightweight route previews. Native maps are reserved for live tracking and the selected detail screen.

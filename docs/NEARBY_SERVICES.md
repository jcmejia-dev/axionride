# AxionRide Smart Nearby Services

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AxionRide App (Expo RN)                   │
│                                                             │
│  NearbyServicesScreen → LocationService (foreground only)   │
│       → NearbyServicesService → SupabaseNearbyServiceProvider│
│       → supabase.functions.invoke('nearby-services')        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (authenticated)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function (Deno)                   │
│                                                             │
│  Validates JWT → Validates request → Reads GOOGLE_PLACES_KEY│
│       → Google Places API (New) → Sanitizes → Returns       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (server-side API key)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Places API (New)                         │
│  - places.searchNearby (for gas_station, tire_shop)         │
│  - places.searchText (for motorcycle_repair, oil_change,    │
│    battery_electrical, dealer)                              │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Prerequisite

The Edge Function **requires** a valid Supabase JWT. The app currently has real Supabase authentication via `AuthProvider` using `@supabase/supabase-js`.

**Current state:** The app has real Supabase authentication configured. When a user is signed in, `supabase.functions.invoke()` automatically includes the JWT. The `SupabaseNearbyServiceProvider` additionally checks `client.auth.getSession()` before calling the Edge Function, returning `authentication_required` if no session exists.

**If not signed in:** The Nearby Services screen shows an "auth_required" state with a "Sign In" button. Provider search is disabled until a valid Supabase session exists.

## Data Flow

1. Rider taps "Find Nearby Services" on the Nearby Services screen
2. Screen checks for a valid Supabase session via `useAuth()`; if missing, shows auth_required state
3. Alert dialog explains: "Use your location to find nearby fuel and motorcycle services."
4. Rider confirms → foreground location permission requested via `expo-location`
5. On grant → current location obtained (in memory only, not persisted)
6. `NearbyServicesService.search()` called with coordinates + category
7. `SupabaseNearbyServiceProvider` checks session → calls `supabase.functions.invoke('nearby-services')`
8. Edge Function validates JWT (Authorization header), validates request payload, checks rate limit
9. Edge Function calls Google Places API (New) with server-side API key
10. Results sanitized and returned to app
11. App displays results or appropriate error/empty state

## Location Privacy

- **Foreground only:** Permission requested only when rider taps the search action
- **Explanation shown:** "Use your location to find nearby fuel and motorcycle services."
- **No background permission:** Never requested
- **No persistence:** Coordinates held in React state only for the active search
- **Not stored to:** SQLite, AsyncStorage, SecureStore, logs, analytics, settings, or repository tables
- **Denied/unavailable:** Honest error states with retry and system settings link

## Categories and Recommendation Rules

| Category             | Google Places Type | Text Query Fallback                  | Maintenance Trigger                                                |
| -------------------- | ------------------ | ------------------------------------ | ------------------------------------------------------------------ |
| `fuel`               | `gas_station`      | —                                    | —                                                                  |
| `motorcycle_repair`  | —                  | "motorcycle repair shop"             | ChainService, BrakeInspection, Coolant, GeneralService, CustomTask |
| `oil_change`         | —                  | "motorcycle oil change service"      | OilChange                                                          |
| `tires`              | `tire_shop`        | —                                    | TireCheck                                                          |
| `battery_electrical` | —                  | "motorcycle battery electrical shop" | BatteryCheck                                                       |
| `dealer`             | —                  | "motorcycle dealer"                  | —                                                                  |

**Recommendation label:** "Recommended based on your maintenance task."

## Provider Mapping

Google Places type strings are defined only in:

- `src/services/nearby-services/NearbyServiceCategories.ts` (app-side category config)
- `supabase/functions/nearby-services/index.ts` (server-side category config)

They are **not** scattered through UI components.

## Error Codes

| Code                      | Meaning                     | User-Facing Message                                      |
| ------------------------- | --------------------------- | -------------------------------------------------------- |
| `authentication_required` | No valid Supabase session   | "Sign in to search for nearby services."                 |
| `invalid_request`         | Bad request payload         | "Choose a valid category and location."                  |
| `network_unavailable`     | Network error               | "Nearby services could not be reached."                  |
| `provider_unavailable`    | Google Places API error     | "The nearby provider is temporarily unavailable."        |
| `rate_limited`            | Too many requests           | "Too many nearby searches. Wait a minute and try again." |
| `invalid_response`        | Malformed provider response | "The nearby service returned an invalid response."       |
| `missing_configuration`   | Supabase not configured     | "Supabase is not configured for nearby services."        |

## Google Maps Deep-Link Behavior

- **Directions:** Opens Google Maps with driving directions to the place
- **Open in Maps:** Uses `googleMapsUri` from provider, or falls back to search URL
- **Call:** Only shown when provider returns a phone number
- **Fallback search:** When no results or error, offers "Search in Google Maps" which opens a text search in the Google Maps app

## Manual Google Cloud Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Places API (New)** for your project
3. Create a dedicated API key:
   - Restrict to **Places API (New)** only
   - **Do not** use Android/iOS application restrictions (this is a server-side key)
   - Apply IP restriction **only if** your Supabase project provides verified static egress IPs
   - Otherwise rely on: API restriction, secret storage, quotas, billing alerts, authentication, validation, and rate limiting
4. Set up billing and budget alerts
5. Review the current [Google Maps Platform pricing](https://mapsplatform.google.com/pricing/) before enabling production traffic

## Manual Supabase CLI Steps

```bash
# 1. Set the Google Places API key as an Edge Function secret
supabase secrets set GOOGLE_PLACES_API_KEY=<your-restricted-key>

# 2. Deploy the Edge Function
supabase functions deploy nearby-services --project-ref <your-project-ref>

# 3. Verify deployment
supabase functions list --project-ref <your-project-ref>
```

## Secret Location

- `GOOGLE_PLACES_API_KEY` is stored only in **Supabase Edge Function secrets**
- Never in: Expo source code, `app.json`, `eas.json`, `.env.example`, `.env`, Git, or Discord
- The key is read via `Deno.env.get("GOOGLE_PLACES_API_KEY")` inside the Edge Function

## Local Testing Without Real Credentials

The app-side code can be tested with mock providers. Tests in `src/services/nearby-services/__tests__/` cover:

- Category recommendation mapping (9 assertions)
- Request validation (14 assertions: coordinates, radius, category)
- Google Maps deep-link construction (8 assertions)

These tests do not call the real Google Places API and do not require a real secret.

## Billing and Quota Considerations

**Important:** Google Maps Platform uses **SKU-based pricing**, not a general monthly credit.

Since March 1, 2025, the previous general $200 monthly credit was replaced with **SKU-specific monthly free usage caps**. Each Places API SKU (e.g., Nearby Search, Text Search, Place Details) has its own free tier limits.

- The Edge Function uses **minimal field masks** to reduce response size and the number of data SKUs billed per request
- However, a minimal field mask does **not** guarantee that a request is free — billing depends on which SKUs are triggered by the requested fields
- **Max 15 results** per request
- **Default 5 km** search radius
- **8-second timeout** on provider requests
- **Billing must be enabled** on the Google Cloud project before the API will work
- **Configure the following in Google Cloud Console:**
  - API quota limits per day/user
  - Budget alerts (e.g., notify at $10, $50, $100)
  - Billing export for cost analysis
- **Do not hardcode exact request prices** in application code, as Google may change pricing at any time
- Review the **[current official Google Places pricing table](https://mapsplatform.google.com/pricing/)** before enabling production traffic
- Monitor usage in both Google Cloud Console and Supabase logs
- The **free monthly credit** previously documented as $200 was accurate before March 1, 2025. The current pricing model uses SKU-specific free tiers instead

## Rate-Limit Limitation (v1)

The Edge Function includes a **best-effort in-instance** rate limiter:

- 10 requests per 2 minutes per user
- Stored in memory (not durable across isolates or cold starts)
- **Not globally consistent** — a user could exceed the limit if routed to a different instance

**Production recommendation:** Implement durable rate limiting using Supabase database tables or a gateway feature. This is deferred.

## Phone-Number / Place Details Limitation

Google Places API (New) search endpoints (`searchNearby`, `searchText`) may not return phone numbers in search results. Phone numbers typically require an additional **Place Details** request, which incurs extra cost.

**Current behavior:** The Call button is shown only when the provider returns a phone number. If no phone number is returned, the Call button is absent.

**Deferred:** Automatic Place Details requests for phone numbers. This would require:

- An additional paid API call per place
- Careful cost management
- User-facing opt-in or transparent disclosure

## OTA vs Native-Build Requirements

- **Edge Function deployment:** Server-side only, no app build required
- **App changes:** The Nearby Services feature uses only Expo APIs already in the project (`expo-location`, `expo-linking`, `expo-symbols`)
- **OTA update:** Potentially sufficient for app-side changes after the Edge Function is deployed (see Native build section below)
- **Native build:** May be required depending on whether `expo-location` was present in the installed APK

### OTA Command

A precise OTA command **cannot be provided** without knowing the exact EAS branch/channel target for the production app.

The EAS configuration (`eas.json`) defines three channels: `development`, `preview`, and `production`. The `production` profile uses `channel: "production"` and `runtimeVersion: { policy: "appVersion" }` (configured in `app.json`).

To publish an OTA update:

1. Confirm which EAS branch/channel the installed APK was built from
2. Run:
   ```bash
   npx eas-cli update --branch <confirmed-branch> --message "feat: nearby services"
   ```
3. For the production channel, this would be:
   ```bash
   npx eas-cli update --branch production --message "feat: nearby services"
   ```
   **But this must be confirmed against the actual EAS project configuration and the installed APK's update source.**

### APK Rebuild Required?

**Status: Cannot be guaranteed without testing.**

- `expo-location` (`~57.0.2`) is listed in `package.json` dependencies and was likely present in the latest APK build
- The Android location permission (`ACCESS_FINE_LOCATION`) is autolinked by `expo-location` and does not appear as a manual entry in `app.json` plugins
- `react-native-maps` (version `1.27.2`) is also listed in dependencies, confirming native map/location infrastructure was already present
- The `runtimeVersion` policy is `"appVersion"` (currently `1.0.0`), meaning an OTA update is compatible as long as the native runtime hasn't changed

**Recommendation:** Test OTA on a device with the installed APK first. If the Nearby Services screen displays without a "New update available" prompt blocking it, OTA is sufficient. If `expo-location` was added after the last native build, a new APK is required.

## Manual Test Checklist

The following behaviors cannot be automated without real device/infrastructure access:

- [ ] Foreground location permission dialog appears on "Find Nearby Services" tap
- [ ] Permission denied → shows permission state with retry and system settings
- [ ] Location services disabled → shows unavailable state
- [ ] Successful permission grant → obtains location and searches
- [ ] Network unavailable → shows network error with retry and Google Maps fallback
- [ ] Google Places API error → shows provider error with retry and Google Maps fallback
- [ ] Empty results → shows appropriate state with Google Maps fallback
- [ ] Results displayed: name, address, distance, open/closed, rating, review count
- [ ] Call button appears only when phone number is present
- [ ] Directions opens Google Maps with driving mode
- [ ] Open in Maps opens Google Maps place page
- [ ] Fallback Google Maps search works
- [ ] Auth-required state shows when signed out
- [ ] "Recommended based on your maintenance task" banner appears when navigated from maintenance
- [ ] "Nearby Services" card appears on Dashboard
- [ ] Coordinates are not stored after navigating away

## Deferred Features

- Background location tracking
- Cloud sync of search history
- Supabase domain tables for rate limiting or caching
- Remote push notifications
- Automatic repair booking
- Automatic Supabase Edge Function deployment
- Automatic Google Cloud configuration
- Place Details requests for phone numbers
- Durable server-side rate limiting
- Map view integration (requires stable map component)
- Rides tab quick action (requires screen redesign)

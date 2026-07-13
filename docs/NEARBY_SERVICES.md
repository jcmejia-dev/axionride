# AxionRide Nearby Services

## Architecture

Nearby Services keeps the existing feature and service boundaries:

1. `NearbyServicesScreen` requests foreground location only after rider confirmation.
2. `NearbyServicesService` validates the coordinate and category request.
3. `SupabaseNearbyServiceProvider` verifies that a Supabase session exists and invokes `nearby-services` with the session access token.
4. The authenticated Supabase Edge Function validates and rate-limits the request.
5. The Edge Function sends an Overpass QL query to the public OpenStreetMap Overpass API.
6. OpenStreetMap elements are normalized to the existing `NearbyPlace` contract.

No Google Places API key, Google Cloud project, billing account, or provider secret is required.

## Authentication and Privacy

- A valid Supabase user session is required.
- Coordinates are sent only for the active search.
- Coordinates and search results are not persisted locally or synced.
- Background location is not requested.
- Tokens, coordinates, and raw Overpass responses are not logged.

## Category Mapping

| AxionRide category | OpenStreetMap selectors |
| --- | --- |
| `fuel` | `node["amenity"="fuel"]` |
| `motorcycle_repair` | `node["shop"="motorcycle_repair"]`, then general `node["shop"="car_repair"]` results in the same union |
| `oil_change` | Motorcycle and general repair nodes |
| `tires` | `node["shop"="tyres"]` |
| `battery_electrical` | Motorcycle and general repair nodes |
| `dealer` | `node["shop"="motorcycle"]` |

The default radius is 5 km. Requests accept 250–10,000 meters.

## Response Mapping

Each Overpass node is mapped as follows:

- `id`: `<element type>-<OSM id>`
- `name`: `tags.name`, falling back to `Unknown`
- `address`: `addr:full`, or a composition of house number, street, and locality
- `location`: node `lat` and `lon`
- `distanceMeters`: Haversine distance calculated by the Edge Function
- `phoneNumber`: `phone` or `contact:phone`, when tagged
- `openNow`, `rating`, and `reviewCount`: `null` because Overpass does not provide normalized live/rating data
- `googleMapsUri`: `null`; existing app deep-link helpers build Google Maps URLs from coordinates and names

Results are sorted by distance and limited to the nearest 25 nodes. An empty `elements` array is a successful empty search, not a provider error.

## Error Behavior

| Code | Meaning |
| --- | --- |
| `auth_required` | Missing or invalid Supabase session |
| `invalid_request` | Invalid coordinate, radius, or category |
| `network_error` | App could not reach Supabase |
| `timeout` | Overpass returned or triggered a timeout |
| `provider_unavailable` | The Overpass endpoint could not serve a valid response |
| `rate_limited` | AxionRide per-user request limit reached |
| `invalid_response` | Edge Function response did not match the app contract |

The UI retains Retry and Search in Google Maps actions for error and empty states.

## Deployment

Deploy the existing function name:

```bash
supabase functions deploy nearby-services --project-ref <your-project-ref>
supabase functions list --project-ref <your-project-ref>
```

No Edge Function provider secret needs to be configured.

## Operational Limitations

- OpenStreetMap completeness and tagging vary by region.
- The requested implementation queries nodes only; services mapped only as ways or relations are not returned.
- Public Overpass instances are shared infrastructure and can be slow, rate-limited, or temporarily unavailable.
- Opening-hours tags are not evaluated into a live open/closed state.
- Ratings and review counts are not available from OpenStreetMap.
- The in-memory Edge Function rate limit is best effort and resets across isolates.
- Google Maps deep links remain navigation conveniences; Google Places is not used as a data provider.

## Manual Test Checklist

- Signed-out search shows Sign in required.
- Permission denial shows the existing location permission state.
- Fuel, repair, tires, and dealer searches return locally mapped OpenStreetMap nodes where data exists.
- No-result searches show the existing empty state and Google Maps fallback.
- Overpass timeout shows the timeout state rather than a generic error.
- Name, address, distance, directions, Open in Maps, and optional phone actions render correctly.
- No Google Places secret is required after deployment.

/**
 * AxionRide Nearby Services Edge Function
 *
 * Called by authenticated Supabase clients to search Google Places API (New)
 * for motorcycle-relevant nearby places.
 *
 * SECURITY
 * - Requires authenticated Supabase user (JWT verified by Supabase).
 * - GOOGLE_PLACES_API_KEY is read from environment secrets only.
 * - Never returns the API key or raw Google responses.
 * - Logs are sanitised: no coordinates, no tokens, no full provider responses.
 *
 * USAGE
 *   POST /functions/v1/nearby-services
 *   Authorization: Bearer <supabase anon key>
 *   Body: { latitude: number, longitude: number, category: string, radiusMeters?: number }
 *
 * @see https://developers.google.com/maps/documentation/places-web-service
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// --------------- Types ---------------

interface NearbySearchRequest {
  latitude: number;
  longitude: number;
  category: string;
  radiusMeters?: number;
}

interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  location: { latitude: number; longitude: number };
  distanceMeters: number;
  openNow: boolean | null;
  rating: number | null;
  reviewCount: number | null;
  phoneNumber: string | null;
  googleMapsUri: string | null;
}

// --------------- Category config ---------------

interface CategoryConfig {
  readonly googleNearbyType: string | null;
  readonly textQuery: string | null;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  fuel: { googleNearbyType: "gas_station", textQuery: null },
  motorcycle_repair: {
    googleNearbyType: null,
    textQuery: "motorcycle repair shop",
  },
  oil_change: {
    googleNearbyType: null,
    textQuery: "motorcycle oil change service",
  },
  tires: { googleNearbyType: "tire_shop", textQuery: null },
  battery_electrical: {
    googleNearbyType: null,
    textQuery: "motorcycle battery electrical shop",
  },
  dealer: { googleNearbyType: null, textQuery: "motorcycle dealer" },
};

const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_CONFIG));
const API_BASE = "https://places.googleapis.com/v1";
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_RADIUS_METERS = 10_000;
const MIN_RADIUS_METERS = 250;
const CACHE_TTL_MS = 120_000; // 2-minute in-memory TTL per user

// --------------- Simple per-user rate limiter ---------------

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + CACHE_TTL_MS });
    return true;
  }
  if (entry.count >= 10) return false; // 10 requests per 2 minutes
  entry.count += 1;
  return true;
}

// --------------- Request validation ---------------

function validateRequest(
  body: unknown,
): { ok: true; value: NearbySearchRequest } | { ok: false; message: string } {
  if (!body || typeof body !== "object")
    return { ok: false, message: "Request body must be a JSON object." };

  const input = body as Record<string, unknown>;

  if (typeof input.latitude !== "number" || !Number.isFinite(input.latitude))
    return { ok: false, message: "latitude must be a finite number." };
  if (typeof input.longitude !== "number" || !Number.isFinite(input.longitude))
    return { ok: false, message: "longitude must be a finite number." };
  if (input.latitude < -90 || input.latitude > 90)
    return { ok: false, message: "latitude out of range." };
  if (input.longitude < -180 || input.longitude > 180)
    return { ok: false, message: "longitude out of range." };

  if (
    typeof input.category !== "string" ||
    !VALID_CATEGORIES.has(input.category)
  ) {
    return {
      ok: false,
      message: `category must be one of: ${[...VALID_CATEGORIES].join(", ")}.`,
    };
  }

  let radiusMeters = 5000;
  if (input.radiusMeters !== undefined) {
    if (
      typeof input.radiusMeters !== "number" ||
      !Number.isFinite(input.radiusMeters)
    ) {
      return { ok: false, message: "radiusMeters must be a finite number." };
    }
    if (
      input.radiusMeters < MIN_RADIUS_METERS ||
      input.radiusMeters > MAX_RADIUS_METERS
    ) {
      return {
        ok: false,
        message: `radiusMeters must be between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS}.`,
      };
    }
    radiusMeters = input.radiusMeters;
  }

  return {
    ok: true,
    value: {
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category,
      radiusMeters,
    },
  };
}

// --------------- Google Places API (New) ---------------

async function searchGooglePlaces(
  request: NearbySearchRequest,
  apiKey: string,
): Promise<
  | { ok: true; places: NearbyPlace[] }
  | { ok: false; code: string; message: string }
> {
  const config = CATEGORY_CONFIG[request.category];
  const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);

  try {
    // Prefer Nearby Search (New) when a Google Places type exists
    if (config.googleNearbyType) {
      return await nearbySearch(
        request,
        config.googleNearbyType,
        apiKey,
        timeout,
      );
    }
    // Fall back to text search for categories without a direct type
    if (config.textQuery) {
      return await textSearch(request, config.textQuery, apiKey, timeout);
    }
    return {
      ok: false,
      code: "invalid_category",
      message: "Category configuration error.",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        ok: false,
        code: "timeout",
        message: "The nearby provider did not respond in time.",
      };
    }
    // Don't expose the error details to the client
    return {
      ok: false,
      code: "provider_error",
      message: "The nearby provider is temporarily unavailable.",
    };
  }
}

async function nearbySearch(
  request: NearbySearchRequest,
  placeType: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<
  | { ok: true; places: NearbyPlace[] }
  | { ok: false; code: string; message: string }
> {
  const url = `${API_BASE}/places:searchNearby`;

  const body = {
    includedTypes: [placeType],
    maxResultCount: 15,
    locationRestriction: {
      circle: {
        center: { latitude: request.latitude, longitude: request.longitude },
        radius: request.radiusMeters ?? 5000,
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.nationalPhoneNumber,places.googleMapsUri,places.distanceMeters",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 403 || status === 401)
      return {
        ok: false,
        code: "provider_auth",
        message: "Places API authentication failed.",
      };
    if (status === 429)
      return {
        ok: false,
        code: "provider_rate_limited",
        message: "Places API rate limit exceeded.",
      };
    if (status >= 500)
      return {
        ok: false,
        code: "provider_error",
        message: "Places API server error.",
      };
    return {
      ok: false,
      code: "provider_error",
      message: `Places API returned status ${status}.`,
    };
  }

  const data = await response.json();
  const places = sanitizePlaces(data.places ?? [], request);
  return { ok: true, places };
}

async function textSearch(
  request: NearbySearchRequest,
  textQuery: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<
  | { ok: true; places: NearbyPlace[] }
  | { ok: false; code: string; message: string }
> {
  const url = `${API_BASE}/places:searchText`;

  const body = {
    textQuery,
    maxResultCount: 15,
    locationBias: {
      circle: {
        center: { latitude: request.latitude, longitude: request.longitude },
        radius: request.radiusMeters ?? 5000,
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.nationalPhoneNumber,places.googleMapsUri,places.distanceMeters",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 403 || status === 401)
      return {
        ok: false,
        code: "provider_auth",
        message: "Places API authentication failed.",
      };
    if (status === 429)
      return {
        ok: false,
        code: "provider_rate_limited",
        message: "Places API rate limit exceeded.",
      };
    if (status >= 500)
      return {
        ok: false,
        code: "provider_error",
        message: "Places API server error.",
      };
    return {
      ok: false,
      code: "provider_error",
      message: `Places API returned status ${status}.`,
    };
  }

  const data = await response.json();
  const places = sanitizePlaces(data.places ?? [], request);
  return { ok: true, places };
}

// --------------- Sanitisation ---------------

function sanitizePlaces(
  rawPlaces: unknown[],
  request: NearbySearchRequest,
): NearbyPlace[] {
  if (!Array.isArray(rawPlaces)) return [];

  return rawPlaces
    .filter(
      (p): p is Record<string, unknown> => typeof p === "object" && p !== null,
    )
    .map((p) => ({
      id: String(p.id ?? ""),
      name: extractDisplayName(p.displayName),
      address: String(p.formattedAddress ?? ""),
      location: extractLocation(p.location, request),
      distanceMeters:
        typeof p.distanceMeters === "number"
          ? p.distanceMeters
          : calculateDistance(request, p.location),
      openNow: extractOpenNow(p.regularOpeningHours),
      rating: typeof p.rating === "number" ? p.rating : null,
      reviewCount:
        typeof p.userRatingCount === "number" ? p.userRatingCount : null,
      phoneNumber:
        typeof p.nationalPhoneNumber === "string"
          ? p.nationalPhoneNumber
          : null,
      googleMapsUri:
        typeof p.googleMapsUri === "string" ? p.googleMapsUri : null,
    }))
    .filter((p) => p.id && p.name && p.address);
}

function extractDisplayName(displayName: unknown): string {
  if (typeof displayName === "object" && displayName !== null) {
    const name = (displayName as Record<string, unknown>).text;
    if (typeof name === "string") return name;
  }
  return "";
}

function extractLocation(
  location: unknown,
  fallback: NearbySearchRequest,
): { latitude: number; longitude: number } {
  if (typeof location === "object" && location !== null) {
    const loc = location as Record<string, unknown>;
    if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
  }
  return { latitude: fallback.latitude, longitude: fallback.longitude };
}

function extractOpenNow(hours: unknown): boolean | null {
  if (typeof hours === "object" && hours !== null) {
    const h = hours as Record<string, unknown>;
    if (typeof h.openNow === "boolean") return h.openNow;
  }
  return null;
}

function calculateDistance(
  from: NearbySearchRequest,
  location: unknown,
): number {
  const to = extractLocation(location, from);
  // Haversine formula
  const R = 6_371_000;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// --------------- Main handler ---------------

serve(async (req: Request) => {
  // CORS headers for development
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required." }, 401);
    }

    // Extract user ID from JWT (Supabase Edge Functions verify JWT automatically)
    const userId = req.headers.get("x-supabase-auth-uid") ?? "anonymous";
    if (userId === "anonymous") {
      return jsonResponse({ error: "Valid Supabase session required." }, 401);
    }

    // Rate limit
    if (!checkRateLimit(userId)) {
      return jsonResponse(
        { error: "Too many requests. Try again later.", code: "rate_limited" },
        429,
      );
    }

    // Parse and validate body
    const body: unknown = await req.json();
    const validation = validateRequest(body);
    if (!validation.ok) {
      return jsonResponse(
        { error: validation.message, code: "invalid_request" },
        400,
      );
    }

    // Get Google API key from environment secrets
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error(
        "GOOGLE_PLACES_API_KEY is not configured in Edge Function secrets.",
      );
      return jsonResponse(
        {
          error: "Nearby services are not configured.",
          code: "missing_configuration",
        },
        500,
      );
    }

    // Search Google Places
    const result = await searchGooglePlaces(validation.value, apiKey);
    if (!result.ok) {
      if (result.code === "provider_auth") {
        console.error(
          "Google Places API authentication failed. Check your API key and enabled APIs.",
        );
        return jsonResponse(
          {
            error: "Nearby services are temporarily unavailable.",
            code: "provider_error",
          },
          502,
        );
      }
      if (result.code === "timeout") {
        return jsonResponse(
          { error: "Nearby services timed out.", code: "timeout" },
          504,
        );
      }
      if (result.code === "provider_rate_limited") {
        return jsonResponse(
          {
            error: "Nearby services are busy. Try again later.",
            code: "provider_error",
          },
          502,
        );
      }
      return jsonResponse(
        {
          error: "Nearby services are temporarily unavailable.",
          code: "provider_error",
        },
        502,
      );
    }

    // Return sanitized results
    // Note: We don't log the actual places data to avoid unnecessary billing exposure
    return jsonResponse({ places: result.places }, 200, corsHeaders);
  } catch (error) {
    // Never log the raw error details that might contain sensitive info
    console.error("Unexpected error in nearby-services function");
    return jsonResponse(
      { error: "An unexpected error occurred." },
      500,
      corsHeaders,
    );
  }
});

function jsonResponse(
  body: unknown,
  status: number,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
  });
}

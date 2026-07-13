/**
 * AxionRide Nearby Services Edge Function
 *
 * Called by authenticated Supabase clients to search OpenStreetMap through
 * the public Overpass API
 * for motorcycle-relevant nearby places.
 *
 * SECURITY
 * - Requires authenticated Supabase user (JWT verified by Supabase).
 * - No third-party API key is required.
 * - Never returns raw OpenStreetMap responses.
 * - Logs are sanitised: no coordinates, tokens, or full provider responses.
 *
 * USAGE
 *   POST /functions/v1/nearby-services
 *   Authorization: Bearer <signed-in user's Supabase access token>
 *   Body: { latitude: number, longitude: number, category: string, radiusMeters?: number }
 *
 * @see https://wiki.openstreetmap.org/wiki/Overpass_API
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

type OverpassTagFilter = readonly [key: string, value: string];

const CATEGORY_CONFIG: Record<string, readonly OverpassTagFilter[]> = {
  fuel: [["amenity", "fuel"]],
  motorcycle_repair: [["shop", "motorcycle_repair"], ["shop", "car_repair"]],
  oil_change: [["shop", "motorcycle_repair"], ["shop", "car_repair"]],
  tires: [["shop", "tyres"]],
  battery_electrical: [["shop", "motorcycle_repair"], ["shop", "car_repair"]],
  dealer: [["shop", "motorcycle"]],
};

const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_CONFIG));
const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const DEFAULT_TIMEOUT_MS = 12_000;
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

// --------------- OpenStreetMap Overpass API ---------------

type OverpassElement = {
  readonly type?: unknown;
  readonly id?: unknown;
  readonly lat?: unknown;
  readonly lon?: unknown;
  readonly tags?: unknown;
};

async function searchOpenStreetMap(request: NearbySearchRequest): Promise<
  | { ok: true; places: NearbyPlace[] }
  | { ok: false; code: "timeout" | "provider_error" }
> {
  const query = buildOverpassQuery(request);

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "text/plain; charset=UTF-8",
      },
      body: query,
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { ok: false, code: response.status === 504 ? "timeout" : "provider_error" };
    }

    const data: unknown = await response.json();
    if (!isRecord(data) || !Array.isArray(data.elements)) {
      return { ok: true, places: [] };
    }

    return { ok: true, places: mapOverpassElements(data.elements, request) };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof DOMException && error.name === "TimeoutError" ? "timeout" : "provider_error",
    };
  }
}

function buildOverpassQuery(request: NearbySearchRequest) {
  const radius = request.radiusMeters ?? 5000;
  const selectors = CATEGORY_CONFIG[request.category]
    .map(([key, value]) => `node["${key}"="${value}"](around:${radius},${request.latitude},${request.longitude});`)
    .join("\n");

  return `[out:json][timeout:10];\n(\n${selectors}\n);\nout;`;
}

function mapOverpassElements(elements: readonly unknown[], request: NearbySearchRequest): NearbyPlace[] {
  return elements
    .filter((element): element is OverpassElement => isRecord(element))
    .flatMap((element) => {
      if (typeof element.lat !== "number" || typeof element.lon !== "number") return [];
      const tags = isRecord(element.tags) ? element.tags : {};
      const location = { latitude: element.lat, longitude: element.lon };
      const name = getTag(tags, "name") ?? "Unknown";

      return [{
        id: `${typeof element.type === "string" ? element.type : "node"}-${String(element.id ?? `${element.lat}-${element.lon}`)}`,
        name,
        address: composeAddress(tags),
        location,
        distanceMeters: calculateDistance(request, location),
        openNow: null,
        rating: null,
        reviewCount: null,
        phoneNumber: getTag(tags, "phone") ?? getTag(tags, "contact:phone"),
        googleMapsUri: null,
      }];
    })
    .sort((first, second) => first.distanceMeters - second.distanceMeters)
    .slice(0, 25);
}

function composeAddress(tags: Record<string, unknown>) {
  const fullAddress = getTag(tags, "addr:full");
  if (fullAddress) return fullAddress;

  const streetAddress = [getTag(tags, "addr:housenumber"), getTag(tags, "addr:street")]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  const locality = getTag(tags, "addr:city") ?? getTag(tags, "addr:town") ?? getTag(tags, "addr:municipality");
  return [streetAddress, locality].filter((part): part is string => Boolean(part)).join(", ") || "Address unavailable";
}

function getTag(tags: Record<string, unknown>, key: string) {
  const value = tags[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function calculateDistance(
  from: NearbySearchRequest,
  to: { readonly latitude: number; readonly longitude: number },
): number {
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
    return jsonResponse({ error: "invalid_request" }, 405, corsHeaders);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "auth_required" }, 401, corsHeaders);
    }

    // Default Edge Function JWT verification validates the bearer token before
    // this handler runs. Use the verified token's subject as the caller ID.
    const userId = getJwtSubject(authHeader);
    if (!userId) {
      return jsonResponse({ error: "auth_required" }, 401, corsHeaders);
    }

    // Rate limit
    if (!checkRateLimit(userId)) {
      return jsonResponse(
        { error: "Too many requests. Try again later.", code: "rate_limited" },
        429,
        corsHeaders,
      );
    }

    // Parse and validate body
    const body: unknown = await req.json();
    const validation = validateRequest(body);
    if (!validation.ok) {
      return jsonResponse(
        { error: validation.message, code: "invalid_request" },
        400,
        corsHeaders,
      );
    }

    const result = await searchOpenStreetMap(validation.value);
    if (!result.ok) {
      if (result.code === "timeout") {
        return jsonResponse(
          { error: "timeout" },
          504,
          corsHeaders,
        );
      }
      return jsonResponse(
        { error: "provider_unavailable" },
        502,
        corsHeaders,
      );
    }

    // Empty Overpass results are valid and return an empty places array.
    return jsonResponse({ places: result.places }, 200, corsHeaders);
  } catch (error) {
    // Never log the raw error details that might contain sensitive info
    console.error("Unexpected error in nearby-services function");
    return jsonResponse(
      { error: "provider_unavailable" },
      500,
      corsHeaders,
    );
  }
});

function getJwtSubject(authHeader: string): string | null {
  try {
    const token = authHeader.slice("Bearer ".length);
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(paddedBase64)) as { sub?: unknown };
    return typeof payload.sub === "string" && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

import {
  createGoogleMapsDirectionsUrl,
  createGoogleMapsFallbackSearchUrl,
  createGoogleMapsPlaceUrl,
} from "../NearbyServiceLinks";
import type { NearbyPlace, NearbyServiceCategory } from "../NearbyServiceTypes";

/**
 * Framework-neutral contract tests for Google Maps deep-link construction.
 *
 * Run via: `runNearbyServiceLinksContractTests()`
 */
export async function runNearbyServiceLinksContractTests() {
  directionsUrlContainsRequiredParameters();
  directionsUrlEncodesDestination();
  placeUrlUsesGoogleMapsUriWhenAvailable();
  placeUrlFallsBackToSearchWhenUriIsNull();
  fallbackSearchUrlContainsQuery();
  fallbackSearchUrlIncludesLocationHint();
  fallbackSearchUrlOmitsLocationHintWhenNotProvided();
  fallbackSearchUrlUsesLabelForCategoriesWithoutTextQuery();
}

const place: NearbyPlace = {
  id: "ChIJ123",
  name: "Test Shop",
  address: "123 Test St",
  location: { latitude: 14.6, longitude: 121.0 },
  distanceMeters: 500,
  openNow: true,
  rating: 4.5,
  reviewCount: 100,
  phoneNumber: "+639123456789",
  googleMapsUri: "https://maps.google.com/?cid=123",
};

function directionsUrlContainsRequiredParameters() {
  const url = createGoogleMapsDirectionsUrl(place);
  assert(
    url.includes("https://www.google.com/maps/dir/?api=1"),
    "directions URL starts with correct base",
  );
  assert(url.includes("destination=14.6%2C121"), "destination is encoded");
  assert(url.includes("destination_place_id=ChIJ123"), "place ID is included");
  assert(url.includes("travelmode=driving"), "travel mode is driving");
}

function directionsUrlEncodesDestination() {
  const url = createGoogleMapsDirectionsUrl(place);
  assert(
    !url.includes("destination=14.6,121.0"),
    "destination is not raw coordinates",
  );
}

function placeUrlUsesGoogleMapsUriWhenAvailable() {
  const result = createGoogleMapsPlaceUrl(place);
  assert(
    result === "https://maps.google.com/?cid=123",
    "uses googleMapsUri when present",
  );
}

function placeUrlFallsBackToSearchWhenUriIsNull() {
  const noUri: NearbyPlace = { ...place, googleMapsUri: null };
  const url = createGoogleMapsPlaceUrl(noUri);
  assert(
    url.includes("https://www.google.com/maps/search/?api=1"),
    "falls back to search URL",
  );
  assert(
    url.includes("query=Test%20Shop%20123%20Test%20St"),
    "query includes name and address",
  );
  assert(url.includes("query_place_id=ChIJ123"), "place ID is included");
}

function fallbackSearchUrlContainsQuery() {
  const url = createGoogleMapsFallbackSearchUrl(
    "fuel" satisfies NearbyServiceCategory,
  );
  assert(
    url.includes("https://www.google.com/maps/search/?api=1"),
    "fallback URL starts with correct base",
  );
  assert(url.includes("query=Gas%20Stations"), "query contains category label");
}

function fallbackSearchUrlIncludesLocationHint() {
  const url = createGoogleMapsFallbackSearchUrl(
    "motorcycle_repair" satisfies NearbyServiceCategory,
    { latitude: 14.6, longitude: 121.0 },
  );
  assert(url.includes("near%2014.6%2C121"), "location hint is included");
}

function fallbackSearchUrlOmitsLocationHintWhenNotProvided() {
  const url = createGoogleMapsFallbackSearchUrl(
    "tires" satisfies NearbyServiceCategory,
  );
  assert(!url.includes("near"), "location hint is omitted when not provided");
}

function fallbackSearchUrlUsesLabelForCategoriesWithoutTextQuery() {
  const url = createGoogleMapsFallbackSearchUrl(
    "oil_change" satisfies NearbyServiceCategory,
  );
  assert(
    url.includes("query=Oil%20Change"),
    "uses label for categories without textQuery",
  );
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition)
    throw new Error(`Nearby service links contract failed: ${message}`);
}

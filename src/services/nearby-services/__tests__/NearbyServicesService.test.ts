import { isValidRequest } from "../NearbyServicesService";
import type { NearbySearchRequest } from "../NearbyServiceTypes";

/**
 * Framework-neutral contract tests for nearby search request validation.
 *
 * Run via: `runNearbyServicesServiceContractTests()`
 */
export async function runNearbyServicesServiceContractTests() {
  acceptsValidRequest();
  rejectsLatitudeAbove90();
  rejectsLatitudeBelowMinus90();
  rejectsLongitudeAbove180();
  rejectsLongitudeBelowMinus180();
  rejectsNonFiniteLatitude();
  rejectsNonFiniteLongitude();
  acceptsRequestWithoutRadius();
  acceptsRadiusAtMinimumBoundary();
  acceptsRadiusAtMaximumBoundary();
  rejectsRadiusBelowMinimum();
  rejectsRadiusAboveMaximum();
  rejectsNonNumericRadius();
  rejectsMissingCoordinates();
}

const validRequest: NearbySearchRequest = {
  latitude: 14.5995,
  longitude: 120.9842,
  category: "motorcycle_repair",
  radiusMeters: 5000,
};

function acceptsValidRequest() {
  assert(isValidRequest(validRequest), "valid request is accepted");
}

function rejectsLatitudeAbove90() {
  assert(
    !isValidRequest({ ...validRequest, latitude: 91 }),
    "latitude > 90 is rejected",
  );
}

function rejectsLatitudeBelowMinus90() {
  assert(
    !isValidRequest({ ...validRequest, latitude: -91 }),
    "latitude < -90 is rejected",
  );
}

function rejectsLongitudeAbove180() {
  assert(
    !isValidRequest({ ...validRequest, longitude: 181 }),
    "longitude > 180 is rejected",
  );
}

function rejectsLongitudeBelowMinus180() {
  assert(
    !isValidRequest({ ...validRequest, longitude: -181 }),
    "longitude < -180 is rejected",
  );
}

function rejectsNonFiniteLatitude() {
  assert(
    !isValidRequest({ ...validRequest, latitude: NaN }),
    "NaN latitude is rejected",
  );
}

function rejectsNonFiniteLongitude() {
  assert(
    !isValidRequest({ ...validRequest, longitude: Infinity }),
    "Infinity longitude is rejected",
  );
}

function acceptsRequestWithoutRadius() {
  const { radiusMeters: _, ...rest } = validRequest;
  assert(isValidRequest(rest), "request without radius is accepted");
}

function acceptsRadiusAtMinimumBoundary() {
  assert(
    isValidRequest({ ...validRequest, radiusMeters: 250 }),
    "radius 250 is accepted",
  );
}

function acceptsRadiusAtMaximumBoundary() {
  assert(
    isValidRequest({ ...validRequest, radiusMeters: 10000 }),
    "radius 10000 is accepted",
  );
}

function rejectsRadiusBelowMinimum() {
  assert(
    !isValidRequest({ ...validRequest, radiusMeters: 249 }),
    "radius 249 is rejected",
  );
}

function rejectsRadiusAboveMaximum() {
  assert(
    !isValidRequest({ ...validRequest, radiusMeters: 10001 }),
    "radius 10001 is rejected",
  );
}

function rejectsNonNumericRadius() {
  assert(
    !isValidRequest({ ...validRequest, radiusMeters: NaN }),
    "NaN radius is rejected",
  );
}

function rejectsMissingCoordinates() {
  assert(
    !isValidRequest({
      ...validRequest,
      latitude: undefined as unknown as number,
    }),
    "undefined latitude is rejected",
  );
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition)
    throw new Error(`Nearby services service contract failed: ${message}`);
}

import type { RidePoint } from '@/src/domain/ride';

import { EARTH_RADIUS_KM } from './RideEngineRules';
import type { RideDistanceInput } from './RideEngineTypes';

/**
 * Calculate total ride distance in kilometers from ordered route points.
 *
 * Uses Haversine distance between each adjacent coordinate pair. Later GPS
 * breadcrumbs can be passed directly into this API without changing callers.
 */
export function calculateRideDistance(input: RideDistanceInput): number {
  const route = input.route ?? [];

  if (route.length < 2) {
    return 0;
  }

  let distanceKm = 0;

  for (let index = 1; index < route.length; index += 1) {
    const previousPoint = route[index - 1];
    const currentPoint = route[index];

    if (isValidCoordinate(previousPoint) && isValidCoordinate(currentPoint)) {
      distanceKm += calculateCoordinateDistanceKm(previousPoint, currentPoint);
    }
  }

  return roundTo(distanceKm, 3);
}

/**
 * Calculate distance between two ride points in kilometers.
 */
export function calculateCoordinateDistanceKm(firstPoint: RidePoint, secondPoint: RidePoint): number {
  const firstLatitude = toRadians(firstPoint.latitude);
  const secondLatitude = toRadians(secondPoint.latitude);
  const latitudeDelta = toRadians(secondPoint.latitude - firstPoint.latitude);
  const longitudeDelta = toRadians(secondPoint.longitude - firstPoint.longitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * centralAngle;
}

function isValidCoordinate(point: RidePoint | undefined): point is RidePoint {
  return (
    point !== undefined &&
    Number.isFinite(point.latitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    Number.isFinite(point.longitude) &&
    point.longitude >= -180 &&
    point.longitude <= 180
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function roundTo(value: number, decimals: number) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

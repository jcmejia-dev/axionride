import type {
  DrivingRouteResult,
  RouteCoordinate,
  RoutingService,
} from "./RoutingServiceTypes";

const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";
const ROUTE_TIMEOUT_MS = 15_000;

type OsrmRouteResponse = {
  readonly code?: unknown;
  readonly routes?: unknown;
};

type OsrmRoute = {
  readonly distance?: unknown;
  readonly duration?: unknown;
  readonly geometry?: unknown;
};

type GeoJsonLineString = {
  readonly type?: unknown;
  readonly coordinates?: unknown;
};

export class OsrmRoutingService implements RoutingService {
  async getDrivingRoute(
    origin: RouteCoordinate,
    destination: RouteCoordinate,
  ): Promise<DrivingRouteResult> {
    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      return { ok: false, message: "The route coordinates are invalid." };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);

    try {
      const coordinates = [origin, destination]
        .map((point) => `${point.longitude},${point.latitude}`)
        .join(";");
      const response = await fetch(
        `${OSRM_ROUTE_URL}/${coordinates}?overview=full&geometries=geojson`,
        { headers: { Accept: "application/json" }, signal: controller.signal },
      );

      if (!response.ok) {
        return { ok: false, message: "The route provider is temporarily unavailable." };
      }

      const payload: unknown = await response.json();
      const route = readFirstRoute(payload);
      if (!route) {
        return { ok: false, message: "No drivable route was found for this destination." };
      }

      return { ok: true, route };
    } catch (error) {
      return {
        ok: false,
        message: isAbortError(error)
          ? "Route loading timed out. Please try again."
          : "Connect to the internet to load directions.",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function readFirstRoute(payload: unknown) {
  if (!isRecord(payload)) return null;
  const response = payload as OsrmRouteResponse;
  if (response.code !== "Ok" || !Array.isArray(response.routes)) return null;

  const candidate = response.routes[0];
  if (!isRecord(candidate)) return null;
  const route = candidate as OsrmRoute;
  if (
    typeof route.distance !== "number"
    || !Number.isFinite(route.distance)
    || typeof route.duration !== "number"
    || !Number.isFinite(route.duration)
    || !isRecord(route.geometry)
  ) {
    return null;
  }

  const geometry = route.geometry as GeoJsonLineString;
  if (geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) return null;

  const routeCoordinates = geometry.coordinates.flatMap((coordinate) => {
    if (
      !Array.isArray(coordinate)
      || coordinate.length < 2
      || typeof coordinate[0] !== "number"
      || !Number.isFinite(coordinate[0])
      || typeof coordinate[1] !== "number"
      || !Number.isFinite(coordinate[1])
    ) {
      return [];
    }

    return [{ longitude: coordinate[0], latitude: coordinate[1] }];
  });

  if (routeCoordinates.length < 2) return null;

  return {
    coordinates: routeCoordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

function isValidCoordinate(coordinate: RouteCoordinate) {
  return Number.isFinite(coordinate.latitude)
    && coordinate.latitude >= -90
    && coordinate.latitude <= 90
    && Number.isFinite(coordinate.longitude)
    && coordinate.longitude >= -180
    && coordinate.longitude <= 180;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

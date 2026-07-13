export type RouteCoordinate = {
  readonly latitude: number;
  readonly longitude: number;
};

export type DrivingRoute = {
  readonly coordinates: readonly RouteCoordinate[];
  readonly distanceMeters: number;
  readonly durationSeconds: number;
};

export type DrivingRouteResult =
  | { readonly ok: true; readonly route: DrivingRoute }
  | { readonly ok: false; readonly message: string };

export type RoutingService = {
  getDrivingRoute(
    origin: RouteCoordinate,
    destination: RouteCoordinate,
  ): Promise<DrivingRouteResult>;
};

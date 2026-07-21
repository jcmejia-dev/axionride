/**
 * Planned trip domain types for AxionRide.
 */

export type PlannedTripId = string;
export type TripWaypointId = string;
export type TripStatus =
  | "draft"
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

/**
 * Canonical PlannedTrip domain model.
 */
export type PlannedTrip = {
  readonly id: PlannedTripId;
  readonly workspaceId: string;
  readonly motorcycleId: string;
  readonly title: string;
  readonly notes?: string;
  readonly startLatitude: number;
  readonly startLongitude: number;
  readonly startLabel?: string;
  readonly destinationLatitude: number;
  readonly destinationLongitude: number;
  readonly destinationLabel?: string;
  readonly routeDistanceMeters?: number;
  readonly routeDurationSeconds?: number;
  readonly routeGeometryJson?: string;
  readonly status: TripStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string | null;
};

/**
 * Canonical TripWaypoint domain model.
 */
export type TripWaypoint = {
  readonly id: TripWaypointId;
  readonly tripId: PlannedTripId;
  readonly sequence: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly label?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * Input for creating a planned trip.
 */
export type CreatePlannedTripInput = {
  readonly motorcycleId: string;
  readonly title: string;
  readonly notes?: string;
  readonly startLatitude: number;
  readonly startLongitude: number;
  readonly startLabel?: string;
  readonly destinationLatitude: number;
  readonly destinationLongitude: number;
  readonly destinationLabel?: string;
  readonly status?: TripStatus;
};

/**
 * Input for updating a planned trip.
 */
export type UpdatePlannedTripInput = Partial<
  Omit<CreatePlannedTripInput, "motorcycleId">
> & {
  readonly id: PlannedTripId;
};

/**
 * Input for creating a trip waypoint.
 */
export type CreateTripWaypointInput = {
  readonly tripId: PlannedTripId;
  readonly sequence: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly label?: string;
};

/**
 * Input for updating a trip waypoint.
 */
export type UpdateTripWaypointInput = Partial<
  Omit<CreateTripWaypointInput, "tripId">
> & {
  readonly id: TripWaypointId;
};

import type {
    CreatePlannedTripInput,
    PlannedTrip,
    PlannedTripId,
    UpdatePlannedTripInput,
} from "@/src/domain/trip";
import type { PlannedTripRepository } from "./PlannedTripRepository";

/**
 * Deterministic in-memory PlannedTrip repository for demos and tests.
 */
export class InMemoryPlannedTripRepository implements PlannedTripRepository {
  private readonly trips = new Map<PlannedTripId, PlannedTrip>();

  constructor(initialTrips: readonly PlannedTrip[] = []) {
    for (const trip of initialTrips) {
      this.trips.set(trip.id, cloneTrip(trip));
    }
  }

  async getAll(workspaceId: string): Promise<readonly PlannedTrip[]> {
    return Array.from(this.trips.values(), cloneTrip);
  }

  async getById(id: PlannedTripId): Promise<PlannedTrip | null> {
    const trip = this.trips.get(id);
    return trip ? cloneTrip(trip) : null;
  }

  async getByMotorcycleId(
    motorcycleId: string,
  ): Promise<readonly PlannedTrip[]> {
    const items: PlannedTrip[] = [];
    for (const trip of this.trips.values()) {
      if (trip.motorcycleId === motorcycleId) {
        items.push(cloneTrip(trip));
      }
    }
    return items;
  }

  async create(input: CreatePlannedTripInput): Promise<PlannedTrip> {
    const id = `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const trip: PlannedTrip = {
      id,
      workspaceId: "workspace-anonymous",
      motorcycleId: input.motorcycleId,
      title: input.title,
      notes: input.notes,
      startLatitude: input.startLatitude,
      startLongitude: input.startLongitude,
      startLabel: input.startLabel,
      destinationLatitude: input.destinationLatitude,
      destinationLongitude: input.destinationLongitude,
      destinationLabel: input.destinationLabel,
      status: input.status || "draft",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.trips.set(id, trip);
    return cloneTrip(trip);
  }

  async update(input: UpdatePlannedTripInput): Promise<PlannedTrip> {
    const existing = this.trips.get(input.id);
    if (!existing) {
      throw new Error(`PlannedTrip not found: ${input.id}`);
    }

    const now = new Date().toISOString();
    const updated: PlannedTrip = {
      ...existing,
      title: input.title ?? existing.title,
      notes: input.notes ?? existing.notes,
      startLatitude: input.startLatitude ?? existing.startLatitude,
      startLongitude: input.startLongitude ?? existing.startLongitude,
      startLabel: input.startLabel ?? existing.startLabel,
      destinationLatitude:
        input.destinationLatitude ?? existing.destinationLatitude,
      destinationLongitude:
        input.destinationLongitude ?? existing.destinationLongitude,
      destinationLabel: input.destinationLabel ?? existing.destinationLabel,
      status: input.status ?? existing.status,
      updatedAt: now,
    };

    this.trips.set(input.id, updated);
    return cloneTrip(updated);
  }

  async softDelete(id: PlannedTripId): Promise<void> {
    const existing = this.trips.get(id);
    if (!existing) {
      throw new Error(`PlannedTrip not found: ${id}`);
    }

    const deleted: PlannedTrip = {
      ...existing,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.trips.set(id, deleted);
  }
}

function cloneTrip(trip: PlannedTrip): PlannedTrip {
  return { ...trip };
}

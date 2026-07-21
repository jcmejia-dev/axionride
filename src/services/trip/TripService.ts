import type {
  CreatePlannedTripInput,
  PlannedTrip,
  UpdatePlannedTripInput,
} from "@/src/domain/trip";
import type { PlannedTripRepository } from "@/src/repositories/trip";
import { BaseService } from "../BaseService";
import type { ServiceContext } from "../ServiceContext";
import type { ServiceResult } from "../ServiceTypes";

export class TripService extends BaseService {
  constructor(
    context: ServiceContext,
    private readonly repositories: {
      readonly trips: PlannedTripRepository;
    },
  ) {
    super(context);
  }

  async createTrip(
    input: CreatePlannedTripInput,
  ): Promise<ServiceResult<PlannedTrip>> {
    const trip = await this.repositories.trips.create(input);
    return this.success(trip);
  }

  async updateTrip(
    input: UpdatePlannedTripInput,
  ): Promise<ServiceResult<PlannedTrip>> {
    const trip = await this.repositories.trips.update(input);
    return this.success(trip);
  }

  async deleteTrip(id: string): Promise<ServiceResult<void>> {
    await this.repositories.trips.softDelete(id);
    return this.success(undefined);
  }

  async getTripHistory(
    motorcycleId: string,
  ): Promise<ServiceResult<readonly PlannedTrip[]>> {
    const trips = await this.repositories.trips.getByMotorcycleId(motorcycleId);
    return this.success(trips);
  }
}
